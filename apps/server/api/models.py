from __future__ import annotations

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
        db_table = "users"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.display_name or 'User'} ({self.line_user_id})"

    @property
    def is_authenticated(self) -> bool:
        return True


class Sweet(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    image_url = models.URLField(max_length=1024, blank=True, db_column="image_url")
    tag = models.CharField(max_length=255, blank=True, db_column="tag")
    created_at = models.DateTimeField(auto_now_add=True, db_column="created_at")
    updated_at = models.DateTimeField(auto_now=True, db_column="updated_at")

    class Meta:
        db_table = "sweets"
        ordering = ["id"]

    def __str__(self) -> str:
        return self.name


class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING"
        CONFIRMED = "CONFIRMED"
        CANCELLED = "CANCELLED"

    user = models.ForeignKey(LineUser, related_name="bookings", on_delete=models.CASCADE, db_column="user_id")
    sweet = models.ForeignKey(Sweet, related_name="bookings", on_delete=models.CASCADE, db_column="sweet_id")
    date = models.DateTimeField()
    time_slot = models.CharField(max_length=100, db_column="time_slot")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    note = models.TextField(blank=True, null=True, db_column="note")
    created_at = models.DateTimeField(auto_now_add=True, db_column="created_at")
    updated_at = models.DateTimeField(auto_now=True, db_column="updated_at")

    class Meta:
        db_table = "bookings"
        ordering = ["-created_at"]


class RewardLog(models.Model):
    user = models.ForeignKey(LineUser, related_name="reward_logs", on_delete=models.CASCADE, db_column="user_id")
    delta = models.IntegerField()
    reason = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True, db_column="created_at")

    class Meta:
        db_table = "reward_logs"
        ordering = ["-created_at"]

