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

def app(environ, start_response):
    # In Vercel serverless rewrites (e.g. source: "/(.*)" -> destination: "/api/index"),
    # Vercel passes the original requested path in HTTP_X_MATCHED_PATH, HTTP_X_VERCEL_PATH,
    # or HTTP_X_FORWARDED_URI, while setting PATH_INFO to "/api/index".
    matched_path = (
        environ.get('HTTP_X_MATCHED_PATH') or
        environ.get('HTTP_X_VERCEL_PATH') or
        environ.get('HTTP_X_FORWARDED_URI')
    )
    if matched_path and environ.get('PATH_INFO', '').startswith('/api/index'):
        # Strip query string from matched_path if present
        environ['PATH_INFO'] = matched_path.split('?')[0]
    elif environ.get('PATH_INFO') in ('/api/index', '/api/index/'):
        environ['PATH_INFO'] = '/'

    return application(environ, start_response)
