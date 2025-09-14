"""
LLM Wrapper - A simple, scalable wrapper for Large Language Models.

This package provides a clean interface for interacting with various LLM providers,
starting with Anthropic. It's designed to be simple, easy to use, and easily extensible.
"""

from .core import LLMWrapper
from .providers import AnthropicProvider
from .config import Config

__version__ = "1.0.0"
__all__ = ["LLMWrapper", "AnthropicProvider", "Config"]
