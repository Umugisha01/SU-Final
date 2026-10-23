import re

# Ensure backward compatibility for third-party libraries (e.g. older DRF) under Django 6.1+
try:
    import django.utils.cache
    if not hasattr(django.utils.cache, 'cc_delim_re'):
        django.utils.cache.cc_delim_re = re.compile(r'\s*,\s*')
except ImportError:
    pass

from .celery import app as celery_app

__all__ = ('celery_app',)
