from __future__ import annotations

import logging
from typing import List, Mapping

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class LineMessagingClient:
    def __init__(self, access_token: str) -> None:
        self.access_token = access_token

    def reply_message(self, reply_token: str, messages: List[Mapping]) -> None:
        payload = {
            "replyToken": reply_token,
            "messages": messages,
        }
        response = requests.post(
            "https://api.line.me/v2/bot/message/reply",
            json=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.access_token}",
            },
            timeout=10,
        )
        if not response.ok:
            logger.error("LINE reply failed: %s %s", response.status_code, response.text[:200])
            response.raise_for_status()


client = LineMessagingClient(settings.LINE_CHANNEL_ACCESS_TOKEN)
