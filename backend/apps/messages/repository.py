from datetime import datetime
from bson import ObjectId
from django.conf import settings
import pymongo

_client = pymongo.MongoClient(settings.MONGODB_URI)
_db     = _client[settings.MONGODB_DB_NAME]


class MessageRepository:

    @staticmethod
    def get_or_create_conversation(pg_conversation_id: str) -> str:
        col = _db['conversations']
        doc = col.find_one({'pg_conversation_id': pg_conversation_id})
        if doc:
            return str(doc['_id'])

        result = col.insert_one({
            'pg_conversation_id': pg_conversation_id,
            'messages':           [],
            'created_at':         datetime.utcnow(),
            'updated_at':         datetime.utcnow(),
        })
        return str(result.inserted_id)

    @staticmethod
    def append_message(mongo_conv_id: str, message: dict):
        col = _db['conversations']
        col.update_one(
            {'_id': ObjectId(mongo_conv_id)},
            {
                '$push': {'messages': {
                    '_id':          ObjectId(),
                    'external_id':  message.get('external_id', ''),
                    'sender_id':    message.get('sender_id', ''),
                    'direction':    message.get('direction', 'inbound'),
                    'type':         message.get('message_type', 'text'),
                    'text':         message.get('text', ''),
                    'attachments':  message.get('attachments', []),
                    'timestamp':    message.get('timestamp', datetime.utcnow()),
                    'read_at':      None,
                    'delivered_at': None,
                }},
                '$set': {'updated_at': datetime.utcnow()},
            }
        )

    @staticmethod
    def get_messages(mongo_conv_id: str) -> list:
        col = _db['conversations']
        doc = col.find_one(
            {'_id': ObjectId(mongo_conv_id)},
            {'messages': 1}
        )
        return doc['messages'] if doc else []

    @staticmethod
    def mark_as_read(mongo_conv_id: str, message_id: str):
        col = _db['conversations']
        col.update_one(
            {
                '_id':          ObjectId(mongo_conv_id),
                'messages._id': ObjectId(message_id),
            },
            {'$set': {'messages.$.read_at': datetime.utcnow()}}
        )