"""
URL configuration for audio app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AudioFileViewSet

app_name = 'audio'

router = DefaultRouter()
router.register(r'', AudioFileViewSet, basename='audio')

urlpatterns = [
    path('', include(router.urls)),
]
