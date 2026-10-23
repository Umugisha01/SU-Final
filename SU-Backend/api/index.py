import os
import sys
import re

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Compatibility shim for Django 6.1+ removal of cc_delim_re in django.utils.cache
try:
    import django.utils.cache
    if not hasattr(django.utils.cache, 'cc_delim_re'):
        django.utils.cache.cc_delim_re = re.compile(r'\s*,\s*')
except ImportError:
    pass

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'su_connect.settings.production')

from su_connect.wsgi import application

# Top-level WSGI callable required by Vercel
app = application
