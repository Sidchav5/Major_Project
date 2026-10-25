"""
MongoDB Connection Singleton.
Provides shared db/collection handles used across the backend.
"""
import os
from dotenv import load_dotenv
from pymongo import MongoClient, ASCENDING, DESCENDING

load_dotenv()

_client = None
_db = None


def get_db():
    global _client, _db
    if _db is None:
        mongo_uri = os.getenv("MONGO_URI")
        if not mongo_uri:
            raise RuntimeError("MONGO_URI not set in environment variables.")
        _client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        _db = _client["ergonomics"]

        # Ensure indexes exist
        _db["sessions"].create_index([("user_id", ASCENDING), ("started_at", DESCENDING)])
        _db["telemetry"].create_index([("session_id", ASCENDING), ("timestamp", ASCENDING)])
        _db["telemetry"].create_index([("user_id", ASCENDING)])
    return _db


def users_col():
    return get_db()["users"]


def sessions_col():
    return get_db()["sessions"]


def telemetry_col():
    return get_db()["telemetry"]


def get_fs():
    import gridfs
    return gridfs.GridFS(get_db())
