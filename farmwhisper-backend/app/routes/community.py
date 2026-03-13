from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.models import CommunityPost, CommunityPostCreate, CommunityPostUpdate, UpvoteRequest
from app.services.community_service import (
    create_post, get_posts, get_post_by_id, update_post, 
    delete_post, upvote_post, search_posts_by_tag
)

router = APIRouter()

@router.post("/", response_model=CommunityPost, summary="Create a new community post")
async def create_community_post(post: CommunityPostCreate):
    """
    Create a new post in the community feed.
    
    - **user_id**: ID of the user creating the post
    - **title**: Title of the post
    - **content**: Content of the post
    - **tags**: List of tags for the post
    """
    try:
        # Validate input
        if not post.user_id or not post.user_id.strip():
            raise HTTPException(status_code=400, detail="User ID is required")
        
        if not post.title or not post.title.strip():
            raise HTTPException(status_code=400, detail="Title is required")
        
        if not post.content or not post.content.strip():
            raise HTTPException(status_code=400, detail="Content is required")
        
        created_post = create_post(post)
        return created_post
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create post: {str(e)}")

@router.get("/", response_model=List[CommunityPost], summary="List community posts")
async def list_community_posts(
    limit: int = Query(50, description="Number of posts to retrieve", ge=1, le=100),
    offset: int = Query(0, description="Number of posts to skip", ge=0)
):
    """
    Get a list of community posts with pagination.
    
    - **limit**: Number of posts to retrieve (1-100, default: 50)
    - **offset**: Number of posts to skip (default: 0)
    """
    try:
        posts = get_posts(limit, offset)
        return posts
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve posts: {str(e)}")

@router.get("/search", response_model=List[CommunityPost], summary="Search posts by tag")
async def search_community_posts(tag: str = Query(..., description="Tag to search for", min_length=1)):
    """
    Search community posts by tag.
    
    - **tag**: Tag to search for
    """
    try:
        posts = search_posts_by_tag(tag)
        return posts
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search posts: {str(e)}")

@router.get("/{post_id}", response_model=CommunityPost, summary="Get a specific post")
async def get_community_post(post_id: str):
    """
    Get a specific community post by ID.
    
    - **post_id**: ID of the post to retrieve
    """
    try:
        post = get_post_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        return post
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve post: {str(e)}")

@router.put("/{post_id}", response_model=CommunityPost, summary="Update a post")
async def update_community_post(post_id: str, post: CommunityPostUpdate):
    """
    Update a community post.
    
    - **post_id**: ID of the post to update
    - **title**: New title (optional)
    - **content**: New content (optional)
    - **tags**: New tags (optional)
    """
    try:
        # Check if at least one field is provided for update
        if post.title is None and post.content is None and post.tags is None:
            raise HTTPException(status_code=400, detail="At least one field (title, content, or tags) must be provided for update")
        
        updated_post = update_post(post_id, post)
        if not updated_post:
            raise HTTPException(status_code=404, detail="Post not found or no changes made")
        return updated_post
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update post: {str(e)}")

@router.delete("/{post_id}", summary="Delete a post")
async def delete_community_post(post_id: str):
    """
    Delete a community post.
    
    - **post_id**: ID of the post to delete
    """
    try:
        deleted = delete_post(post_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Post not found")
        return {"message": "Post deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete post: {str(e)}")

@router.post("/upvote", summary="Upvote a post")
async def upvote_community_post(request: UpvoteRequest):
    """
    Upvote a community post.
    
    - **post_id**: ID of the post to upvote
    - **user_id**: ID of the user upvoting the post
    """
    try:
        # Validate input
        if not request.post_id or not request.post_id.strip():
            raise HTTPException(status_code=400, detail="Post ID is required")
        
        if not request.user_id or not request.user_id.strip():
            raise HTTPException(status_code=400, detail="User ID is required")
        
        # In a real implementation, you would check if the user has already upvoted
        # to prevent multiple upvotes from the same user
        updated_post = upvote_post(request.post_id)
        if not updated_post:
            raise HTTPException(status_code=404, detail="Post not found")
        return {"message": "Post upvoted successfully", "upvotes": updated_post.upvotes}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upvote post: {str(e)}")