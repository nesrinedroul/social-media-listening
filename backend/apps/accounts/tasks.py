from celery import shared_task
from django.utils import timezone
from datetime import timedelta


@shared_task
def mark_inactive_agents_offline():
    """
    Runs every 2 minutes.
    Marks offline any agent with no heartbeat in last 2 minutes.
    """
    from apps.accounts.models import User

    cutoff  = timezone.now() - timedelta(minutes=2)
    updated = User.objects.filter(
        role=User.Role.AGENT,
        status=User.Status.ONLINE,
        last_seen__lt=cutoff,
    ).update(status=User.Status.OFFLINE)

    print(f'Marked {updated} agent(s) offline due to inactivity')
    return updated