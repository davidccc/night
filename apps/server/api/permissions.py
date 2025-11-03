from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import BasePermission


class IsLineAuthenticated(BasePermission):
    """
    Ensures a valid authenticated LineUser is present on the request.
    """

    message = "Invalid or missing token"

    def has_permission(self, request, view) -> bool:
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            raise AuthenticationFailed(self.message)
        return True
