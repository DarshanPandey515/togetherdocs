from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.views import (
    SignupView,
    LoginView,
    DocumentViewset,
    DocumentPermissionViewSet,
    DocumentVersionViewset,
)

router = DefaultRouter()
router.register(
    "documents/permissions",
    DocumentPermissionViewSet,
    basename="document-permission",
)
router.register("documents", DocumentViewset, basename="document")

urlpatterns = [
    path("auth/signup/", SignupView.as_view(), name="signup"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path(
        "documents/<uuid:document_id>/versions/",
        DocumentVersionViewset.as_view(),
        name="document-versions",
    ),
    path("", include(router.urls)),
]