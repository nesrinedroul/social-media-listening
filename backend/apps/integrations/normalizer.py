from datetime import datetime


def normalize_payload(payload: dict) -> list:
    normalized = []
    source = _detect_source(payload)

    for entry in payload.get('entry', []):
        changes = entry.get('changes', entry.get('messaging', []))
        for event in changes:
            msg = _extract(event, source, entry)
            if msg:
                normalized.append(msg)

    return normalized


def _detect_source(payload: dict) -> str:
    obj = payload.get('object', '')
    if obj == 'whatsapp_business_account':
        return 'whatsapp'
    if obj == 'instagram':
        return 'instagram'
    return 'facebook'


def _extract(event: dict, source: str, entry: dict) -> dict | None:
    if source == 'whatsapp':
        value    = event.get('value', {})
        messages = value.get('messages', [])
        if not messages:
            return None
        m = messages[0]
        return {
            'source':       source,
            'external_id':  m.get('id'),
            'sender_id':    m.get('from'),
            'page_id':      value.get('metadata', {}).get('phone_number_id'),
            'text':         m.get('text', {}).get('body', ''),
            'message_type': m.get('type', 'text'),
            'timestamp':    datetime.fromtimestamp(int(m.get('timestamp', 0))),
            'raw':          event,
        }

    messaging = event if source == 'facebook' else event.get('value', event)
    sender    = messaging.get('sender', {})
    message   = messaging.get('message', {})

    if not message:
        return None

    return {
        'source':       source,
        'external_id':  message.get('mid'),
        'sender_id':    sender.get('id'),
        'page_id':      entry.get('id'),
        'text':         message.get('text', ''),
        'message_type': 'text' if 'text' in message else 'attachment',
        'timestamp':    datetime.now(),
        'raw':          event,
    }