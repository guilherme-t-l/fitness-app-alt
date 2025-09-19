"""
Simple Flask web interface for testing the LLM wrapper.
"""

import os
import sys
from flask import Flask, render_template, request, jsonify, stream_template
from flask_cors import CORS

# Add the parent directory to the path so we can import llm_wrapper
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from llm_wrapper import LLMWrapper, Config

app = Flask(__name__)
CORS(app)

# Initialize the LLM wrapper
try:
    config = Config.from_env()
    llm = LLMWrapper(config=config)
except ValueError as e:
    print(f"Configuration error: {e}")
    llm = None

# Load nutritionist system prompt
def load_system_prompt():
    try:
        with open(os.path.join(os.path.dirname(__file__), 'nutritionist_system_prompt.txt'), 'r') as f:
            return f.read().strip()
    except FileNotFoundError:
        return "You are an AI nutritionist assistant. Help users with meal planning and food choices."


@app.route('/')
def index():
    """Main page with the chat interface."""
    return render_template('index.html')


@app.route('/api/chat', methods=['POST'])
def chat():
    """API endpoint for chat completion."""
    if not llm:
        return jsonify({'error': 'LLM wrapper not initialized. Check your API key.'}), 500
    
    try:
        data = request.get_json()
        message = data.get('message', '')
        model = data.get('model', 'claude-3-5-haiku-20241022')
        temperature = data.get('temperature', 0.7)
        max_tokens = data.get('max_tokens', 1000)
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        response = llm.generate(
            prompt=message,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        return jsonify({'response': response})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/chat/stream', methods=['POST'])
def chat_stream():
    """API endpoint for streaming chat completion."""
    if not llm:
        return jsonify({'error': 'LLM wrapper not initialized. Check your API key.'}), 500
    
    try:
        data = request.get_json()
        message = data.get('message', '')
        model = data.get('model', 'claude-3-5-haiku-20241022')
        temperature = data.get('temperature', 0.7)
        max_tokens = data.get('max_tokens', 1000)
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        def generate():
            try:
                for chunk in llm.generate_stream(
                    prompt=message,
                    model=model,
                    temperature=temperature,
                    max_tokens=max_tokens
                ):
                    yield f"data: {chunk}\n\n"
            except Exception as e:
                yield f"data: {{'error': '{str(e)}'}}\n\n"
        
        return app.response_class(
            generate(),
            mimetype='text/plain'
        )
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/models', methods=['GET'])
def get_models():
    """Get available models."""
    if not llm:
        return jsonify({'error': 'LLM wrapper not initialized'}), 500
    
    try:
        models = llm.get_available_models()
        return jsonify({'models': models})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/nutritionist/chat', methods=['POST'])
def nutritionist_chat():
    """API endpoint for nutritionist chat with meal plan context."""
    if not llm:
        return jsonify({'error': 'LLM wrapper not initialized. Check your API key.'}), 500
    
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        meal_plan_context = data.get('meal_plan_context', '')
        model = data.get('model', 'claude-3-5-haiku-20241022')
        temperature = data.get('temperature', 0.7)
        max_tokens = data.get('max_tokens', 1000)
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Construct the full prompt with system context
        system_prompt = load_system_prompt()
        full_prompt = f"{system_prompt}\n\n{meal_plan_context}\n\nUser request: {user_message}"
        
        response = llm.generate(
            prompt=full_prompt,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        return jsonify({'response': response})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/nutritionist/chat/stream', methods=['POST'])
def nutritionist_chat_stream():
    """API endpoint for streaming nutritionist chat with meal plan context."""
    if not llm:
        return jsonify({'error': 'LLM wrapper not initialized. Check your API key.'}), 500
    
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        meal_plan_context = data.get('meal_plan_context', '')
        model = data.get('model', 'claude-3-5-haiku-20241022')
        temperature = data.get('temperature', 0.7)
        max_tokens = data.get('max_tokens', 1000)
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Construct the full prompt with system context
        system_prompt = load_system_prompt()
        full_prompt = f"{system_prompt}\n\n{meal_plan_context}\n\nUser request: {user_message}"
        
        def generate():
            try:
                for chunk in llm.generate_stream(
                    prompt=full_prompt,
                    model=model,
                    temperature=temperature,
                    max_tokens=max_tokens
                ):
                    yield f"data: {chunk}\n\n"
            except Exception as e:
                yield f"data: {{'error': '{str(e)}'}}\n\n"
        
        return app.response_class(
            generate(),
            mimetype='text/plain'
        )
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
