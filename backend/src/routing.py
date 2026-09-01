from django.urls import path

from src.consumers import TestConsumer, DocumentConsumer


websocket_urlpatterns = [
    path("ws/test/", TestConsumer.as_asgi()),    
    path("ws/documents/<uuid:document_id>/", DocumentConsumer.as_asgi())
]