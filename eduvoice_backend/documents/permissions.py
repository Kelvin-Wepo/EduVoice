"""
Custom permissions for documents app.
"""
from rest_framework import permissions


class IsTeacherOrAdmin(permissions.BasePermission):
    """
    Permission to only allow teachers and admins.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.is_teacher or request.user.is_admin_role)
        )


class IsOwnerOrTeacher(permissions.BasePermission):
    """
    Permission to allow owners, teachers, and admins.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions for authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for owner, teachers, or admins
        return (
            obj.uploaded_by == request.user or
            request.user.is_teacher or
            request.user.is_admin_role
        )
