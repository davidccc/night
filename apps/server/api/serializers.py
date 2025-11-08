from __future__ import annotations

from django.db.models import Avg, Count
from rest_framework import serializers

from .models import Booking, LineUser, Location, RewardLog, Sweet, SweetReview


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
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

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
            "average_rating",
            "review_count",
            "location",
            "created_at",
            "updated_at",
        ]

    def get_code(self, obj: Sweet) -> str:
        return obj.code

    def get_average_rating(self, obj: Sweet) -> float:
        avg = getattr(obj, "average_rating", None)
        count = getattr(obj, "review_count", None)
        if avg is not None and count is not None:
            return round(float(avg), 2)
        aggregate = obj.reviews.aggregate(avg=Avg("rating"))
        return round(float(aggregate["avg"] or 0), 2)

    def get_review_count(self, obj: Sweet) -> int:
        count = getattr(obj, "review_count", None)
        if count is not None:
            return int(count)
        aggregate = obj.reviews.aggregate(count=Count("id"))
        return int(aggregate["count"] or 0)


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


class SweetReviewSerializer(serializers.ModelSerializer):
    userDisplayName = serializers.SerializerMethodField()

    class Meta:
        model = SweetReview
        fields = ["id", "rating", "comment", "created_at", "userDisplayName"]

    def get_userDisplayName(self, obj: SweetReview) -> str:
        if obj.user and obj.user.display_name:
            return obj.user.display_name
        return "小夜用戶"
