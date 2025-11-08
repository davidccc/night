from __future__ import annotations

from typing import Any

from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import LineJWTAuthentication
from .serializers import (
    BookingSerializer,
    LineUserSerializer,
    RewardLogSerializer,
    SweetReviewSerializer,
    SweetSerializer,
)
from . import services
from .models import LineUser, Sweet
from linebot import line_auth


class LoginSerializer(serializers.Serializer):
    idToken = serializers.CharField(required=True, allow_blank=False, write_only=True)


class BookingCreateSerializer(serializers.Serializer):
    sweetId = serializers.IntegerField(min_value=1)
    date = serializers.CharField()
    timeSlot = serializers.CharField()
    note = serializers.CharField(required=False, allow_blank=True)


class RewardUpdateSerializer(serializers.Serializer):
    rewardPoints = serializers.IntegerField(min_value=0)
    reason = serializers.CharField(required=False, allow_blank=True, default="調整積分")


class SweetReviewCreateSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True, max_length=1000)


class LoginView(APIView):
    authentication_classes: list[Any] = []
    permission_classes: list[Any] = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        id_token = serializer.validated_data["idToken"]
        login_result = line_auth.login_with_id_token(id_token)
        data = {
            "token": login_result["token"],
            "user": LineUserSerializer(login_result["user"]).data,
        }
        return Response(data)


class MeView(APIView):
    authentication_classes = [LineJWTAuthentication]

    def get(self, request):
        return Response({"user": LineUserSerializer(request.user).data})


class SweetsView(APIView):
    authentication_classes = [LineJWTAuthentication]

    def get(self, request):
        location_slug = request.GET.get("location")
        sweets = services.list_sweets(location_slug=location_slug)
        data = SweetSerializer(sweets, many=True).data
        return Response({"sweets": data})


class BookingCreateView(APIView):
    authentication_classes = [LineJWTAuthentication]

    def post(self, request):
        serializer = BookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        try:
            booking = services.create_booking(
                user=request.user,
                sweet_id=payload["sweetId"],
                date_str=payload["date"],
                time_slot=payload["timeSlot"],
                note=payload.get("note"),
            )
        except Sweet.DoesNotExist:
            return Response({"error": "Sweet not found"}, status=status.HTTP_404_NOT_FOUND)
        except LineUser.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"booking": BookingSerializer(booking).data}, status=status.HTTP_201_CREATED)


class BookingListView(APIView):
    authentication_classes = [LineJWTAuthentication]

    def get(self, request, user_id: int):
        if request.user.id != user_id:
            return Response(
                {"error": "Cannot view other users' bookings"},
                status=status.HTTP_403_FORBIDDEN,
            )
        bookings = services.list_bookings_for_user(request.user)
        return Response({"bookings": BookingSerializer(bookings, many=True).data})


class RewardView(APIView):
    authentication_classes = [LineJWTAuthentication]

    def get(self, request, user_id: int):
        if request.user.id != user_id:
            return Response(
                {"error": "Cannot view other users' rewards"},
                status=status.HTTP_403_FORBIDDEN,
            )
        user, logs = services.get_reward_summary(request.user)
        return Response(
            {
                "reward": {
                    "user": LineUserSerializer(user).data,
                    "logs": RewardLogSerializer(logs, many=True).data,
                }
            }
        )

    def put(self, request, user_id: int):
        if request.user.id != user_id:
            return Response(
                {"error": "Cannot update other users' rewards"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = RewardUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        user, delta = services.set_reward_points(
            user=request.user,
            reward_points=payload["rewardPoints"],
            reason=payload.get("reason") or "調整積分",
        )
        return Response({"user": LineUserSerializer(user).data, "delta": delta})


class SweetReviewView(APIView):
    authentication_classes = [LineJWTAuthentication]

    def get(self, request, sweet_id: int):
        try:
            Sweet.objects.get(id=sweet_id)
        except Sweet.DoesNotExist:
            return Response({"error": "Sweet not found"}, status=status.HTTP_404_NOT_FOUND)

        reviews = services.list_reviews_for_sweet(sweet_id)
        average, count = services.get_review_summary(sweet_id)
        return Response(
            {
                "reviews": SweetReviewSerializer(reviews, many=True).data,
                "summary": {
                    "averageRating": round(average, 2),
                    "reviewCount": count,
                },
            }
        )

    def post(self, request, sweet_id: int):
        serializer = SweetReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        try:
            review = services.create_review(
                user=request.user,
                sweet_id=sweet_id,
                rating=payload["rating"],
                comment=payload.get("comment") or "",
            )
        except Sweet.DoesNotExist:
            return Response({"error": "Sweet not found"}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        average, count = services.get_review_summary(sweet_id)
        return Response(
            {
                "review": SweetReviewSerializer(review).data,
                "summary": {
                    "averageRating": round(average, 2),
                    "reviewCount": count,
                },
            },
            status=status.HTTP_201_CREATED,
        )
