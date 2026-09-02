from django.urls import path

from src.realtime.consumers import DocumentConsumer


websocket_urlpatterns = [
    path("ws/documents/<uuid:document_id>/", DocumentConsumer.as_asgi())
]
