"""
Views for analytics and statistics.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import timedelta
from users.models import CustomUser
from documents.models import Document
from audio.models import AudioFile
from .models import UserActivity


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_statistics(request):
    """
    Get statistics for the current user.
    """
    user = request.user
    
    # Get time range (default: last 30 days)
    days = int(request.GET.get('days', 30))
    start_date = timezone.now() - timedelta(days=days)
    
    # Document statistics
    total_documents = Document.objects.filter(uploaded_by=user).count()
    recent_documents = Document.objects.filter(
        uploaded_by=user,
        upload_date__gte=start_date
    ).count()
    
    # Audio statistics
    total_audio = AudioFile.objects.filter(
        document__uploaded_by=user
    ).count()
    
    completed_audio = AudioFile.objects.filter(
        document__uploaded_by=user,
        status=AudioFile.Status.COMPLETED
    ).count()
    
    total_listening_time = AudioFile.objects.filter(
        document__uploaded_by=user,
        status=AudioFile.Status.COMPLETED
    ).aggregate(total=Sum('duration'))['total'] or 0
    
    total_downloads = AudioFile.objects.filter(
        document__uploaded_by=user
    ).aggregate(total=Sum('download_count'))['total'] or 0
    
    # Activity statistics
    recent_activities = UserActivity.objects.filter(
        user=user,
        timestamp__gte=start_date
    ).values('activity_type').annotate(count=Count('id'))
    
    # Course enrollment
    enrolled_courses = user.enrolled_courses.count() if user.is_student else 0
    created_courses = user.created_courses.count() if user.is_teacher else 0
    
    return Response({
        'user': {
            'username': user.username,
            'role': user.role,
            'member_since': user.created_at
        },
        'documents': {
            'total': total_documents,
            'recent': recent_documents
        },
        'audio': {
            'total': total_audio,
            'completed': completed_audio,
            'processing': total_audio - completed_audio,
            'total_listening_time_minutes': round(total_listening_time / 60, 2),
            'total_downloads': total_downloads
        },
        'courses': {
            'enrolled': enrolled_courses,
            'created': created_courses
        },
        'recent_activities': list(recent_activities),
        'time_range_days': days
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_statistics(request):
    """
    Get system-wide statistics (admin only).
    """
    user = request.user
    
    if not user.is_admin_role:
        return Response(
            {'error': 'Admin access required.'},
            status=403
        )
    
    # Get time range
    days = int(request.GET.get('days', 30))
    start_date = timezone.now() - timedelta(days=days)
    
    # User statistics
    total_users = CustomUser.objects.count()
    new_users = CustomUser.objects.filter(created_at__gte=start_date).count()
    
    users_by_role = CustomUser.objects.values('role').annotate(count=Count('id'))
    
    # Document statistics
    total_documents = Document.objects.count()
    recent_documents = Document.objects.filter(upload_date__gte=start_date).count()
    
    documents_by_type = Document.objects.values('file_type').annotate(count=Count('id'))
    
    total_storage = Document.objects.aggregate(total=Sum('file_size'))['total'] or 0
    
    # Audio statistics
    total_audio = AudioFile.objects.count()
    completed_audio = AudioFile.objects.filter(status=AudioFile.Status.COMPLETED).count()
    failed_audio = AudioFile.objects.filter(status=AudioFile.Status.FAILED).count()
    
    total_audio_storage = sum(
        af.file_size for af in AudioFile.objects.filter(status=AudioFile.Status.COMPLETED)
    )
    
    avg_conversion_per_user = AudioFile.objects.values('document__uploaded_by').annotate(
        count=Count('id')
    ).aggregate(avg=Avg('count'))['avg'] or 0
    
    # Course statistics
    from documents.models import Course
    total_courses = Course.objects.count()
    active_courses = Course.objects.filter(is_active=True).count()
    
    # Activity statistics
    recent_activities = UserActivity.objects.filter(
        timestamp__gte=start_date
    ).values('activity_type').annotate(count=Count('id'))
    
    # Most active users
    most_active_users = UserActivity.objects.filter(
        timestamp__gte=start_date
    ).values('user__username', 'user__role').annotate(
        activity_count=Count('id')
    ).order_by('-activity_count')[:10]
    
    # Most converted documents
    most_converted = Document.objects.annotate(
        audio_count=Count('audio_files')
    ).order_by('-audio_count')[:10].values('title', 'audio_count')
    
    return Response({
        'users': {
            'total': total_users,
            'new_users': new_users,
            'by_role': list(users_by_role)
        },
        'documents': {
            'total': total_documents,
            'recent': recent_documents,
            'by_type': list(documents_by_type),
            'total_storage_mb': round(total_storage / (1024 * 1024), 2)
        },
        'audio': {
            'total': total_audio,
            'completed': completed_audio,
            'failed': failed_audio,
            'success_rate': round((completed_audio / total_audio * 100) if total_audio > 0 else 0, 2),
            'total_storage_mb': round(total_audio_storage / (1024 * 1024), 2),
            'avg_conversions_per_user': round(avg_conversion_per_user, 2)
        },
        'courses': {
            'total': total_courses,
            'active': active_courses
        },
        'recent_activities': list(recent_activities),
        'most_active_users': list(most_active_users),
        'most_converted_documents': list(most_converted),
        'time_range_days': days
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_activity(request):
    """
    Log user activity.
    """
    activity_type = request.data.get('activity_type')
    metadata = request.data.get('metadata', {})
    
    if not activity_type:
        return Response(
            {'error': 'activity_type is required.'},
            status=400
        )
    
    # Validate activity type
    valid_types = [choice[0] for choice in UserActivity.ActivityType.choices]
    if activity_type not in valid_types:
        return Response(
            {'error': f'Invalid activity_type. Must be one of: {", ".join(valid_types)}'},
            status=400
        )
    
    # Create activity log
    activity = UserActivity.objects.create(
        user=request.user,
        activity_type=activity_type,
        metadata=metadata
    )
    
    return Response({
        'id': activity.id,
        'activity_type': activity.activity_type,
        'timestamp': activity.timestamp
    })
