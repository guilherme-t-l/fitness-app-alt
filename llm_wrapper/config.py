"""
Configuration management for the LLM wrapper.
"""

import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Configuration class for managing API keys and settings."""
    
    def __init__(self, anthropic_api_key: Optional[str] = None):
        """
        Initialize configuration.
        
        Args:
            anthropic_api_key: Anthropic API key. If not provided, will try to get from environment.
        """
        self.anthropic_api_key = anthropic_api_key or os.getenv("ANTHROPIC_API_KEY")
        
        if not self.anthropic_api_key:
            raise ValueError(
                "Anthropic API key is required. "
                "Set ANTHROPIC_API_KEY environment variable or pass it directly."
            )
    
    @classmethod
    def from_env(cls) -> "Config":
        """Create config from environment variables."""
        return cls()
    
    def validate(self) -> bool:
        """Validate that all required configuration is present."""
        return bool(self.anthropic_api_key)
