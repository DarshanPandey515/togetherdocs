from __future__ import annotations
from channels.generic.websocket import AsyncWebsocketConsumer, AsyncJsonWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from src.models import Document
from typing import Any
from django.contrib.auth import get_user_model
from src.permissions import can_view_document
from channels.db import database_sync_to_async
import logging


logger = logging.getLogger(__name__)


User = get_user_model()

class TestConsumer(AsyncWebsocketConsumer):
    group_name = "group_abc"
    
    async def connect(self) -> None:
        
        user = self.scope["user"]
        
        
        if user.is_anonymous:
            self.close(code=4001)
            return
        

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        

        await self.send(
            text_data=f"Authenticated user {user.email}: .",
        )

    async def receive(self, text_data: str | None = None, bytes_data: bytes | None = None) -> None:
        if text_data:
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "chat_message",
                    "message": text_data,
                },
            )
            
    async def chat_message(self, event: dict[str, str]) -> None:
        await self.send(
            text_data=event["message"]
        )
        

    async def disconnect(self, close_code: int) -> None:
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
        
        
class DocumentConsumer(AsyncJsonWebsocketConsumer):
    document: Document | None = None
    group_name: str = ""
    
    async def connect(self) -> None:
        
        user = self.scope["user"]
        
        if user is None or user.is_anonymous:
            await self.close(code=4001)
            return
        
        document_id = self.scope["url_route"]["kwargs"]["document_id"]

        document = await self.get_document(document_id=document_id)
        
        if document is None:
            await self.close(code=4004)
            return
        
        
        has_access = await self.user_can_view(document=document, user=user)
        
        if not has_access:
            await self.close(code=4003)
            return
        
        self.document = document
        self.group_name = (f"document_{document_id}")
                
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        
        await self.send_json(
            {
                "type":"connection.accepted",
                "document_id": str(document_id),
                "user_id": str(user.id)
                
            }
        )
        
        logger.info("websocket connection accepted: user id=%s document id=%s", user.id, document_id)

    async def receive_json(self, content: dict[str, Any], **kwargs: Any) -> None:
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "document.message",
                "message": content,
                "user_id": str(self.scope["user"].id)
            }
        )
        


    async def document_message(self, event: dict[str, Any]) -> None:
        await self.send_json(
            {
                "type":"document.message",
                "user_id": event["user_id"],
                "message": event["message"]
            }
        )
    
    
    @database_sync_to_async
    def get_document(self, document_id: Any) -> Document | None:
        return (
            Document.objects
            .filter(id=document_id)
            .first()
        )        

    @database_sync_to_async
    def user_can_view(self, document: Document, user: User) -> bool: #type: ignore
        return can_view_document(document, user)
    
    async def disconnect(self, close_code: int) -> None:
        if self.group_name:
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )