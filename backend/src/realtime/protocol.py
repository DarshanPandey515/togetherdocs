from __future__ import annotations

class Msg:
    CONNECTION_ACCEPTED = "connection.accepted"
    ERROR = "error"

    EDIT = "edit"
    ACK = "ack"
    REJECT = "reject"
    BROADCAST = "broadcast"  
    STATE = "state"

    PRESENCE_STATE = "presence.state"
    PRESENCE_JOIN = "presence.join"
    PRESENCE_LEAVE = "presence.leave"


class Code:
    CONFLICT = "conflict"
    STALE = "stale"
    BAD_REQUEST = "bad_request"
    FORBIDDEN = "forbidden"
    NOT_FOUND = "not_found"
    UNAUTHORIZED = "unauthorized"


ACTION_EDIT = "edit"
ACTION_SYNC = "sync"
