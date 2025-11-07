from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional

from django.conf import settings

from api.models import Location, Sweet


def build_default_message() -> Dict[str, Any]:
    return {
        "type": "text",
        "text": "嗨，我是小夜的助理，歡迎你！可輸入「甜心列表」、「預約規則」或「客服」來開始互動唷。",
    }


def build_rules_message() -> Dict[str, Any]:
    return {
        "type": "text",
        "text": (
            "✦ 定點茶預約小提醒\n"
            "- 先在 LINE 跟小夜說你想約的妹咪、預計的時間和方案，小夜會幫你排得漂漂亮亮～\n"
            "- 確認後就照小夜提供的地址與房號前往，中途若有調整小夜會第一時間更新給你。\n"
            "- 進房先確認妹妹合胃口，滿意再一次付現，全程只收現金、不收點數、不找零，記得準備足夠的百元鈔。\n"
            "- 想加鐘或多一點服務請提早說，價格談妥才不會尷尬；看到超低價照騙要提高警覺，千萬別先匯款。\n"
            "- 任何狀況都可以馬上回報小夜，讓小夜幫你處理，才能輕鬆又安心地享受放鬆時光♡"
        ),
    }


def build_customer_service_message() -> Dict[str, Any]:
    return {
        "type": "text",
        "text": "👩‍💼 已轉接至真人客服，請稍候。\n若客服忙碌，可先留言你的需求與聯絡方式。",
    }


def build_sweet_carousel(sweets: List[Sweet], title: str | None = None) -> Dict[str, Any]:
    if not sweets:
        return {
            "type": "text",
            "text": "目前沒有上架的甜心，請稍後再試或聯絡客服唷。",
        }

    bubbles = [build_sweet_bubble(sweet) for sweet in sweets]
    return {
        "type": "flex",
        "altText": title or "甜心甜點列表",
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
            "aspectRatio": "4:5",
            "aspectMode": "fit",
            "backgroundColor": "#f8f8f8",
        },
        "body": {
            "type": "box",
            "layout": "vertical",
            "spacing": "sm",
            "contents": build_body_contents(sweet),
        },
        "footer": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                {
                    "type": "button",
                    "action": {
                        "type": "message",
                        "label": "預約",
                        "text": f"我想預約 {sweet.name}{f'({sweet.code})' if sweet.code else ''}",
                    },
                    "style": "primary",
                    "color": "#FF5A8C",
                },
            ],
        },
    }


def build_body_contents(sweet: Sweet) -> List[Dict[str, Any]]:
    contents: List[Dict[str, Any]] = []

    title = sweet.name
    if sweet.code:
        title = f"{title} · {sweet.code}"
    contents.append(
        {
            "type": "text",
            "text": title,
            "weight": "bold",
            "size": "lg",
            "wrap": True,
        }
    )

    if sweet.location:
        contents.append(
            {
                "type": "text",
                "text": f"📍 {sweet.location.name}",
                "size": "xs",
                "color": "#8C8C8C",
            }
        )

    info_rows = [
        build_info_row("國籍", sweet.nationality),
        build_info_row("年齡", sweet.age_text),
        build_info_row("身高", format_number(sweet.height_cm, unit="cm")),
        build_info_row("體重", format_number(sweet.weight_kg, unit="kg")),
        build_info_row("罩杯", sweet.cup),
    ]

    price_rows = [
        build_info_row("環境", sweet.environment),
        build_info_row("類型", sweet.service_type),
        build_info_row("長鍾", build_duration_price(sweet.long_duration_minutes, sweet.long_price)),
        build_info_row("短鍾", build_duration_price(sweet.short_duration_minutes, sweet.short_price)),
    ]

    chips = [row for row in info_rows if row]
    price = [row for row in price_rows if row]
    if chips:
        contents.append(
            {
                "type": "box",
                "layout": "vertical",
                "spacing": "xs",
                "margin": "md",
                "contents": chips,
            }
        )

    if price:
        contents.append(
            {
                "type": "box",
                "layout": "vertical",
                "spacing": "xs",
                "margin": "sm",
                "contents": price,
            }
        )

    if sweet.description:
        desc = sweet.description.strip()
        normalized = desc.replace("：", ":")
        duplicated = all(keyword in normalized for keyword in ["國", "身", "罩", "環境"])
        if not duplicated:
            contents.append(
                {
                    "type": "text",
                    "text": desc,
                    "wrap": True,
                    "margin": "md",
                    "size": "xs",
                    "color": "#666666",
                }
            )

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
                        "size": "xs",
                        "color": "#FF5A8C",
                        "margin": "xs",
                    },
                ],
            }
        )
    return contents


def build_location_menu(locations: Iterable[Location]) -> Dict[str, Any]:
    location_list = list(locations)
    if not location_list:
        return {
            "type": "text",
            "text": "目前尚未設定地區，可直接輸入「甜心列表 台北」等字樣查詢。",
        }

    quick_items = []
    for location in location_list[:13]:  # LINE quick reply limit
        quick_items.append(
            {
                "type": "action",
                "action": {
                    "type": "message",
                    "label": location.name,
                    "text": f"{location.name}甜心",
                },
            }
        )

    return {
        "type": "text",
        "text": "請選擇想看的地區：",
        "quickReply": {"items": quick_items},
    }


def build_info_row(label: str, value: Optional[str]) -> Optional[Dict[str, Any]]:
    if not value:
        return None
    return {
        "type": "box",
        "layout": "baseline",
        "contents": [
            {
                "type": "text",
                "text": label,
                "size": "xs",
                "color": "#888888",
                "flex": 3,
            },
            {
                "type": "text",
                "text": value,
                "wrap": True,
                "size": "sm",
                "weight": "bold",
                "color": "#333333",
                "flex": 7,
            },
        ],
    }


def format_number(value: Optional[int], unit: str) -> Optional[str]:
    if value is None:
        return None
    return f"{value} {unit}"


def build_duration_price(duration: Optional[int], price: Optional[int]) -> Optional[str]:
    if duration is None and price is None:
        return None
    if duration is not None and price is not None:
        return f"{duration} 分鐘 / {price}"
    if duration is not None:
        return f"{duration} 分鐘"
    return str(price)


def resolve_image(image_url: str | None) -> str:
    if not image_url:
        return "https://images.unsplash.com/photo-1492684223066-81342ee5ff30"
    if image_url.startswith("http://") or image_url.startswith("https://"):
        return image_url
    if image_url.startswith("/"):
        base = settings.LIFF_BASE_URL or settings.BASE_URL
        if base:
            return f"{base.rstrip('/')}{image_url}"
        return f"https://{settings.ALLOWED_HOSTS[0] if getattr(settings, 'ALLOWED_HOSTS', None) else 'example.com'}{image_url}"
    base = settings.BASE_URL or settings.LIFF_BASE_URL
    if base:
        return f"{base.rstrip('/')}/{image_url.lstrip('/')}"
    base = settings.BASE_URL
    if base:
        return f"{base.rstrip('/')}/{image_url.lstrip('/')}"
    return image_url
