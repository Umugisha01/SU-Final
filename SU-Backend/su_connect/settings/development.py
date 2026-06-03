from .base import *
import sys

DEBUG = True

# Use SQLite for unit tests, otherwise use PostgreSQL configured in .env
if 'pytest' in sys.modules or 'test' in sys.argv:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    DATABASES = {
        'default': env.db('DATABASE_URL', default='sqlite:///db.sqlite3')
    }

# Use local memory cache for development & testing to avoid external Redis dependency
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Use in-memory channel layer for local development and testing
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

# Celery setting for testing (runs tasks synchronously in-process)
CELERY_TASK_ALWAYS_EAGER = True

# For local development, send emails to console
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# --- DEVELOPMENT CORS: allow any localhost port (Vite, CRA, etc.) ---
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^http://localhost:\d+$',
    r'^http://127\.0\.0\.1:\d+$',
]
CORS_ALLOW_CREDENTIALS = True
