from celery import shared_task
from .normalizer import normalize_payload
from apps.conversations.services import ConversationService


@shared_task(bind=True, max_retries=3)
def process_webhook_payload(self, payload: dict):
    try:
        messages = normalize_payload(payload)
        for msg in messages:
            ConversationService.handle_incoming(msg)
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))