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
    real_path = None
    query_string = environ.get('QUERY_STRING', '')

    # 1. Check __vercel_path from vercel.json rewrite
    if '__vercel_path=' in query_string:
        parsed = parse_qs(query_string, keep_blank_values=True)
        if '__vercel_path' in parsed:
            val = parsed.pop('__vercel_path')[0]
            if val:
                real_path = val
            environ['QUERY_STRING'] = urlencode(parsed, doseq=True)

    # 2. Check Vercel serverless forwarding headers if rewrite was bypassed
    if not real_path or real_path in ('/api/index', '/api/index/'):
        for header_key in [
            'HTTP_X_FORWARDED_PATH',
            'HTTP_X_VERCEL_FORWARDED_PATH',
            'REQUEST_URI',
            'RAW_URI',
            'HTTP_X_MATCHED_PATH',
        ]:
            val = environ.get(header_key)
            if val and val not in ('/api/index', '/api/index/'):
                real_path = val.split('?')[0]
                break

    # 3. Check if PATH_INFO itself is a valid route
    if not real_path:
        current_path = environ.get('PATH_INFO', '')
        if current_path and current_path not in ('/api/index', '/api/index/'):
            real_path = current_path

    # Apply resolved path
    if real_path:
        environ['PATH_INFO'] = real_path if real_path.startswith('/') else '/' + real_path
    else:
        environ['PATH_INFO'] = '/'

    return application(environ, start_response)
