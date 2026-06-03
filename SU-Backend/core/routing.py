from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'^ws/notifications/$', consumers.NotificationConsumer.as_asgi()),
    re_path(r'^ws/ai-progress/(?P<report_id>\d+)/$', consumers.AIProgressConsumer.as_asgi()),
    re_path(r'^ws/session-control/$', consumers.SessionConsumer.as_asgi()),
]
