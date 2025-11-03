from __future__ import annotations

from typing import Optional, Tuple

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated

from .auth import JWTError, authenticate_token


class LineJWTAuthentication(BaseAuthentication):
    """
    Simple bearer token authentication backed by our custom JWT payload.
    """

    keyword = "Bearer"

    def authenticate(self, request) -> Optional[Tuple[object, None]]:
        header = request.headers.get("Authorization")
        if not header:
            raise NotAuthenticated("Missing Authorization header")

        parts = header.split(" ", 1)
        if len(parts) != 2 or parts[0] != self.keyword:
            raise AuthenticationFailed("Invalid Authorization header")

        token = parts[1]
        try:
            user, _ = authenticate_token(token)
            return user, None
        except JWTError as exc:
            raise AuthenticationFailed(str(exc)) from exc
