import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('social_listening')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'mark-inactive-agents-offline': {
        'task':     'apps.accounts.tasks.mark_inactive_agents_offline',
        'schedule': 120.0,  # every 2 minutes
    },
}