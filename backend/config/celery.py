import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('social_listening')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Disabled — agent controls their own status
app.conf.beat_schedule = {}