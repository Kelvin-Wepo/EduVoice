"""
Views for audio file management.
"""
import os
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.http import FileResponse, HttpResponse
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from celery.result import AsyncResult
from .models import AudioFile
from .serializers import AudioFileSerializer, AudioFileDetailSerializer
from documents.models import Document


class AudioFileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for managing audio files.
    Read-only because audio files are created through document conversion.
    """
    queryset = AudioFile.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'voice_type', 'language']
    search_fields = ['document__title', 'document__subject']
    ordering_fields = ['generated_date', 'duration', 'download_count']
    ordering = ['-generated_date']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AudioFileDetailSerializer
        return AudioFileSerializer
    
    def get_queryset(self):
        """Filter audio files based on user access to documents."""
        user = self.request.user
        
        if user.is_admin_role:
            return AudioFile.objects.all()
        
        # Get accessible documents
        if user.is_teacher:
            accessible_docs = Document.objects.filter(
                Q(uploaded_by=user) | Q(is_public=True)
            )
        else:
            enrolled_courses = user.enrolled_courses.all()
            accessible_docs = Document.objects.filter(
                Q(is_public=True) |
                Q(course__in=enrolled_courses) |
                Q(uploaded_by=user)
            )
        
        return AudioFile.objects.filter(
            document__in=accessible_docs,
            status=AudioFile.Status.COMPLETED
        )
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download audio file."""
        audio_file = self.get_object()
        
        if not audio_file.audio_file:
            return Response(
                {'error': 'Audio file not available.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Increment download count
        audio_file.download_count += 1
        audio_file.save(update_fields=['download_count'])
        
        # Serve file
        file_path = audio_file.audio_file.path
        
        if os.path.exists(file_path):
            response = FileResponse(
                open(file_path, 'rb'),
                content_type='audio/mpeg'
            )
            response['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_path)}"'
            return response
        else:
            return Response(
                {'error': 'File not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'], permission_classes=[])
    def stream(self, request, pk=None):
        """
        Stream audio file with token authentication.
        Accepts token as query parameter for HTML5 audio compatibility.
        """
        # Handle token from query parameter (for audio/video elements)
        token = request.query_params.get('token')
        
        if token:
            try:
                # Validate JWT token
                jwt_auth = JWTAuthentication()
                validated_token = jwt_auth.get_validated_token(token)
                user = jwt_auth.get_user(validated_token)
                request.user = user
            except (InvalidToken, TokenError) as e:
                return HttpResponse(
                    'Invalid or expired token',
                    status=401,
                    content_type='text/plain'
                )
        elif not request.user.is_authenticated:
            return HttpResponse(
                'Authentication required',
                status=401,
                content_type='text/plain'
            )
        
        # Get audio file
        try:
            audio_file = AudioFile.objects.get(pk=pk)
        except AudioFile.DoesNotExist:
            return HttpResponse(
                'Audio file not found',
                status=404,
                content_type='text/plain'
            )
        
        # Check if user has access to this audio file's document
        user = request.user
        document = audio_file.document
        
        has_access = False
        if user.is_admin_role:
            has_access = True
        elif document.is_public:
            has_access = True
        elif document.uploaded_by == user:
            has_access = True
        elif user.is_teacher:
            has_access = True
        elif document.course and document.course in user.enrolled_courses.all():
            has_access = True
        
        if not has_access:
            return HttpResponse(
                'Access denied',
                status=403,
                content_type='text/plain'
            )
        
        # Check if file exists
        if not audio_file.audio_file:
            return HttpResponse(
                'Audio file not available',
                status=404,
                content_type='text/plain'
            )
        
        file_path = audio_file.audio_file.path
        
        if not os.path.exists(file_path):
            return HttpResponse(
                'File not found on disk',
                status=404,
                content_type='text/plain'
            )
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Handle range requests for seeking in audio
        range_header = request.META.get('HTTP_RANGE', '').strip()
        
        if range_header:
            # Parse range header
            range_match = range_header.replace('bytes=', '').split('-')
            start = int(range_match[0]) if range_match[0] else 0
            end = int(range_match[1]) if len(range_match) > 1 and range_match[1] else file_size - 1
            
            # Open file and seek to start position
            file_handle = open(file_path, 'rb')
            file_handle.seek(start)
            
            # Create partial content response
            response = HttpResponse(
                file_handle.read(end - start + 1),
                status=206,
                content_type='audio/mpeg'
            )
            response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
            response['Content-Length'] = str(end - start + 1)
            response['Accept-Ranges'] = 'bytes'
        else:
            # Serve entire file
            response = FileResponse(
                open(file_path, 'rb'),
                content_type='audio/mpeg'
            )
            response['Content-Length'] = str(file_size)
            response['Accept-Ranges'] = 'bytes'
        
        # Add headers for inline playback
        response['Content-Disposition'] = 'inline'
        response['Cache-Control'] = 'public, max-age=3600'
        
        # Add CORS headers for audio streaming
        origin = request.META.get('HTTP_ORIGIN')
        if origin:
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Range, Authorization'
            response['Access-Control-Expose-Headers'] = 'Content-Length, Content-Range, Accept-Ranges'
        
        return response
    
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """Get conversion status for audio file."""
        audio_file = self.get_object()
        
        response_data = {
            'id': audio_file.id,
            'status': audio_file.status,
            'progress': None
        }
        
        if audio_file.task_id and audio_file.status == AudioFile.Status.PROCESSING:
            # Check Celery task status
            task = AsyncResult(audio_file.task_id)
            response_data['progress'] = {
                'state': task.state,
                'info': task.info if task.info else None
            }
        
        if audio_file.status == AudioFile.Status.FAILED:
            response_data['error_message'] = audio_file.error_message
        
        return Response(response_data)
    
    @action(detail=False, methods=['get'])
    def my_audio(self, request):
        """Get audio files for documents uploaded by current user."""
        user_documents = Document.objects.filter(uploaded_by=request.user)
        audio_files = self.get_queryset().filter(document__in=user_documents)
        
        page = self.paginate_queryset(audio_files)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(audio_files, many=True)
        return Response(serializer.data)