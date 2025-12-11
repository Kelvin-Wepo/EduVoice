"""
Document and Course models for EduVoice application.
"""
import os
import uuid
from django.db import models
from django.conf import settings
from django.core.validators import FileExtensionValidator


def document_upload_path(instance, filename):
    """Generate upload path for documents."""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('documents', str(instance.uploaded_by.id), filename)


class Course(models.Model):
    """
    Course model for organizing documents.
    """
    name = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True)
    code = models.CharField(max_length=20, unique=True, help_text='Course code (e.g., CS101)')
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_courses'
    )
    
    students = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='enrolled_courses',
        blank=True
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'courses'
        ordering = ['-created_at']
        unique_together = ['name', 'created_by']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class Document(models.Model):
    """
    Document model for uploaded files.
    """
    
    class FileType(models.TextChoices):
        PDF = 'pdf', 'PDF'
        DOCX = 'docx', 'DOCX'
        TXT = 'txt', 'TXT'
    
    class Status(models.TextChoices):
        UPLOADED = 'uploaded', 'Uploaded'
        PROCESSING = 'processing', 'Processing'
        READY = 'ready', 'Ready'
        ERROR = 'error', 'Error'
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    file = models.FileField(
        upload_to=document_upload_path,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'docx', 'txt'])]
    )
    
    file_type = models.CharField(
        max_length=10,
        choices=FileType.choices
    )
    
    file_size = models.IntegerField(help_text='File size in bytes')
    
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploaded_documents'
    )
    
    course = models.ForeignKey(
        Course,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documents'
    )
    
    subject = models.CharField(max_length=100, blank=True, db_index=True)
    
    extracted_text = models.TextField(blank=True, help_text='Extracted text content')
    
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.UPLOADED,
        db_index=True
    )
    
    is_public = models.BooleanField(
        default=False,
        help_text='Make document accessible to all students'
    )
    
    upload_date = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'documents'
        ordering = ['-upload_date']
        indexes = [
            models.Index(fields=['uploaded_by', '-upload_date']),
            models.Index(fields=['course', '-upload_date']),
        ]
    
    def __str__(self):
        return self.title
    
    @property
    def file_extension(self):
        return os.path.splitext(self.file.name)[1].lower()
    
    def delete(self, *args, **kwargs):
        """Delete file when document is deleted."""
        if self.file:
            if os.path.isfile(self.file.path):
                os.remove(self.file.path)
        super().delete(*args, **kwargs)
