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

from urllib.parse import parse_qs, urlencode
from su_connect.wsgi import application

def app(environ, start_response):
    query_string = environ.get('QUERY_STRING', '')
    if '__vercel_path=' in query_string:
        parsed = parse_qs(query_string, keep_blank_values=True)
        if '__vercel_path' in parsed:
            dest_path = parsed.pop('__vercel_path')[0]
            if dest_path:
                environ['PATH_INFO'] = dest_path if dest_path.startswith('/') else '/' + dest_path
            environ['QUERY_STRING'] = urlencode(parsed, doseq=True)
    elif environ.get('PATH_INFO') in ('/api/index', '/api/index/'):
        environ['PATH_INFO'] = '/'

    return application(environ, start_response)
