from django.urls import path

from . import views

urlpatterns = [
    path("login", views.LoginView.as_view(), name="api-login"),
    path("login/me", views.MeView.as_view(), name="api-me"),
    path("sweets", views.SweetsView.as_view(), name="api-sweets"),
    path("booking", views.BookingCreateView.as_view(), name="api-booking-create"),
    path("booking/<int:user_id>", views.BookingListView.as_view(), name="api-booking-list"),
    path("reward/<int:user_id>", views.RewardView.as_view(), name="api-reward"),
]
