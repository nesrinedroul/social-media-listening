from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from urllib.parse import parse_qs


@database_sync_to_async
def get_user_from_token(token):
    try:
        from rest_framework_simplejwt.tokens import AccessToken
        from apps.accounts.models import User
        validated = AccessToken(token)
        user_id   = validated['user_id']
        return User.objects.get(id=user_id)
    except Exception:
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Try query string first: ?token=...
        query_string = scope.get('query_string', b'').decode()
        params       = parse_qs(query_string)
        token        = None

        if 'token' in params:
            token = params['token'][0]

        # Fall back to headers: Authorization: Bearer ...
        if not token:
            headers = dict(scope.get('headers', []))
            auth    = headers.get(b'authorization', b'').decode()
            if auth.startswith('Bearer '):
                token = auth[7:]

        if token:
            scope['user'] = await get_user_from_token(token)
        else:
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)