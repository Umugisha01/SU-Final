import os
from celery import Celery

# Set default settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'su_connect.settings.development')

app = Celery('su_connect')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
