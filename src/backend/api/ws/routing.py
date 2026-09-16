from django.urls import re_path
from .game_consumer import GameConsumer
from .notif_consumer import NotifConsumer 
from .friend_chat_consumer import FriendChatConsumer

websocket_urlpatterns = [
    re_path(r"ws/game/$", GameConsumer.as_asgi()),
    re_path(r"ws/notif/$", NotifConsumer.as_asgi()),
	re_path(r"ws/friend-chat/$", FriendChatConsumer.as_asgi()),
]
