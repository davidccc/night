import os
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BASE_DIR.parent.parent

# Load environment variables from repo root .env during local development.
for env_path in (REPO_ROOT / ".env", BASE_DIR / ".env"):
    if env_path.exists():
        load_dotenv(env_path, override=False)


def env(key: str, default: str | None = None) -> str:
    value = os.getenv(key)
    if value is None or value == "":
        return default or ""
    return value


SECRET_KEY = env("DJANGO_SECRET_KEY", env("JWT_SECRET", "django-insecure-placeholder"))
DEBUG = env("DJANGO_DEBUG", "false").lower() in {"1", "true", "yes"}

allowed_hosts = env("ALLOWED_HOSTS", "")
ALLOWED_HOSTS = [host.strip() for host in allowed_hosts.split(",") if host.strip()] or ["*"]


INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'api',
    'linebot',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'nightserver.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'nightserver.wsgi.application'


DATABASES = {
    'default': dj_database_url.config(
        default=env('DATABASE_URL', f"sqlite:///{BASE_DIR / 'db.sqlite3'}"),
        conn_max_age=600,
    )
}

# Normalize MySQL SSL parameters when provided via DATABASE_URL query
default_db = DATABASES.get('default')
if default_db and default_db.get('ENGINE') == 'django.db.backends.mysql':
    from urllib.parse import parse_qs, urlparse

    options = default_db.setdefault('OPTIONS', {})
    url = env('DATABASE_URL', '')
    query = parse_qs(urlparse(url).query)

    ssl_params = options.setdefault('ssl', {})

    sslmode = (query.get('sslmode') or [''])[0].lower()
    if sslmode in {'require', 'required'}:
        ssl_params['ssl_mode'] = 'REQUIRED'

    sslaccept = (query.get('sslaccept') or [''])[0].lower()
    if sslaccept in {'accept_invalid_certs', 'accept-invalid-certs'}:
        ssl_params['ssl_mode'] = 'PREFERRED'
        ssl_params['check_hostname'] = False

    # Remove parameters handled manually to avoid mysqlclient errors
    options.pop('sslmode', None)
    options.pop('sslaccept', None)

    if not ssl_params:
        options.pop('ssl', None)


AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


LANGUAGE_CODE = 'en-us'

TIME_ZONE = os.getenv("TIME_ZONE", "Asia/Taipei")

USE_I18N = True

USE_TZ = True


STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
    'DEFAULT_PARSER_CLASSES': ['rest_framework.parsers.JSONParser'],
    'DEFAULT_AUTHENTICATION_CLASSES': ['api.authentication.LineJWTAuthentication'],
}

cors_origins = [origin.strip() for origin in env("CORS_ORIGIN", "").split(",") if origin.strip()]
if cors_origins:
    CORS_ALLOWED_ORIGINS = cors_origins
else:
    CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOW_CREDENTIALS = True

JWT_SECRET = env("JWT_SECRET", SECRET_KEY)
LINE_CHANNEL_ACCESS_TOKEN = env("LINE_CHANNEL_ACCESS_TOKEN", "")
LINE_CHANNEL_SECRET = env("LINE_CHANNEL_SECRET", "")
LINE_LOGIN_CHANNEL_ID = env("LINE_LOGIN_CHANNEL_ID", "")
LINE_LOGIN_CHANNEL_SECRET = env("LINE_LOGIN_CHANNEL_SECRET", "")
BASE_URL = env("BASE_URL", "")
LIFF_BASE_URL = env("LIFF_BASE_URL", "")
