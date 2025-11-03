from __future__ import annotations

import json

from django.http import HttpRequest, HttpResponse, JsonResponse
from django.utils.html import escape


def root(request: HttpRequest) -> HttpResponse:
    token = request.GET.get("token")
    error = request.GET.get("error")

    if not token and not error:
        return HttpResponse(
            "<!DOCTYPE html><html><head><title>Night-king</title></head><body>Night-king backend</body></html>",
            content_type="text/html; charset=utf-8",
        )

    html = f"""<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="refresh" content="0;url=/">
    <title>Processing login…</title>
  </head>
  <body>
    <script>
      (() => {{
        const token = {json.dumps(token)};
        const error = {json.dumps(error)};
        const tokenKey = 'night-king.auth.token';
        const errorKey = 'night-king.auth.error';
        try {{
          if (token) {{
            localStorage.setItem(tokenKey, token);
          }}
          if (error) {{
            sessionStorage.setItem(errorKey, error);
          }} else {{
            sessionStorage.removeItem(errorKey);
          }}
        }} catch (storageError) {{
          console.warn('Failed to persist auth state', storageError);
        }}
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        url.searchParams.delete('error');
        window.location.replace(url.pathname + url.search + url.hash || '/');
      }})();
    </script>
  </body>
</html>"""
    return HttpResponse(html, content_type="text/html; charset=utf-8")


def healthz(_request: HttpRequest) -> JsonResponse:
    return JsonResponse({"status": "ok"})
