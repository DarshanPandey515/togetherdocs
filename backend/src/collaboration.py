from __future__ import annotations
from dataclasses import dataclass
from typing import Any
from django.db import transaction
from src.models import Document, DocumentVersion, CustomUser
from src.permissions import can_edit_document, can_view_document


@dataclass(frozen=True)
class EditResult:
    ok: bool
    version: int
    content: str
    code: str | None = None
    message: str | None = None


class CollaborationService:
    def validate_edit(self, payload: dict[str, Any]) -> tuple[str | None, int | None, str | None]:
        content = payload.get("content")
        if not isinstance(content, str):
            return ("bad_request", None, "Missing or invalid 'content' (must be a string).")

        version = payload.get("version")
        if not isinstance(version, int):
            return ("bad_request", None, "Missing or invalid 'version' (must be an integer).")

        return None, version, content

    @transaction.atomic
    def apply_edit(self, *, document: Document, user: CustomUser, expected_version: int, content: str,) -> EditResult:
        locked = Document.objects.select_for_update().get(pk=document.pk)

        if expected_version != locked.version:
            return EditResult(
                ok=False,
                version=locked.version,
                content=locked.content,
                code="conflict",
                message=(
                    f"Version conflict: you edited from v{expected_version} "
                    f"but the document is now v{locked.version}."
                ),
            )

        if locked.content == content:
            return EditResult(ok=True, version=locked.version, content=locked.content)

        new_version = locked.version + 1
        locked.content = content
        locked.version = new_version
        locked.save(update_fields=["content", "version", "updated_at"])

        DocumentVersion.objects.create(
            document=locked,
            version=new_version,
            content=content,
            created_by=user,
        )

        return EditResult(ok=True, version=new_version, content=content)

    def can_edit(self, document: Document, user: CustomUser) -> bool:
        return can_edit_document(document, user)

    def can_view(self, document: Document, user: CustomUser) -> bool:
        return can_view_document(document, user)
