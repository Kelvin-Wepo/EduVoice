"""
URL configuration for documents app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentViewSet, CourseViewSet

app_name = 'documents'

# Separate routers to avoid conflicts
document_router = DefaultRouter()
document_router.register(r'', DocumentViewSet, basename='document')

course_router = DefaultRouter()
course_router.register(r'', CourseViewSet, basename='course')

urlpatterns = [
    path('courses/', include(course_router.urls)),
    path('', include(document_router.urls)),
]
