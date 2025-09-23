"""
Database configuration and connection management for Supabase.
"""

import os
from supabase import create_client, Client
from typing import Optional
from dotenv import load_dotenv, find_dotenv

# Find and load .env file from parent directory
dotenv_path = find_dotenv()
if dotenv_path:
    load_dotenv(dotenv_path)
else:
    # Fallback: try to load from parent directory
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(parent_dir, '.env')
    if os.path.exists(env_path):
        load_dotenv(env_path)

class DatabaseConfig:
    """Database configuration for Supabase connection."""
    
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_ANON_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError(
                "Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables."
            )
    
    def get_client(self) -> Client:
        """Create and return a Supabase client."""
        try:
            return create_client(self.supabase_url, self.supabase_key)
        except Exception as e:
            raise ConnectionError(f"Failed to connect to Supabase: {str(e)}")

# Global database instance
db_config = DatabaseConfig()
supabase: Client = db_config.get_client()

def get_supabase_client() -> Client:
    """Get the Supabase client instance."""
    return supabase
