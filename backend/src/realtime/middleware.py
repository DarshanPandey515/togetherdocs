from __future__ import annotations
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from urllib.parse import parse_qs
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError




User = get_user_model()

class JWTAuthMiddleware(BaseMiddleware):
    
    async def __call__(self, scope: dict, receive, send):
        scope["user"] = await self.get_user(scope)
        return await super().__call__(scope, receive, send)
    
    @database_sync_to_async
    def get_user(self, scope: dict):
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token_list = params.get("token", [])
        token = token_list[0] if token_list else AnonymousUser()
            
        try:
            access_token = AccessToken(token)
            
            
            user_id = access_token.get("user_id")
            
            
            if user_id is None:
                return AnonymousUser()
            
            return User.objects.get(id=user_id, is_active=True)
        
        except (
            InvalidToken,
            TokenError,
            User.DoesNotExist,
        ):
            return AnonymousUser()