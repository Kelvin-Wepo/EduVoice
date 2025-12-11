"""
Serializers for audio files.
"""
from rest_framework import serializers
from .models import AudioFile
from documents.serializers import DocumentSerializer


class AudioFileSerializer(serializers.ModelSerializer):
    """Serializer for audio files."""
    document_title = serializers.CharField(source='document.title', read_only=True)
    audio_url = serializers.SerializerMethodField()
    file_size_mb = serializers.SerializerMethodField()
    
    class Meta:
        model = AudioFile
        fields = [
            'id', 'document', 'document_title', 'audio_file', 'audio_url',
            'duration', 'voice_type', 'speech_rate', 'language',
            'status', 'error_message', 'download_count',
            'file_size_mb', 'generated_date', 'updated_at'
        ]
        read_only_fields = [
            'id', 'audio_file', 'duration', 'status', 'error_message',
            'download_count', 'generated_date', 'updated_at'
        ]
    
    def get_audio_url(self, obj):
        request = self.context.get('request')
        if obj.audio_file and request:
            return request.build_absolute_uri(obj.audio_file.url)
        return None
    
    def get_file_size_mb(self, obj):
        if obj.file_size:
            return round(obj.file_size / (1024 * 1024), 2)
        return 0


class AudioFileDetailSerializer(AudioFileSerializer):
    """Detailed serializer for audio files with document info."""
    document = DocumentSerializer(read_only=True)
    
    class Meta(AudioFileSerializer.Meta):
        fields = AudioFileSerializer.Meta.fields


class AudioConversionRequestSerializer(serializers.Serializer):
    """Serializer for audio conversion request."""
    voice_type = serializers.ChoiceField(
        choices=['male', 'female'],
        default='female'
    )
    speech_rate = serializers.FloatField(
        default=1.0,
        min_value=0.5,
        max_value=2.0
    )
    language = serializers.ChoiceField(
        choices=['en', 'es', 'fr'],
        default='en'
    )
