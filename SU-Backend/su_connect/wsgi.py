import os
import re

try:
    import django.utils.cache
    if not hasattr(django.utils.cache, 'cc_delim_re'):
        django.utils.cache.cc_delim_re = re.compile(r'\s*,\s*')
except ImportError:
    pass

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'su_connect.settings.development')

application = get_wsgi_application()
