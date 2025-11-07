from __future__ import annotations

from django.db import migrations


def seed_sweets(apps, schema_editor):
    Sweet = apps.get_model("api", "Sweet")

    records = [
        {
            "name": "南珉貞",
            "description": (
                "國別：越南妹\n"
                "年齡：20\n"
                "身高：163\n"
                "體重：43\n"
                "罩杯：E\n"
                "環境：套房\n"
                "長鐘：50 分鐘\n"
                "短鐘：30 分鐘\n"
                "類型：定點\n"
                "定點長鐘：3400\n"
                "定點短鐘：3100\n"
                "地區：高雄"
            ),
            "image_url": "/static/api/sweets/nanminzhen.png",
            "tag": "高雄, 定點",
        },
        {
            "name": "天使",
            "description": (
                "國別：越南妹\n"
                "年齡：暫無\n"
                "身高：161\n"
                "體重：43\n"
                "罩杯：G\n"
                "環境：套房\n"
                "長鐘：50 分鐘\n"
                "短鐘：30 分鐘\n"
                "類型：定點\n"
                "定點長鐘：3400\n"
                "定點短鐘：3100\n"
                "地區：高雄"
            ),
            "image_url": "/static/api/sweets/angel.png",
            "tag": "高雄, 定點",
        },
        {
            "name": "小薇薇",
            "description": (
                "國別：越南妹\n"
                "年齡：21\n"
                "身高：163\n"
                "體重：43\n"
                "罩杯：E\n"
                "環境：套房\n"
                "長鐘：50 分鐘\n"
                "短鐘：30 分鐘\n"
                "類型：定點\n"
                "定點長鐘：3300\n"
                "定點短鐘：3000\n"
                "地區：高雄"
            ),
            "image_url": "/static/api/sweets/xiaowewei.png",
            "tag": "高雄, 定點",
        },
        {
            "name": "真姬",
            "description": (
                "國別：越南妹\n"
                "年齡：暫無\n"
                "身高：160\n"
                "體重：43\n"
                "罩杯：G\n"
                "環境：套房\n"
                "長鐘：50 分鐘\n"
                "短鐘：30 分鐘\n"
                "類型：定點\n"
                "定點長鐘：3400\n"
                "定點短鐘：3100\n"
                "地區：高雄"
            ),
            "image_url": "/static/api/sweets/zhenji.png",
            "tag": "高雄, 定點",
        },
        {
            "name": "倪軒",
            "description": (
                "國別：越南妹\n"
                "年齡：23\n"
                "身高：163\n"
                "體重：43\n"
                "罩杯：D\n"
                "環境：套房\n"
                "長鐘：50 分鐘\n"
                "短鐘：30 分鐘\n"
                "類型：定點\n"
                "定點長鐘：3300\n"
                "定點短鐘：3000\n"
                "地區：高雄"
            ),
            "image_url": "/static/api/sweets/nixuan.png",
            "tag": "高雄, 定點",
        },
    ]

    for record in records:
        Sweet.objects.update_or_create(name=record["name"], defaults=record)


def unseed_sweets(apps, schema_editor):
    Sweet = apps.get_model("api", "Sweet")
    Sweet.objects.filter(name__in=["南珉貞", "天使", "小薇薇", "真姬", "倪軒"]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_sweets, reverse_code=unseed_sweets),
    ]
