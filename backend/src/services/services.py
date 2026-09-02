from __future__ import annotations

from django.db import transaction
from src.models import CustomUser, Document, DocumentVersion


def create_document(*, owner: CustomUser, title: str, content: str,) -> Document:
    with transaction.atomic():
        document = Document.objects.create(
            owner=owner,
            title=title,
            content=content,
            version=0,
        )
        DocumentVersion.objects.create(
            document=document,
            version=0,
            content=content,
            created_by=owner,
        )
    return document


def save_document_content(*, document: Document, content: str, user: CustomUser, title: str | None = None) -> Document:
    with transaction.atomic():
        locked = Document.objects.select_for_update().get(pk=document.pk)

        if title is not None:
            locked.title = title

        content_changed = locked.content != content
        if not content_changed and title is None:
            return locked

        update_fields = ["updated_at"]
        if content_changed:
            new_version = locked.version + 1
            locked.content = content
            locked.version = new_version
            update_fields.extend(["content", "version"])
        if title is not None:
            update_fields.append("title")

        locked.save(update_fields=update_fields)

        if content_changed:
            DocumentVersion.objects.create(
                document=locked,
                version=new_version,
                content=content,
                created_by=user,
            )

    return locked