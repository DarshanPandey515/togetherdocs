from __future__ import annotations
from typing import Literal
from django.contrib.auth import get_user_model
from django.db.models import QuerySet
from src.models import Document, DocumentPermission

User = get_user_model()

Role = Literal["owner", "viewer", "editor"]  

def get_document_role(document: Document, user: User) -> Role | None:  # type: ignore
    if document.owner_id == user.id:
        return "owner"
    
    permission = (
        DocumentPermission.objects
        .filter(
            document=document,
            user=user
        )
        .first()
    )
    
    if permission is None:
        return None
    
    return permission.role  
    
def can_view_document(document: Document, user: User) -> bool: #type: ignore
    return get_document_role(document, user) is not None



def can_edit_document(document: Document, user: User) -> bool: #type: ignore
    role = get_document_role(document, user) 
    return role in {"owner", "editor"}


def can_share_document(document: Document, user: User) -> bool: #type: ignore
    return document.owner_id == user.id


def get_accessible_documents(document: Document, user: User) -> QuerySet[Document]: #type: ignore
    return Document.objects.filter(
        owner=user,
    ) | Document.objects.filter(
        permission__user=user,
    )