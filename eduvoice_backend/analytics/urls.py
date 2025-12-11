"""
URL configuration for analytics app.
"""
from django.urls import path
from .views import user_statistics, admin_statistics, log_activity

app_name = 'analytics'

urlpatterns = [
    path('user-stats/', user_statistics, name='user-stats'),
    path('admin-stats/', admin_statistics, name='admin-stats'),
    path('log-activity/', log_activity, name='log-activity'),
]
