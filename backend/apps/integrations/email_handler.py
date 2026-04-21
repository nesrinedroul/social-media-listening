from datetime import datetime


def normalize_postmark_payload(payload: dict) -> dict:
    """
    Converts a Postmark inbound email payload into
    our normalized message format.
    """
    # Extract sender info
    from_email = payload.get('From', '')
    from_name  = payload.get('FromName', '')
    subject    = payload.get('Subject', '(no subject)')
    text_body  = payload.get('TextBody', '')
    html_body  = payload.get('HtmlBody', '')

    # Use text body, fall back to stripping HTML
    body = text_body.strip() if text_body.strip() else _strip_html(html_body)

    # Use email as sender_id (unique per person)
    sender_id = from_email.lower().strip()

    # Parse name
    parts      = from_name.strip().split(' ', 1) if from_name else []
    first_name = parts[0] if parts else ''
    last_name  = parts[1] if len(parts) > 1 else ''

    return {
        'source':       'email',
        'external_id':  payload.get('MessageID', f'email_{int(datetime.now().timestamp())}'),
        'sender_id':    sender_id,
        'sender_email': from_email,
        'first_name':   first_name,
        'last_name':    last_name,
        'page_id':      payload.get('OriginalRecipient', 'inbound@email'),
        'text':         f'[{subject}]\n\n{body}',
        'message_type': 'email',
        'timestamp':    datetime.now(),
        'raw':          payload,
    }


def _strip_html(html: str) -> str:
    import re
    return re.sub(r'<[^>]+>', '', html).strip()