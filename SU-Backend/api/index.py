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
    if environ.get('QUERY_STRING') == 'debug_env=1':
        import json
        headers_dump = {k: v for k, v in environ.items() if isinstance(v, (str, int, bool))}
        body = json.dumps(headers_dump, indent=2).encode('utf-8')
        start_response('200 OK', [('Content-Type', 'application/json')])
        return [body]

    raw_path = (
        environ.get('HTTP_X_MATCHED_PATH') or
        environ.get('RAW_URI') or
        environ.get('REQUEST_URI') or
        environ.get('HTTP_X_FORWARDED_URI') or
        environ.get('HTTP_X_VERCEL_PATH')
    )
    if raw_path and environ.get('PATH_INFO', '').startswith('/api/index'):
        environ['PATH_INFO'] = raw_path.split('?')[0]
    elif environ.get('PATH_INFO') in ('/api/index', '/api/index/'):
        environ['PATH_INFO'] = '/'

    return application(environ, start_response)
