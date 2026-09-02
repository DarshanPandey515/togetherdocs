from __future__ import annotations
import os
from dotenv import load_dotenv
from redis.asyncio import Redis

load_dotenv()

REDIS_URL = os.getenv("UPSTASH_REDIS_REST_URL")

if REDIS_URL and REDIS_URL.startswith("redis://"):
    host = REDIS_URL.split("://", 1)[1].split("@")[-1].split(":")[0]
    if host not in ("localhost", "127.0.0.1", "::1", "0.0.0.0"):
        REDIS_URL = REDIS_URL.replace("redis://", "rediss://", 1)

redis_client = Redis.from_url(
    REDIS_URL,
    decode_responses=True,
)
