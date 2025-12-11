"""
Serializers for user authentication and profile management.
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser, AudioPreference


class AudioPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for audio preferences."""
    
    class Meta:
        model = AudioPreference
        fields = [
            'default_voice', 'default_speed', 'default_language',
            'auto_download', 'email_notifications'
        ]


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile."""
    audio_preferences = AudioPreferenceSerializer(required=False)
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'email_verified', 'preferred_voice_type',
            'preferred_speech_rate', 'preferred_language',
            'high_contrast_mode', 'font_size', 'reduced_motion',
            'audio_preferences', 'created_at'
        ]
        read_only_fields = ['id', 'email_verified', 'created_at']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'role'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = CustomUser.objects.create_user(**validated_data)
        
        # Create default audio preferences
        AudioPreference.objects.create(user=user)
        
        return user


class UserPreferencesSerializer(serializers.ModelSerializer):
    """Serializer for updating user preferences."""
    audio_preferences = AudioPreferenceSerializer(required=False)
    
    class Meta:
        model = CustomUser
        fields = [
            'preferred_voice_type', 'preferred_speech_rate', 'preferred_language',
            'high_contrast_mode', 'font_size', 'reduced_motion',
            'audio_preferences'
        ]
    
    def update(self, instance, validated_data):
        audio_prefs_data = validated_data.pop('audio_preferences', None)
        
        # Update user preferences
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update audio preferences if provided
        if audio_prefs_data:
            audio_prefs, created = AudioPreference.objects.get_or_create(user=instance)
            for attr, value in audio_prefs_data.items():
                setattr(audio_prefs, attr, value)
            audio_prefs.save()
        
        return instance


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change."""
    old_password = serializers.CharField(required=True, style={'input_type': 'password'})
    new_password = serializers.CharField(
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(required=True, style={'input_type': 'password'})
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                "new_password": "Password fields didn't match."
            })
        return attrs
