from celery import shared_task
from .normalizer import normalize_payload
from apps.conversations.services import ConversationService


@shared_task(bind=True, max_retries=3)
def process_webhook_payload(self, payload: dict):
    """Async Celery version — kept for when worker is available"""
    try:
        process_webhook_payload_sync(payload)
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


def process_webhook_payload_sync(payload: dict):
    """Synchronous version — used directly on Render free tier"""
    try:
        messages = normalize_payload(payload)
        print(f'Processing {len(messages)} messages')
        for msg in messages:
            print(f'Incoming message: source={msg.get("source")} text={msg.get("text")}')
            ConversationService.handle_incoming(msg)
    except Exception as e:
        print(f'process_webhook_payload_sync error: {e}')
        import traceback
        traceback.print_exc()