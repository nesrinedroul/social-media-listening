from celery import shared_task
from django.utils import timezone
from datetime import timedelta

@shared_task
def mark_inactive_agents_offline():
    """
    Runs every 2 minutes.
    Sets offline agents with no heartbeat in last 2 minutes.
    Does NOT override manual status — only sets offline if
    last_seen is too old (connection lost).
    """
    from apps.accounts.models import User
    from django.utils import timezone
    from datetime import timedelta

    cutoff  = timezone.now() - timedelta(minutes=2)
    updated = User.objects.filter(
        role=User.Role.AGENT,
        status__in=[User.Status.ONLINE, User.Status.BUSY],
        last_seen__lt=cutoff,
    ).update(status=User.Status.OFFLINE)

    if updated:
        print(f'Marked {updated} agent(s) offline due to inactivity')
    return updated