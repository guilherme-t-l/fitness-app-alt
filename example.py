#!/usr/bin/env python3
"""
Example usage of the LLM Wrapper.

This script demonstrates how to use the LLM wrapper in your own projects.
"""

import os
import sys
from llm_wrapper import LLMWrapper, Config


def main():
    """Main example function."""
    print("🤖 LLM Wrapper Example")
    print("=" * 50)
    
    try:
        # Initialize the LLM wrapper
        print("Initializing LLM wrapper...")
        config = Config.from_env()
        llm = LLMWrapper(config=config)
        print("✅ LLM wrapper initialized successfully!")
        
        # Show available models
        print(f"\n📋 Available models: {', '.join(llm.get_available_models())}")
        
        # Example 1: Basic text generation
        print("\n🔤 Example 1: Basic Text Generation")
        print("-" * 40)
        prompt = "Write a haiku about programming."
        print(f"Prompt: {prompt}")
        print("Response:")
        response = llm.generate(prompt, temperature=0.7)
        print(f"  {response}")
        
        # Example 2: Streaming generation
        print("\n🌊 Example 2: Streaming Generation")
        print("-" * 40)
        prompt = "Tell me a short story about a robot learning to paint."
        print(f"Prompt: {prompt}")
        print("Response (streaming):")
        print("  ", end="", flush=True)
        for chunk in llm.generate_stream(prompt, temperature=0.8):
            print(chunk, end="", flush=True)
        print("\n")
        
        # Example 3: Chat conversation
        print("\n💬 Example 3: Chat Conversation")
        print("-" * 40)
        messages = [
            {"role": "system", "content": "You are a helpful coding assistant."},
            {"role": "user", "content": "What's the best way to learn Python?"},
            {"role": "assistant", "content": "Great question! Here are some effective ways to learn Python..."},
            {"role": "user", "content": "Can you give me a simple example?"}
        ]
        
        print("Conversation:")
        for msg in messages:
            role = msg["role"].title()
            content = msg["content"]
            print(f"  {role}: {content}")
        
        print("\nAssistant's response:")
        response = llm.chat(messages, temperature=0.6)
        print(f"  Assistant: {response}")
        
        # Example 4: Different models
        print("\n🎯 Example 4: Using Different Models")
        print("-" * 40)
        prompt = "Explain quantum computing in simple terms."
        
        for model in ["claude-3-5-haiku-20241022", "claude-3-haiku-20240307"]:
            if model in llm.get_available_models():
                print(f"\nUsing {model}:")
                try:
                    response = llm.generate(
                        prompt, 
                        model=model, 
                        max_tokens=200,
                        temperature=0.5
                    )
                    print(f"  {response[:100]}...")
                except Exception as e:
                    print(f"  Error with {model}: {e}")
        
        print("\n✅ All examples completed successfully!")
        
    except ValueError as e:
        print(f"❌ Configuration error: {e}")
        print("\n💡 Make sure to set your ANTHROPIC_API_KEY environment variable:")
        print("   export ANTHROPIC_API_KEY='your-api-key-here'")
        sys.exit(1)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
