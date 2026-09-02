from __future__ import annotations
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from src.models import CustomUser, Document, DocumentPermission, DocumentVersion


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    class Meta:
        model = CustomUser
        fields = ["email", "password", "name"]

    def create(self, validated_data: dict) -> CustomUser:
        return CustomUser.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            name=validated_data["name"],
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs: dict) -> dict:
        user = authenticate(
            email=attrs["email"],
            password=attrs["password"],
        )

        if user is None:
            raise serializers.ValidationError(
                "Invalid email or password."
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "This account is inactive."
            )

        refresh = RefreshToken.for_user(user)

        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
            },
        }
        
class DocumentSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(
        source="owner.name",
        read_only=True,
    )
    
    class Meta:
        model = Document
        fields = [
            "id",
            "title",
            "content",
            "version",
            "owner_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "version",
            "owner_name",
            "created_at",
            "updated_at",
        ]

class DocumentPermissionSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )
    user_name = serializers.CharField(
        source="user.name",
        read_only=True,
    )
    
    class Meta:
        model = DocumentPermission
        fields = [
            "user",
            "user_email",
            "user_name",
            "role",
            "created_at",
        ]
        read_only_fields = [
            "user_email",
            "user_name",
            "created_at",
        ]


class ShareDocumentSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(
        choices=DocumentPermission.Role.choices,
    )
    
class DocumentVersionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(
        source="created_by.name",
        read_only=True,
    )
    
    class Meta:
        model = DocumentVersion
        fields = [
            "id",
            "version",
            "content",
            "created_at",
            "created_by_name",
        ]
        read_only_fields = fields