#!/usr/bin/env python3
"""
Database initialization script for FarmWhisper backend
"""

import os
import sys

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

def init_database():
    """Initialize the database with required collections and indexes"""
    try:
        print("Initializing FarmWhisper database...")
        
        # Import the database module which will create indexes
        from models.database import init_database
        
        # Initialize the database
        init_database()
        
        print("Database initialized successfully!")
        return True
        
    except ImportError as e:
        print(f"Import error: {e}")
        print("Make sure you're running this script from the project root directory")
        return False
    except Exception as e:
        print(f"Database initialization failed: {e}")
        return False

if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)