from __future__ import annotations

import logging
from typing import Any, Dict

from django.conf import settings

from api import services
from api.models import Location, Sweet
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
        locations = list(Location.objects.order_by("name"))
        reply_message = messages.build_location_menu(locations)
    elif location := find_location_from_text(text):
        sweets = list(services.list_sweets(location_slug=location.slug))
        reply_message = messages.build_sweet_carousel(sweets, title=f"{location.name}甜心")
    elif text == "預約規則":
        reply_message = messages.build_rules_message()
    elif text == "客服":
        reply_message = messages.build_customer_service_message()

    try:
        client.reply_message(event["replyToken"], [reply_message])
    except Exception as exc:  # pragma: no cover - network failure already logged
        logger.error("Failed to send LINE reply: %s", exc)


def find_location_from_text(text: str) -> Location | None:
    normalized = text.replace("甜心列表", "").replace("甜心", "").replace("地區", "").strip()
    if not normalized:
        normalized = text

    lowered = normalized.lower()
    for location in Location.objects.all():
        if location.name in text:
            return location
        if location.slug and location.slug.lower() in lowered:
            return location
    return None
