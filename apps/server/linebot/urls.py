from django.urls import path

from . import views

urlpatterns = [
    path("authorize", views.authorize, name="line-authorize"),
    path("callback", views.callback, name="line-callback"),
]
