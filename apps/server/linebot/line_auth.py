from __future__ import annotations

import logging
from typing import Any, Dict

import requests
from django.conf import settings

from api import auth as api_auth
from api import services

logger = logging.getLogger(__name__)


class LineAuthError(Exception):
    pass


def verify_id_token(id_token: str) -> Dict[str, Any]:
    payload = {
        "id_token": id_token,
        "client_id": settings.LINE_LOGIN_CHANNEL_ID,
    }
    response = requests.post(
        "https://api.line.me/oauth2/v2.1/verify",
        data=payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=10,
    )
    if not response.ok:
        logger.warning("LINE verify failed: %s %s", response.status_code, response.text[:200])
        raise LineAuthError("LINE verify failed")

    data = response.json()
    if "sub" not in data:
        raise LineAuthError("LINE verify response missing sub")
    return data


def exchange_authorization_code(code: str, redirect_uri: str) -> Dict[str, Any]:
    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
        "client_id": settings.LINE_LOGIN_CHANNEL_ID,
        "client_secret": settings.LINE_LOGIN_CHANNEL_SECRET,
    }
    response = requests.post(
        "https://api.line.me/oauth2/v2.1/token",
        data=payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=10,
    )
    if not response.ok:
        logger.error("LINE token exchange failed: %s %s", response.status_code, response.text[:200])
        raise LineAuthError("LINE token exchange failed")
    return response.json()


def login_with_id_token(id_token: str) -> Dict[str, Any]:
    profile = verify_id_token(id_token)
    user = services.upsert_line_user(
        line_user_id=profile["sub"],
        display_name=profile.get("name"),
        avatar=profile.get("picture"),
    )
    token = api_auth.issue_jwt(user)
    return {"user": user, "token": token}


def login_with_authorization_code(code: str, redirect_uri: str) -> Dict[str, Any]:
    tokens = exchange_authorization_code(code, redirect_uri)
    login_result = login_with_id_token(tokens["id_token"])
    login_result["tokens"] = tokens
    return login_result
