import os
import re
import django

try:
    import django.utils.cache
    if not hasattr(django.utils.cache, 'cc_delim_re'):
        django.utils.cache.cc_delim_re = re.compile(r'\s*,\s*')
except ImportError:
    pass

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'su_connect.settings.development')
django.setup()

# Import channels routing after django.setup()
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import core.routing

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            core.routing.websocket_urlpatterns
        )
    ),
})
