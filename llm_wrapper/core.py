"""
Core LLM wrapper functionality.
"""

from typing import Optional, Dict, Any, Iterator
from .providers import BaseProvider, AnthropicProvider
from .config import Config


class LLMWrapper:
    """
    Main LLM wrapper class that provides a unified interface for different LLM providers.
    """
    
    def __init__(self, provider: Optional[BaseProvider] = None, config: Optional[Config] = None):
        """
        Initialize the LLM wrapper.
        
        Args:
            provider: LLM provider instance. If None, will create Anthropic provider.
            config: Configuration instance. If None, will create from environment.
        """
        self.config = config or Config.from_env()
        self.provider = provider or AnthropicProvider(self.config.anthropic_api_key)
    
    def generate(
        self, 
        prompt: str, 
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        **kwargs
    ) -> str:
        """
        Generate text from a prompt.
        
        Args:
            prompt: The input prompt
            model: Model to use (provider-specific)
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            **kwargs: Additional provider-specific parameters
            
        Returns:
            Generated text
        """
        return self.provider.generate(
            prompt=prompt,
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
            **kwargs
        )
    
    def generate_stream(
        self, 
        prompt: str, 
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        **kwargs
    ) -> Iterator[str]:
        """
        Generate streaming text from a prompt.
        
        Args:
            prompt: The input prompt
            model: Model to use (provider-specific)
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            **kwargs: Additional provider-specific parameters
            
        Yields:
            Text chunks as they are generated
        """
        yield from self.provider.generate_stream(
            prompt=prompt,
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
            **kwargs
        )
    
    def get_available_models(self) -> list:
        """
        Get list of available models for the current provider.
        
        Returns:
            List of model names
        """
        return self.provider.get_available_models()
    
    def chat(
        self, 
        messages: list, 
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        **kwargs
    ) -> str:
        """
        Chat with the model using a conversation format.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            model: Model to use (provider-specific)
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            **kwargs: Additional provider-specific parameters
            
        Returns:
            Generated response
        """
        # Convert messages to a single prompt for simple providers
        prompt = self._messages_to_prompt(messages)
        return self.generate(
            prompt=prompt,
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
            **kwargs
        )
    
    def _messages_to_prompt(self, messages: list) -> str:
        """
        Convert a list of messages to a single prompt string.
        
        Args:
            messages: List of message dictionaries
            
        Returns:
            Formatted prompt string
        """
        prompt_parts = []
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            if role == "system":
                prompt_parts.append(f"System: {content}")
            elif role == "user":
                prompt_parts.append(f"User: {content}")
            elif role == "assistant":
                prompt_parts.append(f"Assistant: {content}")
        
        return "\n\n".join(prompt_parts) + "\n\nAssistant:"
