"""
User models for EduVoice application.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class CustomUser(AbstractUser):
    """
    Custom user model extending Django's AbstractUser.
    Adds role-based access and accessibility preferences.
    """
    
    class Role(models.TextChoices):
        STUDENT = 'student', 'Student'
        TEACHER = 'teacher', 'Teacher'
        ADMIN = 'admin', 'Admin'
    
    class VoiceType(models.TextChoices):
        MALE = 'male', 'Male'
        FEMALE = 'female', 'Female'
    
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.STUDENT,
        db_index=True
    )
    
    email = models.EmailField(unique=True)
    email_verified = models.BooleanField(default=False)
    
    # Accessibility Preferences
    preferred_voice_type = models.CharField(
        max_length=10,
        choices=VoiceType.choices,
        default=VoiceType.FEMALE
    )
    
    preferred_speech_rate = models.FloatField(
        default=1.0,
        validators=[MinValueValidator(0.5), MaxValueValidator(2.0)]
    )
    
    preferred_language = models.CharField(
        max_length=5,
        default='en',
        choices=[
            ('en', 'English'),
            ('es', 'Spanish'),
            ('fr', 'French'),
        ]
    )
    
    # UI Preferences
    high_contrast_mode = models.BooleanField(default=False)
    font_size = models.CharField(
        max_length=15,
        default='medium',
        choices=[
            ('small', 'Small'),
            ('medium', 'Medium'),
            ('large', 'Large'),
            ('extra-large', 'Extra Large'),
        ]
    )
    
    reduced_motion = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_student(self):
        return self.role == self.Role.STUDENT
    
    @property
    def is_teacher(self):
        return self.role == self.Role.TEACHER
    
    @property
    def is_admin_role(self):
        return self.role == self.Role.ADMIN


class AudioPreference(models.Model):
    """
    User's audio preference settings for TTS conversion.
    """
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='audio_preferences'
    )
    
    default_voice = models.CharField(
        max_length=50,
        default='en-US-Standard-A',
        help_text='Google TTS voice identifier'
    )
    
    default_speed = models.FloatField(
        default=1.0,
        validators=[MinValueValidator(0.5), MaxValueValidator(2.0)]
    )
    
    default_language = models.CharField(
        max_length=5,
        default='en'
    )
    
    auto_download = models.BooleanField(
        default=False,
        help_text='Automatically download converted audio files'
    )
    
    email_notifications = models.BooleanField(
        default=True,
        help_text='Receive email when conversion is complete'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'audio_preferences'
    
    def __str__(self):
        return f"Audio preferences for {self.user.username}"
