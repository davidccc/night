from __future__ import annotations

import django.db.models.deletion
from django.db import migrations, models


def seed_locations(apps, schema_editor):
    Location = apps.get_model("api", "Location")
    Sweet = apps.get_model("api", "Sweet")

    kaohsiung, _ = Location.objects.get_or_create(slug="kaohsiung", defaults={"name": "高雄"})
    Sweet.objects.filter(location__isnull=True).update(location=kaohsiung)


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0002_seed_kaohsiung_sweets"),
    ]

    operations = [
        migrations.CreateModel(
            name="Location",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("slug", models.SlugField(max_length=100, unique=True)),
                ("name", models.CharField(max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_column="created_at")),
                ("updated_at", models.DateTimeField(auto_now=True, db_column="updated_at")),
            ],
            options={
                "db_table": "location_tab",
                "ordering": ["name"],
            },
        ),
        migrations.AlterModelTable(
            name="lineuser",
            table="user_tab",
        ),
        migrations.AlterModelTable(
            name="sweet",
            table="sweet_tab",
        ),
        migrations.AlterModelTable(
            name="booking",
            table="booking_tab",
        ),
        migrations.AlterModelTable(
            name="rewardlog",
            table="reward_log_tab",
        ),
        migrations.AddField(
            model_name="sweet",
            name="location",
            field=models.ForeignKey(
                blank=True,
                db_column="location_id",
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="sweets",
                to="api.location",
            ),
        ),
        migrations.RunPython(seed_locations, reverse_code=migrations.RunPython.noop),
        migrations.AlterField(
            model_name="sweet",
            name="location",
            field=models.ForeignKey(
                db_column="location_id",
                on_delete=django.db.models.deletion.PROTECT,
                related_name="sweets",
                to="api.location",
            ),
        ),
    ]
