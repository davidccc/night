from __future__ import annotations

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0004_sweet_additional_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="sweet",
            name="location",
            field=models.ForeignKey(
                db_column="location_id",
                db_constraint=False,
                on_delete=models.PROTECT,
                related_name="sweets",
                to="api.location",
            ),
        ),
        migrations.AlterField(
            model_name="booking",
            name="sweet",
            field=models.ForeignKey(
                db_column="sweet_id",
                db_constraint=False,
                on_delete=models.CASCADE,
                related_name="bookings",
                to="api.sweet",
            ),
        ),
        migrations.AlterField(
            model_name="booking",
            name="user",
            field=models.ForeignKey(
                db_column="user_id",
                db_constraint=False,
                on_delete=models.CASCADE,
                related_name="bookings",
                to="api.lineuser",
            ),
        ),
        migrations.AlterField(
            model_name="rewardlog",
            name="user",
            field=models.ForeignKey(
                db_column="user_id",
                db_constraint=False,
                on_delete=models.CASCADE,
                related_name="reward_logs",
                to="api.lineuser",
            ),
        ),
    ]
