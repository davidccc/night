from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
from datetime import timedelta
from typing import Any, Dict
from urllib.parse import parse_qsl, urlencode, urljoin, urlparse, urlunparse

import jwt
from django.conf import settings
from django.http import (
    HttpRequest,
    HttpResponse,
    HttpResponseBadRequest,
    HttpResponseRedirect,
    JsonResponse,
)
from django.shortcuts import redirect
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from . import handlers
from . import line_auth

logger = logging.getLogger(__name__)


def authorize(request: HttpRequest) -> HttpResponse:
    try:
        fallback = get_default_redirect()
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    redirect_target = sanitize_redirect(request.GET.get("redirect"), fallback)
    state = create_state_token({"redirectUrl": redirect_target})

    params = {
        "response_type": "code",
        "client_id": settings.LINE_LOGIN_CHANNEL_ID,
        "redirect_uri": get_callback_url(request),
        "state": state,
        "scope": "profile openid",
    }
    authorize_url = f"https://access.line.me/oauth2/v2.1/authorize?{urlencode(params)}"
    return redirect(authorize_url)


def callback(request: HttpRequest) -> HttpResponse:
    try:
        fallback = get_default_redirect()
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    redirect_target = fallback

    state_param = request.GET.get("state")
    if not state_param:
        return redirect_with_error(fallback, "缺少驗證資訊，請重新登入")

    try:
        payload = verify_state_token(state_param)
        redirect_target = sanitize_redirect(payload.get("redirectUrl"), fallback)
    except Exception:
        return redirect_with_error(fallback, "登入驗證逾時或來源不正確，請重新登入")

    if request.GET.get("error"):
        description = request.GET.get("error_description") or request.GET["error"]
        return redirect_with_error(redirect_target, description)

    authorization_code = request.GET.get("code")
    if not authorization_code:
        return redirect_with_error(redirect_target, "缺少授權碼，登入失敗")

    try:
        result = line_auth.login_with_authorization_code(authorization_code, get_callback_url(request))
    except line_auth.LineAuthError as exc:
        return redirect_with_error(redirect_target, str(exc))

    return redirect_with_params(redirect_target, {"token": result["token"]})


@csrf_exempt
def webhook(request: HttpRequest) -> HttpResponse:
    if request.method == "GET":
        return JsonResponse({"status": "ok", "message": "Use POST to deliver LINE events"})

    if request.method != "POST":
        return HttpResponseBadRequest("Unsupported method")

    signature = request.headers.get("X-Line-Signature")
    if not signature:
        return HttpResponseBadRequest("Missing LINE signature")

    body = request.body
    if not verify_signature(signature, body):
        return HttpResponse(status=401)

    try:
        payload = json.loads(body.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return HttpResponseBadRequest("Invalid payload")

    events = payload.get("events") or []
    for event in events:
        try:
            handlers.handle_event(event)
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.exception("Failed to handle LINE event: %s", exc)
            return HttpResponse(status=500)

    return JsonResponse({"status": "processed", "events": len(events)})


def verify_signature(signature: str, body: bytes) -> bool:
    mac = hmac.new(settings.LINE_CHANNEL_SECRET.encode("utf-8"), body, hashlib.sha256)
    expected = base64.b64encode(mac.digest()).decode()
    return hmac.compare_digest(signature, expected)


def create_state_token(payload: Dict[str, Any]) -> str:
    now = timezone.now()
    state_payload = {**payload, "iat": int(now.timestamp()), "exp": int((now + timedelta(minutes=10)).timestamp())}
    return jwt.encode(state_payload, settings.JWT_SECRET, algorithm="HS256")


def verify_state_token(token: str) -> Dict[str, Any]:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])


def get_server_base_url(request: HttpRequest) -> str:
    if settings.BASE_URL:
        return settings.BASE_URL.rstrip("/")
    scheme = "https" if request.is_secure() else "http"
    return f"{scheme}://{request.get_host()}"


def get_callback_url(request: HttpRequest) -> str:
    return urljoin(get_server_base_url(request) + "/", "line/callback")


def get_default_redirect() -> str:
    if settings.LIFF_BASE_URL:
        return settings.LIFF_BASE_URL
    cors_origins = getattr(settings, "CORS_ALLOWED_ORIGINS", None)
    if cors_origins:
        return cors_origins[0]
    raise ValueError("LIFF_BASE_URL or CORS_ORIGIN must be configured for redirect")


def sanitize_redirect(target: str | None, fallback: str) -> str:
    if not target:
        return fallback

    parsed_fallback = urlparse(fallback)
    if target.startswith("/"):
        return urlunparse((parsed_fallback.scheme, parsed_fallback.netloc, target, "", "", ""))

    parsed_target = urlparse(target)
    if parsed_target.scheme == parsed_fallback.scheme and parsed_target.netloc == parsed_fallback.netloc:
        return target
    return fallback


def redirect_with_error(target: str, message: str) -> HttpResponseRedirect:
    return redirect_with_params(target, {"error": message})


def redirect_with_params(target: str, params: Dict[str, Any]) -> HttpResponseRedirect:
    parsed = urlparse(target)
    existing = dict(parse_qsl(parsed.query, keep_blank_values=True))
    existing.update({k: str(v) for k, v in params.items()})
    new_query = urlencode(existing, doseq=True)
    rebuilt = parsed._replace(query=new_query)
    return redirect(urlunparse(rebuilt))
