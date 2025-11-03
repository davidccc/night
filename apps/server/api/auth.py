from __future__ import annotations

from datetime import timedelta
from typing import Any, Tuple

import jwt
from django.conf import settings
from django.utils import timezone

from .models import LineUser


class JWTError(Exception):
    pass


def issue_jwt(user: LineUser) -> str:
    now = timezone.now()
    payload = {
        "userId": user.id,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=7)).timestamp()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def decode_jwt(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise JWTError("Invalid or expired token") from exc


def authenticate_token(token: str) -> Tuple[LineUser, dict[str, Any]]:
    payload = decode_jwt(token)
    user_id = payload.get("userId")
    if not isinstance(user_id, int):
        raise JWTError("Invalid token payload")
    user = LineUser.objects.filter(id=user_id).first()
    if not user:
        raise JWTError("User not found")
    return user, payload
