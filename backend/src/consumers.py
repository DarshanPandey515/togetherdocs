from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser


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