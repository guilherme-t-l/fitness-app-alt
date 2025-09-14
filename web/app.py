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


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
