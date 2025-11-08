from __future__ import annotations

from unittest import mock
from uuid import uuid4

from django.conf import settings
from django.test import Client, TestCase, override_settings

from api import auth as api_auth
from api.models import LineUser, Location, Sweet


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
        location = Location.objects.create(slug=f"taipei-{uuid4().hex[:5]}", name="台北")
        Sweet.objects.create(name="Test Sweet", description="desc", location=location)

        token = api_auth.issue_jwt(user)

        response = self.client.get(
            "/api/sweets",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json().get("sweets", [])
        self.assertTrue(any(item.get("name") == "Test Sweet" for item in data))

    def test_reviews_flow(self) -> None:
        user = LineUser.objects.create(
            line_user_id="U789",
            display_name="Reviewer",
            avatar="",
        )
        location = Location.objects.create(slug=f"ks-{uuid4().hex[:5]}", name="高雄")
        sweet = Sweet.objects.create(name="Review Me", description="desc", location=location)
        token = api_auth.issue_jwt(user)

        create_response = self.client.post(
            f"/api/sweets/{sweet.id}/reviews",
            data={"rating": 5, "comment": "Excellent"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(create_response.status_code, 201)
        summary = create_response.json().get("summary", {})
        self.assertEqual(summary.get("reviewCount"), 1)
        self.assertAlmostEqual(summary.get("averageRating"), 5.0)

        list_response = self.client.get(
            f"/api/sweets/{sweet.id}/reviews",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(list_response.status_code, 200)
        reviews = list_response.json().get("reviews", [])
        self.assertEqual(len(reviews), 1)
        self.assertEqual(reviews[0].get("comment"), "Excellent")
