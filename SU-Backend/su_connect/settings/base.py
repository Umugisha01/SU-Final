import os
import re
import socket
from pathlib import Path
from datetime import timedelta
import environ

# Compatibility shim for Django 6.1+ removal of cc_delim_re in django.utils.cache
try:
    import django.utils.cache
    if not hasattr(django.utils.cache, 'cc_delim_re'):
        django.utils.cache.cc_delim_re = re.compile(r'\s*,\s*')
except ImportError:
    pass

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(
    DEBUG=(bool, False)
)

# Read environment variables
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

SECRET_KEY = env('SECRET_KEY', default='django-insecure-su-connect-prod-secret-fallback-123456789')
DEBUG = env.bool('DEBUG', default=False)

ALLOWED_HOSTS = ['*']

# Application definition
INSTALLED_APPS = [
    'daphne',  # Daphne ASGI server goes first
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'channels',
    'django_celery_results',
    
    # Project apps
    'apps.accounts',
    'apps.reports',
    'apps.support',
    'apps.prayer',
    'apps.documents',
    'apps.audit',
    'apps.notifications',
]

MIDDLEWARE = [
    'core.middleware.ExceptionLoggingMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    
    # Custom Middlewares
    'core.idempotency.IdempotencyMiddleware',
    'core.middleware.AuditLoggingMiddleware',
    'core.middleware.RegionalIsolationMiddleware',
    'core.middleware.SessionTimeoutMiddleware',
]

ROOT_URLCONF = 'su_connect.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'su_connect.wsgi.application'
ASGI_APPLICATION = 'su_connect.asgi.application'

def _is_port_open(host, port, timeout=0.3):
    try:
        with socket.create_connection((host, int(port)), timeout=timeout):
            return True
    except OSError:
        return False

# Database Setup with PgBouncer Optimization & Resilient Local Fallback
_db_config = env.db('DATABASE_URL', default='sqlite:///db.sqlite3')
_direct_url = env('DIRECT_DATABASE_URL', default='')

if 'postgresql' in _db_config.get('ENGINE', ''):
    _host = _db_config.get('HOST') or '127.0.0.1'
    _port = _db_config.get('PORT') or 5432

    # If configured for PgBouncer (port 6432) but PgBouncer is offline, fallback to direct port 5432
    if str(_port) == '6432' and not _is_port_open(_host, 6432):
        if _direct_url:
            _db_config = env.db('DIRECT_DATABASE_URL')
        else:
            _db_config['PORT'] = 5432

    _db_config['CONN_MAX_AGE'] = int(env('DB_CONN_MAX_AGE', default=0))
    if str(_db_config.get('PORT', '')) == '6432':
        _db_config['DISABLE_SERVER_SIDE_CURSORS'] = True

DATABASES = {
    'default': _db_config
}

# Optional direct connection alias for running migrations or direct administrative tasks
if _direct_url:
    DATABASES['direct'] = env.db('DIRECT_DATABASE_URL')


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Authentication user model
AUTH_USER_MODEL = 'accounts.User'

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Kigali'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

MEDIA_URL = 'media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_THROTTLE_CLASSES': [
        'core.throttling.StandardRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '60/min',
        'user': '120/min',
        'auth': '5/15min',
        'ai': '5/hour',
        'upload': '30/hour',
    }
}

# Simple JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(seconds=int(env('JWT_ACCESS_TOKEN_LIFETIME', default=900))),
    'REFRESH_TOKEN_LIFETIME': timedelta(seconds=int(env('JWT_REFRESH_TOKEN_LIFETIME', default=604800))),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

# Redis & Channels Configuration (Graceful Serverless Fallback)
REDIS_URL = env('REDIS_URL', default='')
if REDIS_URL and not any(h in REDIS_URL for h in ['localhost', '127.0.0.1']):
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'config': {
                'hosts': [REDIS_URL],
            },
        },
    }
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': REDIS_URL,
        }
    }
else:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        },
    }
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'su-connect-serverless-cache',
        }
    }


# CORS settings
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in env('CORS_ALLOWED_ORIGINS', default='http://localhost:3000').split(',') if origin.strip()
]
# Automatically allow all Vercel production and preview deployments
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
    r"^http://localhost:\d+$",
]

# Celery Configurations
CELERY_BROKER_URL = env('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = env('CELERY_RESULT_BACKEND', default='redis://localhost:6379/1')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Africa/Kigali'

# Gemini settings
GEMINI_API_KEY = env('GEMINI_API_KEY', default='')

# Email configurations
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_USE_TLS = True
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# Ollama local settings for Dual AI Engine
OLLAMA_URL = env('OLLAMA_URL', default='http://127.0.0.1:11434')
OLLAMA_TEXT_MODEL = env('OLLAMA_TEXT_MODEL', default='mistral:7b-instruct-q4_K_M')
OLLAMA_VISION_MODEL = env('OLLAMA_VISION_MODEL', default='qwen2.5vl:3b')
OLLAMA_MODEL = OLLAMA_VISION_MODEL # Legacy alias compatibility
