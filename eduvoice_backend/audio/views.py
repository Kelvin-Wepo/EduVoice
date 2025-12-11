"""
Views for audio file management.
"""
import os
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
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
    
    @action(detail=True, methods=['get'])
    def stream(self, request, pk=None):
        """Stream audio file."""
        audio_file = self.get_object()
        
        if not audio_file.audio_file:
            return Response(
                {'error': 'Audio file not available.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        file_path = audio_file.audio_file.path
        
        if os.path.exists(file_path):
            response = FileResponse(
                open(file_path, 'rb'),
                content_type='audio/mpeg'
            )
            response['Content-Disposition'] = 'inline'
            return response
        else:
            return Response(
                {'error': 'File not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
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
