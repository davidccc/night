from __future__ import annotations

from datetime import datetime
from typing import Iterable, Tuple

from django.db import transaction
from django.db.models import Avg, Count, Value
from django.db.models.functions import Coalesce
from django.utils import timezone

from .models import Booking, LineUser, RewardLog, Sweet, SweetReview


def get_user_by_id(user_id: int) -> LineUser | None:
    try:
        return LineUser.objects.get(id=user_id)
    except LineUser.DoesNotExist:
        return None


def get_user_by_line_id(line_user_id: str) -> LineUser | None:
    try:
        return LineUser.objects.get(line_user_id=line_user_id)
    except LineUser.DoesNotExist:
        return None


def upsert_line_user(*, line_user_id: str, display_name: str | None, avatar: str | None) -> LineUser:
    defaults = {
        "display_name": display_name or "小夜用戶",
        "avatar": avatar or "",
    }
    user, created = LineUser.objects.get_or_create(line_user_id=line_user_id, defaults=defaults)
    if not created:
        changed = False
        if display_name and display_name != user.display_name:
            user.display_name = display_name
            changed = True
        if avatar is not None and avatar != user.avatar:
            user.avatar = avatar
            changed = True
        if not user.display_name:
            user.display_name = "小夜用戶"
            changed = True
        if changed:
            user.save(update_fields=["display_name", "avatar", "updated_at"])
        return user


def adjust_reward_points(*, user: LineUser, delta: int, reason: str) -> LineUser:
    with transaction.atomic():
        user.reward_points = user.reward_points + delta
        user.save(update_fields=["reward_points", "updated_at"])
        RewardLog.objects.create(user=user, delta=delta, reason=reason)
        user.refresh_from_db()
        return user


def list_sweets(*, location_slug: str | None = None) -> Iterable[Sweet]:
    queryset = (
        Sweet.objects.select_related("location")
        .annotate(
            average_rating=Coalesce(Avg("reviews__rating"), Value(0.0)),
            review_count=Coalesce(Count("reviews"), Value(0)),
        )
        .order_by("id")
    )
    if location_slug:
        queryset = queryset.filter(location__slug=location_slug)
    return queryset


def create_booking(
    *,
    user: LineUser,
    sweet_id: int,
    date_str: str,
    time_slot: str,
    note: str | None,
) -> Booking:
    booking_date = parse_date(date_str)
    if booking_date is None:
        raise ValueError("Invalid booking date")

    with transaction.atomic():
        sweet = Sweet.objects.select_for_update().select_related("location").get(id=sweet_id)
        booking = Booking.objects.create(
            user=user,
            sweet=sweet,
            date=booking_date,
            time_slot=time_slot,
            status=Booking.Status.PENDING,
            note=note or "",
        )

        user.reward_points += 50
        user.save(update_fields=["reward_points", "updated_at"])
        RewardLog.objects.create(user=user, delta=50, reason=f"預約 {sweet.name}")

        booking.refresh_from_db()
        booking.sweet = sweet
        return booking


def list_bookings_for_user(user: LineUser) -> Iterable[Booking]:
    return (
        Booking.objects.select_related("sweet", "sweet__location")
        .filter(user=user)
        .order_by("-created_at")
    )


def get_reward_summary(user: LineUser) -> Tuple[LineUser, Iterable[RewardLog]]:
    logs = RewardLog.objects.filter(user=user).order_by("-created_at")
    user.refresh_from_db()
    return user, logs


def set_reward_points(*, user: LineUser, reward_points: int, reason: str) -> Tuple[LineUser, int]:
    with transaction.atomic():
        user.refresh_from_db()
        delta = reward_points - user.reward_points
        user.reward_points = reward_points
        user.save(update_fields=["reward_points", "updated_at"])
        if delta != 0:
            RewardLog.objects.create(user=user, delta=delta, reason=reason)
        user.refresh_from_db()
        return user, delta


def parse_date(raw: str) -> datetime | None:
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S%z"):
        try:
            parsed = datetime.strptime(raw, fmt)
            if parsed.tzinfo is None:
                parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
            return parsed
        except ValueError:
            continue
    return None


def list_reviews_for_sweet(sweet_id: int) -> Iterable[SweetReview]:
    return SweetReview.objects.select_related("user").filter(sweet_id=sweet_id).order_by("-created_at")


def create_review(*, user: LineUser, sweet_id: int, rating: int, comment: str) -> SweetReview:
    if rating < 1 or rating > 5:
        raise ValueError("Rating must be between 1 and 5")
    sweet = Sweet.objects.get(id=sweet_id)
    review = SweetReview.objects.create(
        sweet=sweet,
        user=user,
        rating=rating,
        comment=comment,
    )
    return review


def get_review_summary(sweet_id: int) -> Tuple[float, int]:
    aggregate = SweetReview.objects.filter(sweet_id=sweet_id).aggregate(
        average_rating=Avg("rating"),
        review_count=Count("id"),
    )
    average_rating = float(aggregate["average_rating"] or 0)
    review_count = int(aggregate["review_count"] or 0)
    return average_rating, review_count
