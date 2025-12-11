"""
URL configuration for users app.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    UserRegistrationView,
    UserProfileView,
    UserPreferencesView,
    PasswordChangeView,
    logout_view
)

app_name = 'users'

urlpatterns = [
    # Authentication endpoints
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('logout/', logout_view, name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User profile endpoints
    path('user/', UserProfileView.as_view(), name='user-profile'),
    path('user/preferences/', UserPreferencesView.as_view(), name='user-preferences'),
    path('user/change-password/', PasswordChangeView.as_view(), name='change-password'),
]
