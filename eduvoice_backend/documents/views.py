"""
Views for document and course management.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Document, Course
from .serializers import (
    DocumentSerializer,
    DocumentUploadSerializer,
    DocumentDetailSerializer,
    CourseSerializer
)
from .utils import extract_text_from_document
from .permissions import IsTeacherOrAdmin, IsOwnerOrTeacher


class CourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing courses.
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Disable pagination for courses
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter courses based on user role."""
        user = self.request.user
        
        if user.is_admin_role or user.is_teacher:
            # Teachers and admins see courses they created
            return Course.objects.filter(created_by=user)
        else:
            # Students see courses they're enrolled in or public courses
            return Course.objects.filter(
                Q(students=user) | Q(is_active=True)
            ).distinct()
    
    def perform_create(self, serializer):
        """Set created_by to current user."""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def enroll(self, request, pk=None):
        """Enroll current user in course."""
        course = self.get_object()
        user = request.user
        
        if user.is_student:
            course.students.add(user)
            return Response({'message': 'Successfully enrolled in course.'})
        else:
            return Response(
                {'error': 'Only students can enroll in courses.'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def unenroll(self, request, pk=None):
        """Unenroll current user from course."""
        course = self.get_object()
        user = request.user
        
        course.students.remove(user)
        return Response({'message': 'Successfully unenrolled from course.'})


class DocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing documents.
    """
    queryset = Document.objects.all()
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['file_type', 'status', 'course', 'subject']
    search_fields = ['title', 'description', 'subject', 'extracted_text']
    ordering_fields = ['title', 'upload_date', 'file_size']
    ordering = ['-upload_date']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return DocumentUploadSerializer
        elif self.action == 'retrieve':
            return DocumentDetailSerializer
        return DocumentSerializer
    
    def get_queryset(self):
        """Filter documents based on user role and access."""
        user = self.request.user
        
        if user.is_admin_role:
            # Admins see all documents
            return Document.objects.all()
        elif user.is_teacher:
            # Teachers see their own documents and public ones
            return Document.objects.filter(
                Q(uploaded_by=user) | Q(is_public=True)
            ).distinct()
        else:
            # Students see public documents and documents from enrolled courses
            enrolled_courses = user.enrolled_courses.all()
            return Document.objects.filter(
                Q(is_public=True) |
                Q(course__in=enrolled_courses) |
                Q(uploaded_by=user)
            ).distinct()
    
    def perform_create(self, serializer):
        """Create document and extract text."""
        document = serializer.save(uploaded_by=self.request.user)
        
        # Extract text from document asynchronously
        try:
            document.status = Document.Status.PROCESSING
            document.save()
            
            extracted_text = extract_text_from_document(document)
            
            if extracted_text and extracted_text.strip():
                document.extracted_text = extracted_text
                document.status = Document.Status.READY
                document.save()
                # Signal will automatically trigger audio conversion
            else:
                document.status = Document.Status.ERROR
                document.save()
                
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error processing document {document.id}: {str(e)}")
            document.status = Document.Status.ERROR
            document.save()
    
    @action(detail=True, methods=['post'])
    def convert(self, request, pk=None):
        """
        Trigger TTS conversion for document.
        """
        from audio.tasks import convert_document_to_audio
        
        document = self.get_object()
        
        # Get conversion parameters
        voice_type = request.data.get('voice_type', request.user.preferred_voice_type)
        speech_rate = request.data.get('speech_rate', request.user.preferred_speech_rate)
        language = request.data.get('language', request.user.preferred_language)
        
        # Check if document has extracted text
        if not document.extracted_text:
            return Response(
                {'error': 'Document text has not been extracted yet.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Trigger Celery task
        task = convert_document_to_audio.delay(
            document_id=document.id,
            user_id=request.user.id,
            voice_type=voice_type,
            speech_rate=speech_rate,
            language=language
        )
        
        return Response({
            'message': 'Audio conversion started.',
            'task_id': task.id
        }, status=status.HTTP_202_ACCEPTED)
    
    @action(detail=False, methods=['get'])
    def my_documents(self, request):
        """Get documents uploaded by current user."""
        documents = self.get_queryset().filter(uploaded_by=request.user)
        page = self.paginate_queryset(documents)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(documents, many=True)
        return Response(serializer.data)
