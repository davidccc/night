from __future__ import annotations

from unittest import mock

from django.conf import settings
from django.test import Client, TestCase, override_settings

from api import auth as api_auth
from api.models import LineUser, Sweet


@override_settings(
    DATABASES={"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}},
)
class APITestCase(TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.client = Client()

    def test_login(self) -> None:
        fake_user = LineUser.objects.create(
            line_user_id="U123",
            display_name="Tester",
            avatar="",
        )
        with mock.patch("linebot.line_auth.login_with_id_token") as mocked_login:
            mocked_login.return_value = {"user": fake_user, "token": "signed-token"}

            response = self.client.post(
                "/api/login",
                data={"idToken": "mock-token"},
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get("token"), "signed-token")

    def test_sweets_requires_auth(self) -> None:
        response = self.client.get("/api/sweets")
        self.assertEqual(response.status_code, 403)

    def test_sweets_with_auth(self) -> None:
        user = LineUser.objects.create(
            line_user_id="U234",
            display_name="Tester",
            avatar="",
        )
        Sweet.objects.create(name="Test Sweet", description="desc")

        token = api_auth.issue_jwt(user)

        response = self.client.get(
            "/api/sweets",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json().get("sweets", [])), 1)
