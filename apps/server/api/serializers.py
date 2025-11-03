from __future__ import annotations

from rest_framework import serializers

from .models import Booking, LineUser, RewardLog, Sweet


class LineUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = LineUser
        fields = ["id", "line_user_id", "display_name", "avatar", "reward_points", "created_at", "updated_at"]


class SweetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sweet
        fields = ["id", "name", "description", "image_url", "tag", "created_at", "updated_at"]


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
