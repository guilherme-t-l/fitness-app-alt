"""
Flask web interface for a nutritionist AI assistant.

This application provides a REST API for interacting with an LLM-powered nutritionist
that can help users with meal planning, food substitutions, and macro calculations.
The app provides REST API endpoints for nutritionist interactions.

Key Features:
- Chat interface with multiple LLM providers (OpenAI, Anthropic)
- Specialized nutritionist endpoints with meal plan context
- Model selection and parameter configuration
- CORS support for frontend integration
"""

import os
import sys
import re
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS

# Add the parent directory to the path so we can import llm_wrapper
# This allows us to import the custom LLM wrapper module from the parent directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from llm_wrapper import LLMWrapper, Config

# Initialize Flask application with CORS support
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for frontend integration

# Initialize the LLM wrapper with configuration from environment variables
# The LLM wrapper abstracts different AI providers (OpenAI, Anthropic) behind a unified interface
try:
    config = Config.from_env()  # Load API keys and settings from environment
    llm = LLMWrapper(config=config)
except ValueError as e:
    print(f"Configuration error: {e}")
    llm = None  # Set to None if configuration fails (e.g., missing API keys)

def load_system_prompt():
    """
    Load the nutritionist system prompt from file.
    
    The system prompt defines the AI's role and capabilities as a nutritionist,
    including food substitution logic, macro calculation, and meal planning guidance.
    
    Returns:
        str: The system prompt text
    
    Raises:
        FileNotFoundError: If the nutritionist_system_prompt.txt file is not found
    """
    try:
        with open(os.path.join(os.path.dirname(__file__), 'nutritionist_system_prompt.txt'), 'r') as f:
            return f.read().strip()
    except FileNotFoundError:
        raise FileNotFoundError("nutritionist_system_prompt.txt file not found.")


def parse_nutritionist_response(response_text):
    """
    Parse the nutritionist response to extract chat and meal-plan content.
    
    The AI is instructed to respond in a specific format with <chat> and <meal-plan> tags.
    This function extracts the content from each section and handles parsing errors.
    
    Args:
        response_text (str): The raw response from the AI
        
    Returns:
        dict: {
            'chat': str,           # User-facing message
            'meal_plan': str,      # Side-panel meal plan content
            'raw_response': str,   # Original response for debugging
            'parsing_error': bool  # True if parsing failed
        }
    """
    try:
        # Use regex to extract content between <chat> and <meal-plan> tags
        chat_pattern = r'<chat>\s*(.*?)\s*</chat>'
        meal_plan_pattern = r'<meal-plan>\s*(.*?)\s*</meal-plan>'
        
        chat_match = re.search(chat_pattern, response_text, re.DOTALL)
        meal_plan_match = re.search(meal_plan_pattern, response_text, re.DOTALL)
        
        # Check if both tags are found
        if chat_match and meal_plan_match:
            return {
                'chat': chat_match.group(1).strip(),
                'meal_plan': meal_plan_match.group(1).strip(),
                'raw_response': response_text,
                'parsing_error': False
            }
        else:
            # If parsing fails, return error message in chat
            return {
                'chat': 'PARSING ERROR',
                'meal_plan': '',
                'raw_response': response_text,
                'parsing_error': True
            }
            
    except Exception as e:
        # Handle any unexpected errors during parsing
        return {
            'chat': 'PARSING ERROR',
            'meal_plan': '',
            'raw_response': response_text,
            'parsing_error': True
        }


@app.route('/')
def index():
    """
    Main page route that serves the chat interface.
    
    Returns:
        str: Rendered HTML template for the frontend chat interface
    """
    return render_template('index.html')


@app.route('/api/models')
def get_models():
    """
    Get available LLM models.
    
    Returns:
        JSON: List of available models
    """
    if not llm:
        return jsonify({'error': 'LLM wrapper not initialized'}), 500
    
    try:
        # Get available models from the LLM wrapper
        models = llm.get_available_models()
        return jsonify({'models': models})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/nutritionist/chat', methods=['POST'])
def nutritionist_chat():
    """
    Nutritionist chat completion API endpoint with meal plan context.
    
    This is the specialized endpoint for nutritionist interactions. It combines:
    1. The nutritionist system prompt (defines AI role and capabilities)
    2. Current meal plan context (user's existing meal plan data)
    3. User's specific request or question
    
    The AI can then provide contextual advice about food substitutions, macro adjustments,
    and meal planning based on the user's current meal plan.
    
    Request JSON:
        - message (str): User's nutrition-related question or request
        - meal_plan_context (str, optional): Current meal plan data for context
        - model (str, optional): LLM model to use (default: claude-3-5-haiku-20241022)
        - temperature (float, optional): Response creativity (0.0-1.0, default: 0.7)
        - max_tokens (int, optional): Maximum response length (default: 1000)
    
    Returns:
        JSON: {'response': str} on success, {'error': str} on failure
    """
    if not llm:
        return jsonify({'error': 'LLM wrapper not initialized. Check your API key.'}), 500
    
    try:
        # Extract parameters from the JSON request
        data = request.get_json()
        user_message = data.get('message', '') # change
        meal_plan_context = data.get('meal_plan_context', '') # change
        model = data.get('model', 'claude-3-5-haiku-20241022')
        temperature = data.get('temperature', 0.7)
        max_tokens = data.get('max_tokens', 1000)
        
        # Validate required parameters
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Construct the full prompt by combining system context, meal plan, and user request
        system_prompt = load_system_prompt()
        full_prompt = f"{system_prompt}\n\n{meal_plan_context}\n\nUser request: {user_message}"
        
        # Generate AI response with the complete context
        raw_response = llm.generate(
            prompt=full_prompt,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        # Parse the response to extract chat and meal-plan content
        parsed_response = parse_nutritionist_response(raw_response)
        
        return jsonify({
            'chat': parsed_response['chat'],
            'meal_plan': parsed_response['meal_plan'],
            'raw_response': parsed_response['raw_response'],
            'parsing_error': parsed_response['parsing_error']
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500




if __name__ == '__main__':
    """
    Application entry point.
    
    When run directly (not imported), start the Flask development server.
    The server runs in debug mode for development and listens on all interfaces
    (0.0.0.0) on port 5000, making it accessible from other devices on the network.
    """
    app.run(debug=True, host='0.0.0.0', port=5000)
