"""
Analytics models for EduVoice application.
"""
from django.db import models
from django.conf import settings


class UserActivity(models.Model):
    """
    Track user activity for analytics.
    """
    
    class ActivityType(models.TextChoices):
        DOCUMENT_UPLOAD = 'document_upload', 'Document Upload'
        DOCUMENT_VIEW = 'document_view', 'Document View'
        AUDIO_CONVERSION = 'audio_conversion', 'Audio Conversion'
        AUDIO_PLAY = 'audio_play', 'Audio Play'
        AUDIO_DOWNLOAD = 'audio_download', 'Audio Download'
        LOGIN = 'login', 'Login'
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='activities'
    )
    
    activity_type = models.CharField(
        max_length=20,
        choices=ActivityType.choices,
        db_index=True
    )
    
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text='Additional activity data'
    )
    
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'user_activities'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['activity_type', '-timestamp']),
        ]
        verbose_name_plural = 'User activities'
    
    def __str__(self):
        return f"{self.user.username} - {self.get_activity_type_display()} at {self.timestamp}"
