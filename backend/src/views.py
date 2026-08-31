from __future__ import annotations
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet, ViewSet
from src.serializers import *
from src.permissions import *
from src.services import create_document, save_document_content
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework.decorators import action
from django.db import transaction
from rest_framework import generics

User = get_user_model()

class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        return Response(
            {
                "message": "User created successfully.",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        return Response(
            {
                "message": "Login successful.",
                **serializer.validated_data,
            },
            status=status.HTTP_200_OK,
        )
        
        
class DocumentViewset(ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = DocumentSerializer
    
    
    def get_queryset(self):
        return (
            get_accessible_documents(self.request.user)
            .select_related("owner")
            .distinct()
        )
        
    def perform_create(self, serializer):
        document = create_document(
            owner=self.request.user,
            title=serializer.validated_data["title"],
            content=serializer.validated_data.get("content", ""),
        )
        serializer.instance = document
        
    def update(self, request, *args, **kwargs):
        document = self.get_object()
        
        if not can_edit_document(document,request.user):
            return Response({
                "message":"You cannot edit this document."
            }, status=status.HTTP_403_FORBIDDEN)
            
        return super().update(request, *args, **kwargs,)
    
    def perform_update(self, serializer):
        document = serializer.instance

        updated = save_document_content(
            document=document,
            content=serializer.validated_data.get("content", document.content),
            title=serializer.validated_data.get("title"),
            user=self.request.user,
        )

        serializer.instance = updated
    
    
    def destroy(self, request, *args, **kwargs):
        document = self.get_object()

        if document.owner_id != request.user.id:
            return Response({
                "message": "Only the owner can delete the document.",
            }, status=status.HTTP_403_FORBIDDEN,)

        return super().destroy(
            request,
            *args,
            **kwargs,
        )
        

class DocumentPermissionViewSet(ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["post"], url_path="share",)
    def share(self, request, pk=None):
        serializer = ShareDocumentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data["email"]
        role = serializer.validated_data["role"]

        
        with transaction.atomic():
            document = get_object_or_404(
                Document,
                pk=pk,
            )
            
            if not can_share_document(document, request.user):
                return Response(
                    {"detail": "Only the owner can share this document."},
                    status=status.HTTP_403_FORBIDDEN,
                )
                
            user = get_object_or_404(
                User,
                email=email,
            )

            if user.id == document.owner_id:
                return Response(
                    {"detail": "Owner already has full access."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            permission, _ = (
                DocumentPermission.objects.update_or_create(
                    document=document,
                    user=user,
                    defaults={"role": role},
                )
            )

        return Response(
            DocumentPermissionSerializer(permission).data,
            status=status.HTTP_200_OK,
        )
        

class DocumentVersionViewset(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DocumentVersionSerializer
    
    
    def get_queryset(self):
        document_id = self.kwargs["document_id"]

        document = get_object_or_404(
            Document,
            pk=document_id,
        )

        if not can_view_document(document, self.request.user):
            raise PermissionDenied(
                "You don't have access to this document.",
            )

        return DocumentVersion.objects.filter(
            document_id=document_id,
        ).select_related(
            "created_by",
        )