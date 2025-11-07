from __future__ import annotations

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0003_location_and_table_updates"),
    ]

    operations = [
        migrations.AddField(
            model_name="sweet",
            name="age_text",
            field=models.CharField(blank=True, db_column="age_text", max_length=50),
        ),
        migrations.AddField(
            model_name="sweet",
            name="cup",
            field=models.CharField(blank=True, db_column="cup", max_length=10),
        ),
        migrations.AddField(
            model_name="sweet",
            name="environment",
            field=models.CharField(blank=True, db_column="environment", max_length=255),
        ),
        migrations.AddField(
            model_name="sweet",
            name="height_cm",
            field=models.IntegerField(blank=True, db_column="height_cm", null=True),
        ),
        migrations.AddField(
            model_name="sweet",
            name="long_duration_minutes",
            field=models.IntegerField(blank=True, db_column="long_duration_minutes", null=True),
        ),
        migrations.AddField(
            model_name="sweet",
            name="long_price",
            field=models.IntegerField(blank=True, db_column="long_price", null=True),
        ),
        migrations.AddField(
            model_name="sweet",
            name="nationality",
            field=models.CharField(blank=True, db_column="nationality", max_length=255),
        ),
        migrations.AddField(
            model_name="sweet",
            name="service_type",
            field=models.CharField(blank=True, db_column="service_type", max_length=255),
        ),
        migrations.AddField(
            model_name="sweet",
            name="short_duration_minutes",
            field=models.IntegerField(blank=True, db_column="short_duration_minutes", null=True),
        ),
        migrations.AddField(
            model_name="sweet",
            name="short_price",
            field=models.IntegerField(blank=True, db_column="short_price", null=True),
        ),
        migrations.AddField(
            model_name="sweet",
            name="update_time",
            field=models.DateTimeField(blank=True, db_column="update_time", null=True),
        ),
        migrations.AddField(
            model_name="sweet",
            name="weight_kg",
            field=models.IntegerField(blank=True, db_column="weight_kg", null=True),
        ),
    ]
