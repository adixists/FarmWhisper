from typing import List, Optional
from datetime import datetime
from app.models.models import CommunityPost, CommunityPostCreate, CommunityPostUpdate
from app.models.database import community_posts_collection
from bson import ObjectId

def create_post(post_data: CommunityPostCreate) -> CommunityPost:
    """
    Create a new community post.
    """
    try:
        # Create post object
        post = CommunityPost(
            user_id=post_data.user_id,
            title=post_data.title,
            content=post_data.content,
            tags=post_data.tags
        )
        
        # Insert into database
        result = community_posts_collection.insert_one(post.dict())
        
        # Add ID to post
        post.id = str(result.inserted_id)
        
        return post
    
    except Exception as e:
        raise Exception(f"Failed to create post: {str(e)}")

def get_posts(limit: int = 50, offset: int = 0) -> List[CommunityPost]:
    """
    Get all community posts with pagination.
    """
    try:
        # Query posts with pagination
        posts_cursor = community_posts_collection.find().sort("created_at", -1).skip(offset).limit(limit)
        
        posts = []
        for post_data in posts_cursor:
            post_data["id"] = str(post_data["_id"])
            del post_data["_id"]
            posts.append(CommunityPost(**post_data))
        
        return posts
    
    except Exception as e:
        raise Exception(f"Failed to retrieve posts: {str(e)}")

def get_post_by_id(post_id: str) -> Optional[CommunityPost]:
    """
    Get a specific post by ID.
    """
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(post_id):
            return None
        
        # Find post
        post_data = community_posts_collection.find_one({"_id": ObjectId(post_id)})
        
        if post_data:
            post_data["id"] = str(post_data["_id"])
            del post_data["_id"]
            return CommunityPost(**post_data)
        
        return None
    
    except Exception as e:
        raise Exception(f"Failed to retrieve post: {str(e)}")

def update_post(post_id: str, post_data: CommunityPostUpdate) -> Optional[CommunityPost]:
    """
    Update a community post.
    """
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(post_id):
            return None
        
        # Prepare update data
        update_fields = {}
        if post_data.title is not None:
            update_fields["title"] = post_data.title
        if post_data.content is not None:
            update_fields["content"] = post_data.content
        if post_data.tags is not None:
            update_fields["tags"] = post_data.tags
        
        # If no fields to update, return None
        if not update_fields:
            return None
        
        # Update post
        result = community_posts_collection.update_one(
            {"_id": ObjectId(post_id)},
            {"$set": update_fields}
        )
        
        # If post was updated, return updated post
        if result.modified_count > 0:
            return get_post_by_id(post_id)
        
        return None
    
    except Exception as e:
        raise Exception(f"Failed to update post: {str(e)}")

def delete_post(post_id: str) -> bool:
    """
    Delete a community post.
    """
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(post_id):
            return False
        
        # Delete post
        result = community_posts_collection.delete_one({"_id": ObjectId(post_id)})
        
        return result.deleted_count > 0
    
    except Exception as e:
        raise Exception(f"Failed to delete post: {str(e)}")

def upvote_post(post_id: str) -> Optional[CommunityPost]:
    """
    Upvote a community post.
    """
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(post_id):
            return None
        
        # Increment upvotes
        result = community_posts_collection.update_one(
            {"_id": ObjectId(post_id)},
            {"$inc": {"upvotes": 1}}
        )
        
        # If post was updated, return updated post
        if result.modified_count > 0:
            return get_post_by_id(post_id)
        
        return None
    
    except Exception as e:
        raise Exception(f"Failed to upvote post: {str(e)}")

def search_posts_by_tag(tag: str) -> List[CommunityPost]:
    """
    Search posts by tag.
    """
    try:
        # Query posts with specific tag
        posts_cursor = community_posts_collection.find({"tags": tag}).sort("created_at", -1)
        
        posts = []
        for post_data in posts_cursor:
            post_data["id"] = str(post_data["_id"])
            del post_data["_id"]
            posts.append(CommunityPost(**post_data))
        
        return posts
    
    except Exception as e:
        raise Exception(f"Failed to search posts: {str(e)}")