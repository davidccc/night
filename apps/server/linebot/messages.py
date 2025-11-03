from __future__ import annotations

from typing import Any, Dict, List

from django.conf import settings

from api.models import Sweet


def build_default_message() -> Dict[str, Any]:
    return {
        "type": "text",
        "text": "嗨，我是小夜的助理，歡迎你！可輸入「甜心列表」、「預約規則」或「客服」來開始互動唷。",
    }


def build_rules_message() -> Dict[str, Any]:
    return {
        "type": "text",
        "text": "📜 小夜陪伴服務規則\n1) 請保持禮貌與尊重，禁止不當語言。\n2) 預約需提前 1 天提出，臨時取消請告知。\n3) 如需真人客服，輸入「客服」即可為你安排。",
    }


def build_customer_service_message() -> Dict[str, Any]:
    return {
        "type": "text",
        "text": "👩‍💼 已轉接至真人客服，請稍候。\n若客服忙碌，可先留言你的需求與聯絡方式。",
    }


def build_sweet_carousel(sweets: List[Sweet]) -> Dict[str, Any]:
    if not sweets:
        return {
            "type": "text",
            "text": "目前沒有上架的甜心，請稍後再試或聯絡客服唷。",
        }

    bubbles = [build_sweet_bubble(sweet) for sweet in sweets]
    return {
        "type": "flex",
        "altText": "甜心甜點列表",
        "contents": {
            "type": "carousel",
            "contents": bubbles[:12],  # LINE flex carousel limit
        },
    }


def build_sweet_bubble(sweet: Sweet) -> Dict[str, Any]:
    return {
        "type": "bubble",
        "hero": {
            "type": "image",
            "url": resolve_image(sweet.image_url),
            "size": "full",
            "aspectRatio": "20:13",
            "aspectMode": "cover",
        },
        "body": {
            "type": "box",
            "layout": "vertical",
            "contents": build_body_contents(sweet),
        },
        "footer": {
            "type": "box",
            "layout": "vertical",
            "spacing": "sm",
            "contents": [
                {
                    "type": "button",
                    "action": {
                        "type": "message",
                        "label": "預約",
                        "text": f"我想預約 {sweet.name}",
                    },
                    "style": "primary",
                    "color": "#FF5A8C",
                },
                {
                    "type": "button",
                    "action": {
                        "type": "uri",
                        "label": "了解更多",
                        "uri": build_sweet_uri(sweet.id),
                    },
                    "style": "secondary",
                },
            ],
        },
    }


def build_body_contents(sweet: Sweet) -> List[Dict[str, Any]]:
    contents: List[Dict[str, Any]] = [
        {
            "type": "text",
            "text": sweet.name,
            "weight": "bold",
            "size": "lg",
        },
        {
            "type": "text",
            "text": sweet.description,
            "wrap": True,
            "margin": "md",
            "size": "sm",
            "color": "#555555",
        },
    ]

    if sweet.tag:
        contents.append(
            {
                "type": "box",
                "layout": "baseline",
                "margin": "sm",
                "contents": [
                    {
                        "type": "icon",
                        "size": "sm",
                        "url": "https://scdn.line-apps.com/n/channel_devcenter/img/fx/review_gold_star_28.png",
                    },
                    {
                        "type": "text",
                        "text": sweet.tag,
                        "size": "sm",
                        "color": "#FF5A8C",
                        "margin": "xs",
                    },
                ],
            }
        )
    return contents


def resolve_image(image_url: str | None) -> str:
    if not image_url:
        return "https://images.unsplash.com/photo-1492684223066-81342ee5ff30"
    if image_url.startswith("http"):
        return image_url
    base = settings.BASE_URL
    if base:
        base = base.rstrip("/")
        return f"{base}/{image_url.lstrip('/')}"
    return image_url


def build_sweet_uri(sweet_id: int) -> str:
    if settings.LIFF_BASE_URL:
        base = settings.LIFF_BASE_URL.rstrip("/")
        return f"{base}/sweet?id={sweet_id}"
    if settings.BASE_URL:
        return settings.BASE_URL.rstrip("/")
    return "https://liff.line.me"
