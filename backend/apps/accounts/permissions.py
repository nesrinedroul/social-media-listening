from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == 'admin'
        )


class IsAdminOrSupervisor(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ('admin', 'supervisor')
        )


class IsAgent(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == 'agent'
        )


class IsAgentOrSupervisor(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ('agent', 'supervisor')
        )


class IsAnyRole(BasePermission):
    """Allows any authenticated user regardless of role"""
    def has_permission(self, request, view):
        return request.user.is_authenticated