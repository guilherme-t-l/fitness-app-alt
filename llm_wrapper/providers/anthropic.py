"""
Anthropic provider implementation.
"""

import anthropic
from typing import Optional, List, Iterator
from .base import BaseProvider


class AnthropicProvider(BaseProvider):
    """Anthropic provider for Claude models."""
    
    def __init__(self, api_key: str, **kwargs):
        """
        Initialize Anthropic provider.
        
        Args:
            api_key: Anthropic API key
            **kwargs: Additional configuration
        """
        super().__init__(api_key, **kwargs)
        self.client = anthropic.Anthropic(api_key=api_key)
        self.default_model = kwargs.get("default_model", "claude-3-5-haiku-20241022")
    
    def generate(
        self, 
        prompt: str, 
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        **kwargs
    ) -> str:
        """
        Generate text using Anthropic API.
        
        Args:
            prompt: The input prompt
            model: Model to use (defaults to claude-3-sonnet-20240229)
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0.0 to 1.0)
            **kwargs: Additional Anthropic parameters
            
        Returns:
            Generated text
        """
        model = model or self.default_model
        
        try:
            response = self.client.messages.create(
                model=model,
                max_tokens=max_tokens or 1000,
                temperature=temperature,
                messages=[{"role": "user", "content": prompt}],
                **kwargs
            )
            return response.content[0].text
        except Exception as e:
            raise Exception(f"Anthropic API error: {str(e)}")
    
    def generate_stream(
        self, 
        prompt: str, 
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        **kwargs
    ) -> Iterator[str]:
        """
        Generate streaming text using Anthropic API.
        
        Args:
            prompt: The input prompt
            model: Model to use (defaults to claude-3-sonnet-20240229)
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0.0 to 1.0)
            **kwargs: Additional Anthropic parameters
            
        Yields:
            Text chunks as they are generated
        """
        model = model or self.default_model
        
        try:
            with self.client.messages.stream(
                model=model,
                max_tokens=max_tokens or 1000,
                temperature=temperature,
                messages=[{"role": "user", "content": prompt}],
                **kwargs
            ) as stream:
                for text in stream.text_stream:
                    yield text
        except Exception as e:
            raise Exception(f"Anthropic streaming API error: {str(e)}")
    
    def get_available_models(self) -> List[str]:
        """
        Get list of available Anthropic models.
        
        Returns:
            List of model names
        """
        return [
            "claude-3-5-haiku-20241022",
            "claude-3-haiku-20240307",
        ]
