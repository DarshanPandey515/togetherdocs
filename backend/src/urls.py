from django.urls import path
from src.views import (
    SignupView,
    LoginView,
)

urlpatterns = [
    path("auth/signup/", SignupView.as_view(), name="signup"),
    path("auth/login/", LoginView.as_view(), name="login"),

]