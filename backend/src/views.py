from __future__ import annotations
import uuid
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from src.serializers import *
from src.permissions import *

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
    authentication_classes = [IsAuthenticated]
    serializer_class = DocumentSerializer
    
    
    def get_queryset(self):
        return (
            get_accessible_documents(self.request.user)
            .select_related("owner")
            .distinct()
        )
        
    # def perform_create(self, serializer):
    #     serializer.save(
    #         owner.self.request.user
    #     )
    