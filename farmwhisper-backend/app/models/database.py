import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get MongoDB URI from environment variables
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/farmwhisper")
DATABASE_NAME = os.getenv("DATABASE_NAME", "farmwhisper")

# Create MongoDB client
client = MongoClient(MONGODB_URI)
db = client[DATABASE_NAME]

# Collections
users_collection = db.users
crop_analyses_collection = db.crop_analyses
advices_collection = db.advices
community_posts_collection = db.community_posts

def get_database():
    """Get database instance"""
    return db

def close_database_connection():
    """Close database connection"""
    client.close()

def init_database():
    """
    Initialize database with indexes
    """
    try:
        # Create indexes for better query performance
        users_collection.create_index("phone_number", unique=True)
        crop_analyses_collection.create_index("user_id")
        advices_collection.create_index("crop_analysis_id")
        community_posts_collection.create_index("tags")
        community_posts_collection.create_index("created_at")
        
        print("Database indexes created successfully")
    except Exception as e:
        print(f"Failed to create database indexes: {str(e)}")

# Initialize database when module is imported
init_database()