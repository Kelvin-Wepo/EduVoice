from django.contrib import admin
from .models import Course, Document


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'created_by', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'code', 'description']
    filter_horizontal = ['students']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'file_type', 'uploaded_by', 'course', 'status', 'file_size', 'upload_date']
    list_filter = ['file_type', 'status', 'upload_date', 'is_public']
    search_fields = ['title', 'description', 'subject']
    readonly_fields = ['file_size', 'upload_date', 'updated_at', 'extracted_text']
    date_hierarchy = 'upload_date'
