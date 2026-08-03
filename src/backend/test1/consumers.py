from channels.generic.websocket import WebsocketConsumer
import json

class TestConsumer(WebsocketConsumer):

    def connect(self):
        print("le client se co")
        self.accept()

    def disconnect(self, close_code):
        print("le client est parti", close_code)

    def receive(self, text_data):
        print("ya des donee c'est incr:", text_data)

        self.send(text_data=json.dumps({
            "message": "le djangito il repond ou quoi la",
            "echo": text_data,
        })) 
