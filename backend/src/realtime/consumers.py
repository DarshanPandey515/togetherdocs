from __future__ import annotations
from channels.generic.websocket import AsyncWebsocketConsumer, AsyncJsonWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from src.models import Document
from typing import Any
from django.contrib.auth import get_user_model
from src.api.permissions import can_view_document
from channels.db import database_sync_to_async
from src.realtime.redis import redis_client
from src.realtime.presence import PresenceService
from src.services.collaboration import CollaborationService
from src.realtime.protocol import Msg, Code, ACTION_EDIT, ACTION_SYNC
import uuid


User = get_user_model()
    
class DocumentConsumer(AsyncJsonWebsocketConsumer):
    presence = PresenceService(redis_client)
    collaboration = CollaborationService()
    document: Document | None = None
    group_name: str = ""
    connection_id: str = ""
    
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
        
        if not await self.user_can_view(document, user,):
            await self.close(code=4003)
            return
        
        self.document = document
        self.connection_id = str(uuid.uuid4())
        self.group_name = (f"document_{document_id}")
                
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        
        user_became_online, online_count = (
            await self.presence.connect(
                document_id= str(document.id),
                user_id= str(user.id)
            )
        )
        
        online_users = await self.presence.users(
            document_id=str(document.id),
        )
        
        
        await self.send_json(
            {
                "type": Msg.CONNECTION_ACCEPTED,
                "document_id": str(document.id),
                "user_id": str(user.id),
                
            }
        )
        
        await self.send_json(
            {
                "type": Msg.PRESENCE_STATE,
                "users": online_users
                
            }
        )

        if user_became_online:
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "presence.join",
                    "user_id": str(user.id),
                    "connection_id": self.connection_id
                    
                },
            )
        
    async def receive_json(self, content: dict[str, Any], **kwargs: Any) -> None:
        action = content.get("action")
        if action == ACTION_EDIT:
            await self.handle_edit(content)
        elif action == ACTION_SYNC:
            await self.handle_sync()
        else:
            await self.send_json(
                {
                    "type": Msg.ERROR,
                    "code": Code.BAD_REQUEST,
                    "message": f"Unknown action: {action!r}",
                }
            )

    async def handle_sync(self) -> None:
        document = self.document

        if document is None:
            await self.send_json(
                {"type": Msg.ERROR, "code": Code.NOT_FOUND, "message": "Document not found."}
            )
            return

        current = await self.get_document(document.pk)

        await self.send_json(
            {
                "type": Msg.STATE,
                "document_id": str(current.id),
                "title": current.title,
                "version": current.version,
                "content": current.content,
            }
        )

    async def handle_edit(self, content: dict[str, Any]) -> None:
        user = self.scope["user"]
        document = self.document

        if document is None:
            await self.send_json(
                {"type": Msg.ERROR, "code": Code.NOT_FOUND, "message": "Document not found."}
            )
            return

        if not await self.user_can_edit(document, user):
            await self.send_json(
                {"type": Msg.ERROR, "code": Code.FORBIDDEN, "message": "You do not have edit access to this document."}
            )
            return

        error, expected_version, edit_content = self.collaboration.validate_edit(content)
        
        if error is not None:
            await self.send_json(
                {"type": Msg.ERROR, "code": error, "message": "Invalid edit payload."}
            )
            return

        result = await self.apply_edit(
            document=document,
            user=user,
            expected_version=expected_version,
            content=edit_content,
        )

        if not result.ok:
            await self.send_json(
                {
                    "type": Msg.REJECT,
                    "code": result.code,
                    "message": result.message,
                    "version": result.version,
                    "content": result.content,
                }
            )
            return

        await self.send_json(
            {
                "type": Msg.ACK,
                "version": result.version,
            }
        )

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "broadcast.edit",
                "version": result.version,
                "content": result.content,
                "user_id": str(user.id),
            },
        )

    async def broadcast_edit(self, event: dict[str, Any]) -> None:
        await self.send_json(
            {
                "type": Msg.BROADCAST,
                "version": event["version"],
                "content": event["content"],
                "user_id": event["user_id"],
            }
        )

    async def document_message(self, event: dict[str, Any]) -> None:
        await self.send_json(
            {
                "type": Msg.BROADCAST,
                "version": event.get("version"),
                "content": event.get("message", {}).get("content"),
                "user_id": event["user_id"],
            }
        )

    async def presence_join(self, event: dict[str, Any]) -> None:
        if event.get("connection_id") == self.connection_id:
            return

        await self.send_json(
            {
                "type": Msg.PRESENCE_JOIN,
                "user_id": event["user_id"],
            }
        )

    async def presence_leave(self, event: dict[str, Any]) -> None:
        await self.send_json(
            {
                "type": Msg.PRESENCE_LEAVE,
                "user_id": event["user_id"],
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

    @database_sync_to_async
    def user_can_edit(self, document: Document, user: User) -> bool:
        return self.collaboration.can_edit(document, user)

    @database_sync_to_async
    def apply_edit(self, *, document: Document, user: User, expected_version: int, content: str):
        return self.collaboration.apply_edit(
            document=document,
            user=user,
            expected_version=expected_version,
            content=content,
        )
        
    async def disconnect(self, close_code: int) -> None:
        
        if not self.group_name:
            return
        
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
        
        document = self.document
        
        if document is None:
            return
        
        user = self.scope.get("user")
        
        if user is None or user.is_anonymous:
            return
        
        user_became_offline, _ = (
            await self.presence.disconnect(
                document_id=str(document.id),
                user_id=str(user.id)
            )
        )
        
        if user_became_offline:
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "presence.leave",
                    "user_id": str(user.id)
                }
            )