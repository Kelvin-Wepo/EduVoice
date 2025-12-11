from django.contrib import admin
from .models import AudioFile


@admin.register(AudioFile)
class AudioFileAdmin(admin.ModelAdmin):
    list_display = ['id', 'document', 'status', 'voice_type', 'speech_rate', 'duration', 'download_count', 'generated_date']
    list_filter = ['status', 'voice_type', 'language', 'generated_date']
    search_fields = ['document__title', 'error_message']
    readonly_fields = ['task_id', 'generated_date', 'updated_at', 'file_size']
    date_hierarchy = 'generated_date'
    
    def file_size(self, obj):
        return f"{obj.file_size / 1024:.2f} KB" if obj.file_size else "N/A"
