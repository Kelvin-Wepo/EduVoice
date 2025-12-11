from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, AudioPreference


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'role', 'email_verified', 'is_active', 'created_at']
    list_filter = ['role', 'email_verified', 'is_active', 'created_at']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Role & Verification', {
            'fields': ('role', 'email_verified')
        }),
        ('Accessibility Preferences', {
            'fields': ('preferred_voice_type', 'preferred_speech_rate', 'preferred_language',
                      'high_contrast_mode', 'font_size', 'reduced_motion')
        }),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {
            'fields': ('email', 'role')
        }),
    )


@admin.register(AudioPreference)
class AudioPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'default_voice', 'default_speed', 'default_language', 'email_notifications']
    search_fields = ['user__username', 'user__email']
    list_filter = ['email_notifications', 'auto_download']
