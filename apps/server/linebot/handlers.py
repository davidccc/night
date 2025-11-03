from __future__ import annotations

import logging
from typing import Any, Dict

from django.conf import settings

from api import services
from api.models import Sweet
from .client import client
from . import messages

logger = logging.getLogger(__name__)


def handle_event(event: Dict[str, Any]) -> None:
    if event.get("type") != "message":
        return
    message = event.get("message") or {}
    if message.get("type") != "text":
        return

    text = (message.get("text") or "").strip()

    reply_message = messages.build_default_message()
    if text == "甜心列表":
        sweets = list(services.list_sweets())
        reply_message = messages.build_sweet_carousel(sweets)
    elif text == "預約規則":
        reply_message = messages.build_rules_message()
    elif text == "客服":
        reply_message = messages.build_customer_service_message()

    try:
        client.reply_message(event["replyToken"], [reply_message])
    except Exception as exc:  # pragma: no cover - network failure already logged
        logger.error("Failed to send LINE reply: %s", exc)
