from rest_framework import permissions

class IsAdminOnly(permissions.BasePermission):
    """
    Allows access only to users with the 'admin' role.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class IsManagerOrAdmin(permissions.BasePermission):
    """
    Allows access to users with 'admin' or 'manager' roles.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['admin', 'manager']


class IsStaffOrCoordinator(permissions.BasePermission):
    """
    Allows access to users with 'staff' or 'coordinator' roles.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['staff', 'coordinator']


class IsReportOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow creator of a report to edit it (in draft status).
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # but actual filtering takes place at regional / manager levels.
        if request.method in permissions.SAFE_METHODS:
            return True
        # Write permissions are only allowed to the owner.
        return obj.submitted_by == request.user


class HasRegionalAccess(permissions.BasePermission):
    """
    Restricts staff and coordinators to access only records associated with their region.
    Admins and managers can view all regions.
    """
    def has_permission(self, request, view):
        # We can inspect query parameters here if they are filtering, or let the object level catch it.
        # But region is enforced on listing via queryset filtering.
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Admins and managers bypass regional isolation
        if request.user.role in ['admin', 'manager']:
            return True
        
        # Check if the object has a region field
        obj_region = getattr(obj, 'region', None)
        if obj_region is None:
            # If checking a User object, compare regions
            if hasattr(obj, 'role'):
                return request.user.region == obj.region
            return True
            
        return request.user.region == obj_region


class CanApproveReport(permissions.BasePermission):
    """
    Allows access to approve/return report if the user is a manager or admin,
    AND is not the owner of the report (segregation of duties).
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role not in ['admin', 'manager']:
            return False
        # Cannot approve/return own report
        return obj.submitted_by != request.user


class CanViewAllRegions(permissions.BasePermission):
    """
    Allows access to global datasets across all regions.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['admin', 'manager']
