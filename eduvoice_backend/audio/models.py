"""
Audio models for EduVoice application.
"""
import os
import uuid
from django.db import models
from django.conf import settings
from documents.models import Document


def audio_upload_path(instance, filename):
    """Generate upload path for audio files."""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('audio', str(instance.document.uploaded_by.id), filename)


class AudioFile(models.Model):
    """
    Audio file model for TTS-generated audio.
    """
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSING = 'processing', 'Processing'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'
    
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='audio_files'
    )
    
    audio_file = models.FileField(
        upload_to=audio_upload_path,
        blank=True,
        null=True
    )
    
    duration = models.FloatField(
        null=True,
        blank=True,
        help_text='Audio duration in seconds'
    )
    
    voice_type = models.CharField(
        max_length=50,
        default='female',
        help_text='Voice type used for TTS'
    )
    
    speech_rate = models.FloatField(
        default=1.0,
        help_text='Speech rate (0.5x to 2x)'
    )
    
    language = models.CharField(
        max_length=5,
        default='en',
        help_text='Language code'
    )
    
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    
    error_message = models.TextField(
        blank=True,
        help_text='Error message if conversion failed'
    )
    
    task_id = models.CharField(
        max_length=255,
        blank=True,
        help_text='Celery task ID'
    )
    
    download_count = models.IntegerField(default=0)
    
    generated_date = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'audio_files'
        ordering = ['-generated_date']
        indexes = [
            models.Index(fields=['document', '-generated_date']),
            models.Index(fields=['status', '-generated_date']),
        ]
    
    def __str__(self):
        return f"Audio for {self.document.title} ({self.get_status_display()})"
    
    def delete(self, *args, **kwargs):
        """Delete audio file when record is deleted."""
        if self.audio_file:
            if os.path.isfile(self.audio_file.path):
                os.remove(self.audio_file.path)
        super().delete(*args, **kwargs)
    
    @property
    def file_size(self):
        """Get audio file size in bytes."""
        if self.audio_file and os.path.isfile(self.audio_file.path):
            return os.path.getsize(self.audio_file.path)
        return 0
