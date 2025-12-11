"""
Serializers for documents and courses.
"""
from rest_framework import serializers
from .models import Document, Course
from users.serializers import UserSerializer


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for courses."""
    created_by = UserSerializer(read_only=True)
    student_count = serializers.SerializerMethodField()
    document_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id', 'name', 'description', 'code', 'created_by',
            'is_active', 'student_count', 'document_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_student_count(self, obj):
        return obj.students.count()
    
    def get_document_count(self, obj):
        return obj.documents.count()


class DocumentSerializer(serializers.ModelSerializer):
    """Serializer for documents."""
    uploaded_by = UserSerializer(read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    file_url = serializers.SerializerMethodField()
    has_audio = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = [
            'id', 'title', 'description', 'file', 'file_url', 'file_type',
            'file_size', 'uploaded_by', 'course', 'course_name', 'subject',
            'status', 'is_public', 'has_audio', 'upload_date', 'updated_at'
        ]
        read_only_fields = [
            'id', 'file_size', 'file_type', 'status',
            'upload_date', 'updated_at'
        ]
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None
    
    def get_has_audio(self, obj):
        return obj.audio_files.filter(status='completed').exists()
    
    def validate_file(self, value):
        """Validate file size and type."""
        # Check file size (10MB limit)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError(
                "File size cannot exceed 10MB."
            )
        
        # Check file extension
        allowed_extensions = ['.pdf', '.docx', '.txt']
        ext = value.name.split('.')[-1].lower()
        
        if f'.{ext}' not in allowed_extensions:
            raise serializers.ValidationError(
                f"File type '.{ext}' is not supported. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        return value


class DocumentUploadSerializer(serializers.ModelSerializer):
    """Serializer for document upload."""
    
    class Meta:
        model = Document
        fields = ['title', 'description', 'file', 'course', 'subject', 'is_public']
    
    def validate_file(self, value):
        """Validate file size and type."""
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError(
                "File size cannot exceed 10MB."
            )
        
        allowed_extensions = ['.pdf', '.docx', '.txt']
        ext = value.name.split('.')[-1].lower()
        
        if f'.{ext}' not in allowed_extensions:
            raise serializers.ValidationError(
                f"File type '.{ext}' is not supported. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        return value
    
    def create(self, validated_data):
        """Create document with file metadata."""
        file = validated_data['file']
        
        # Determine file type
        ext = file.name.split('.')[-1].lower()
        validated_data['file_type'] = ext
        validated_data['file_size'] = file.size
        
        return super().create(validated_data)


class DocumentDetailSerializer(DocumentSerializer):
    """Detailed serializer for document with extracted text."""
    audio_files = serializers.SerializerMethodField()
    
    class Meta(DocumentSerializer.Meta):
        fields = DocumentSerializer.Meta.fields + ['extracted_text', 'audio_files']
    
    def get_audio_files(self, obj):
        from audio.serializers import AudioFileSerializer
        audio_files = obj.audio_files.all()
        return AudioFileSerializer(audio_files, many=True, context=self.context).data
