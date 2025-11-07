from __future__ import annotations

from rest_framework import serializers

from .models import Booking, LineUser, Location, RewardLog, Sweet


class LineUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = LineUser
        fields = ["id", "line_user_id", "display_name", "avatar", "reward_points", "created_at", "updated_at"]


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ["id", "slug", "name"]


class SweetSerializer(serializers.ModelSerializer):
    location = LocationSerializer(read_only=True)
    code = serializers.SerializerMethodField()

    class Meta:
        model = Sweet
        fields = [
            "id",
            "code",
            "name",
            "description",
            "image_url",
            "tag",
            "nationality",
            "age_text",
            "height_cm",
            "weight_kg",
            "cup",
            "environment",
            "long_duration_minutes",
            "short_duration_minutes",
            "service_type",
            "long_price",
            "short_price",
            "update_time",
            "location",
            "created_at",
            "updated_at",
        ]

    def get_code(self, obj: Sweet) -> str:
        return obj.code


class BookingSerializer(serializers.ModelSerializer):
    sweet = SweetSerializer()

    class Meta:
        model = Booking
        fields = [
            "id",
            "user_id",
            "sweet",
            "date",
            "time_slot",
            "status",
            "note",
            "created_at",
            "updated_at",
        ]


class RewardLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = RewardLog
        fields = ["id", "delta", "reason", "created_at"]
