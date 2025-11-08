from __future__ import annotations

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class LineUser(models.Model):
    """
    Domain user synchronized from LINE Login.
    """

    line_user_id = models.CharField(max_length=255, unique=True, db_column="line_user_id")
    display_name = models.CharField(max_length=255, blank=True, db_column="display_name")
    avatar = models.URLField(max_length=1024, blank=True, db_column="avatar")
    reward_points = models.IntegerField(default=0, db_column="reward_points")
    created_at = models.DateTimeField(auto_now_add=True, db_column="created_at")
    updated_at = models.DateTimeField(auto_now=True, db_column="updated_at")

    class Meta:
        db_table = "user_tab"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.display_name or 'User'} ({self.line_user_id})"

    @property
    def is_authenticated(self) -> bool:
        return True


class Location(models.Model):
    CODE_MAP = {
        "taipei": "TP",
        "newtaipei": "NT",
        "taoyuan": "TY",
        "taichung": "TC",
        "tainan": "TN",
        "kaohsiung": "KS",
    }

    slug = models.SlugField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True, db_column="created_at")
    updated_at = models.DateTimeField(auto_now=True, db_column="updated_at")

    class Meta:
        db_table = "location_tab"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

    @property
    def code_prefix(self) -> str:
        if self.slug:
            return self.CODE_MAP.get(self.slug, self.slug[:2].upper())
        return "SW"


class Sweet(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    image_url = models.URLField(max_length=1024, blank=True, db_column="image_url")
    tag = models.CharField(max_length=255, blank=True, db_column="tag")
    nationality = models.CharField(max_length=255, blank=True, db_column="nationality")
    age_text = models.CharField(max_length=50, blank=True, db_column="age_text")
    height_cm = models.IntegerField(null=True, blank=True, db_column="height_cm")
    weight_kg = models.IntegerField(null=True, blank=True, db_column="weight_kg")
    cup = models.CharField(max_length=10, blank=True, db_column="cup")
    environment = models.CharField(max_length=255, blank=True, db_column="environment")
    long_duration_minutes = models.IntegerField(null=True, blank=True, db_column="long_duration_minutes")
    short_duration_minutes = models.IntegerField(null=True, blank=True, db_column="short_duration_minutes")
    service_type = models.CharField(max_length=255, blank=True, db_column="service_type")
    long_price = models.IntegerField(null=True, blank=True, db_column="long_price")
    short_price = models.IntegerField(null=True, blank=True, db_column="short_price")
    update_time = models.DateTimeField(null=True, blank=True, db_column="update_time")
    location = models.ForeignKey(
        Location,
        related_name="sweets",
        on_delete=models.PROTECT,
        db_column="location_id",
        db_constraint=False,
    )
    created_at = models.DateTimeField(auto_now_add=True, db_column="created_at")
    updated_at = models.DateTimeField(auto_now=True, db_column="updated_at")

    class Meta:
        db_table = "sweet_tab"
        ordering = ["id"]

    def __str__(self) -> str:
        return self.name

    @property
    def code(self) -> str:
        prefix = self.location.code_prefix if self.location_id else "SW"
        base = str(self.pk or 0).zfill(4)[-4:]
        return f"{prefix}{base}"


class SweetReview(models.Model):
    sweet = models.ForeignKey(
        Sweet,
        related_name="reviews",
        on_delete=models.CASCADE,
        db_column="sweet_id",
        db_constraint=False,
    )
    user = models.ForeignKey(
        LineUser,
        related_name="sweet_reviews",
        on_delete=models.CASCADE,
        db_column="user_id",
        db_constraint=False,
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        db_column="rating",
    )
    comment = models.TextField(blank=True, db_column="comment")
    created_at = models.DateTimeField(auto_now_add=True, db_column="created_at")
    updated_at = models.DateTimeField(auto_now=True, db_column="updated_at")

    class Meta:
        db_table = "sweet_review_tab"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.sweet_id} review by {self.user_id}"


class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING"
        CONFIRMED = "CONFIRMED"
        CANCELLED = "CANCELLED"

    user = models.ForeignKey(
        LineUser,
        related_name="bookings",
        on_delete=models.CASCADE,
        db_column="user_id",
        db_constraint=False,
    )
    sweet = models.ForeignKey(
        Sweet,
        related_name="bookings",
        on_delete=models.CASCADE,
        db_column="sweet_id",
        db_constraint=False,
    )
    date = models.DateTimeField()
    time_slot = models.CharField(max_length=100, db_column="time_slot")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    note = models.TextField(blank=True, null=True, db_column="note")
    created_at = models.DateTimeField(auto_now_add=True, db_column="created_at")
    updated_at = models.DateTimeField(auto_now=True, db_column="updated_at")

    class Meta:
        db_table = "booking_tab"
        ordering = ["-created_at"]


class RewardLog(models.Model):
    user = models.ForeignKey(
        LineUser,
        related_name="reward_logs",
        on_delete=models.CASCADE,
        db_column="user_id",
        db_constraint=False,
    )
    delta = models.IntegerField()
    reason = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True, db_column="created_at")

    class Meta:
        db_table = "reward_log_tab"
        ordering = ["-created_at"]
