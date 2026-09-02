from __future__ import annotations

from redis.asyncio import Redis


class PresenceService:
    def __init__(self, redis: Redis,) -> None:
        self.redis = redis

    @staticmethod
    def key(document_id: str,) -> str:
        return f"presence:{document_id}"

    async def connect(self, document_id: str, user_id: str,) -> tuple[bool, int]:
        key = self.key(document_id)

        previous_count = await self.redis.hget(
            key,
            user_id,
        )

        count = int(previous_count or 0)

        await self.redis.hset(
            key,
            user_id,
            count + 1,
        )

        user_became_online = count == 0

        online_users = await self.redis.hlen(key,)

        return (
            user_became_online,
            int(online_users),
        )

    async def disconnect(self, document_id: str, user_id: str,) -> tuple[bool, int]:
        key = self.key(document_id)

        current_value = await self.redis.hget(
            key,
            user_id,
        )

        if current_value is None:
            return False, int(
                await self.redis.hlen(key),
            )

        count = int(current_value)

        if count <= 1:
            await self.redis.hdel(
                key,
                user_id,
            )

            user_became_offline = True

        else:
            await self.redis.hset(
                key,
                user_id,
                count - 1,
            )

            user_became_offline = False

        online_users = await self.redis.hlen(
            key,
        )

        if online_users == 0:
            await self.redis.delete(key)

        return (
            user_became_offline,
            int(online_users),
        )

    async def users(self, document_id: str,) -> list[str]:
        key = self.key(document_id)

        users = await self.redis.hkeys(key)

        return [
            user.decode()
            if isinstance(user, bytes)
            else str(user)
            for user in users
        ]