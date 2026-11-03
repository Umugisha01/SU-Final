import os
import sys
import re
from urllib.parse import parse_qs, urlencode

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

def app(environ, start_response):
    # Ensure SCRIPT_NAME is empty so Django handles all routing directly from the root domain
    # and does not generate double prefixes (e.g. /api/api/...) or corrupted redirect locations.
    environ['SCRIPT_NAME'] = ''

    real_path = None
    query_string = environ.get('QUERY_STRING', '')

    # 1. Check __vercel_path from vercel.json rewrite
    if '__vercel_path=' in query_string:
        parsed = parse_qs(query_string, keep_blank_values=True)
        if '__vercel_path' in parsed:
            val = parsed.pop('__vercel_path')[0]
            # Ensure val is a valid path string and not an unexpanded regex / placeholder
            if val and not any(ch in val for ch in ('$', ':', '{', '}')):
                real_path = val
            environ['QUERY_STRING'] = urlencode(parsed, doseq=True)

    # 2. Check Vercel serverless forwarding headers if rewrite was bypassed or __vercel_path was invalid
    if not real_path or real_path in ('/api/index', '/api/index/', '/api/index.py'):
        for header_key in [
            'HTTP_X_VERCEL_FORWARDED_PATH',
            'HTTP_X_FORWARDED_PATH',
            'HTTP_X_MATCHED_PATH',
            'REQUEST_URI',
            'RAW_URI',
        ]:
            val = environ.get(header_key)
            if val and val not in ('/api/index', '/api/index/', '/api/index.py'):
                clean = val.split('?')[0]
                if clean and not any(ch in clean for ch in ('$', ':', '{', '}')):
                    real_path = clean
                    break

    # 3. Check if PATH_INFO itself is a valid route
    if not real_path:
        current_path = environ.get('PATH_INFO', '')
        if current_path and current_path not in ('/api/index', '/api/index/', '/api/index.py'):
            real_path = current_path

    # Apply resolved path
    if real_path:
        environ['PATH_INFO'] = real_path if real_path.startswith('/') else '/' + real_path
    else:
        environ['PATH_INFO'] = '/'

    return application(environ, start_response)
