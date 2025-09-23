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

# Add the parent directory to the path so we can import llm_wrapper
# This allows us to import the custom LLM wrapper module from the parent directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from llm_wrapper import LLMWrapper, Config
from database_service import DatabaseService, DatabaseError, FoodNotFoundError, MealPlanNotFoundError, MealNotFoundError, ValidationError

# Initialize Flask application with CORS support
app = Flask(__name__, static_folder='static', static_url_path='/static')
CORS(app)  # Enable Cross-Origin Resource Sharing for frontend integration

# Initialize the LLM wrapper with configuration from environment variables
# The LLM wrapper abstracts different AI providers (OpenAI, Anthropic) behind a unified interface
try:
    config = Config.from_env()  # Load API keys and settings from environment
    llm = LLMWrapper(config=config)
except ValueError as e:
    print(f"Configuration error: {e}")
    llm = None  # Set to None if configuration fails (e.g., missing API keys)

# Initialize database service
try:
    db_service = DatabaseService()
except Exception as e:
    print(f"Database initialization error: {e}")
    db_service = None

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


# Food API endpoints
@app.route('/api/foods', methods=['GET'])
def get_foods():
    """Get all food items."""
    if not db_service:
        return jsonify({'error': 'Database service not initialized'}), 500
    
    try:
        foods = db_service.get_all_foods()
        return jsonify({
            'foods': [
                {
                    'id': food.id,
                    'name': food.name,
                    'calories_per_100g': food.calories_per_100g,
                    'protein_per_100g': food.protein_per_100g,
                    'carbs_per_100g': food.carbs_per_100g,
                    'fat_per_100g': food.fat_per_100g,
                    'fiber_per_100g': food.fiber_per_100g,
                    'is_default': food.is_default
                }
                for food in foods
            ]
        })
    except DatabaseError as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500


@app.route('/api/foods/<food_id>', methods=['GET'])
def get_food(food_id):
    """Get a specific food item by ID."""
    if not db_service:
        return jsonify({'error': 'Database service not initialized'}), 500
    
    try:
        food = db_service.get_food_by_id(food_id)
        return jsonify({
            'food': {
                'id': food.id,
                'name': food.name,
                'calories_per_100g': food.calories_per_100g,
                'protein_per_100g': food.protein_per_100g,
                'carbs_per_100g': food.carbs_per_100g,
                'fat_per_100g': food.fat_per_100g,
                'fiber_per_100g': food.fiber_per_100g,
                'is_default': food.is_default
            }
        })
    except FoodNotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except DatabaseError as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500


@app.route('/api/foods/<food_id>', methods=['PUT'])
def update_food(food_id):
    """Update food nutritional data in database."""
    if not db_service:
        return jsonify({'error': 'Database service not initialized'}), 500
    
    try:
        data = request.get_json()
        print(f"Update food request for ID {food_id}: {data}")
        
        calories_per_100g = data.get('calories_per_100g')
        protein_per_100g = data.get('protein_per_100g')
        carbs_per_100g = data.get('carbs_per_100g')
        fat_per_100g = data.get('fat_per_100g')
        fiber_per_100g = data.get('fiber_per_100g')
        
        print(f"Parsed values: calories={calories_per_100g}, protein={protein_per_100g}, carbs={carbs_per_100g}, fat={fat_per_100g}")
        
        if not all([calories_per_100g is not None, protein_per_100g is not None, 
                   carbs_per_100g is not None, fat_per_100g is not None]):
            print("Validation failed: missing required values")
            return jsonify({'error': 'All nutritional values are required'}), 400
        
        food = db_service.update_food(food_id, calories_per_100g, protein_per_100g, 
                                    carbs_per_100g, fat_per_100g, fiber_per_100g)
        
        return jsonify({
            'food': {
                'id': food.id,
                'name': food.name,
                'calories_per_100g': food.calories_per_100g,
                'protein_per_100g': food.protein_per_100g,
                'carbs_per_100g': food.carbs_per_100g,
                'fat_per_100g': food.fat_per_100g,
                'fiber_per_100g': food.fiber_per_100g,
                'is_default': food.is_default
            }
        })
    except FoodNotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except DatabaseError as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500


# Meal Plan API endpoints
@app.route('/api/meal-plans/<meal_plan_id>', methods=['GET'])
def get_meal_plan(meal_plan_id):
    """Get a meal plan with all its meals and foods."""
    if not db_service:
        return jsonify({'error': 'Database service not initialized'}), 500
    
    try:
        meal_plan = db_service.get_meal_plan_by_id(meal_plan_id)
        return jsonify({
            'meal_plan': {
                'id': meal_plan.id,
                'name': meal_plan.name,
                'total_calories': meal_plan.total_calories,
                'total_protein': meal_plan.total_protein,
                'total_carbs': meal_plan.total_carbs,
                'total_fat': meal_plan.total_fat,
                'meals': [
                    {
                        'id': meal.id,
                        'name': meal.name,
                        'emoji': meal.emoji,
                        'order_index': meal.order_index,
                        'total_calories': meal.total_calories,
                        'total_protein': meal.total_protein,
                        'total_carbs': meal.total_carbs,
                        'total_fat': meal.total_fat,
                        'foods': [
                            {
                                'id': meal_food.id,
                                'food_id': meal_food.food_id,
                                'food_name': meal_food.food.name if meal_food.food else 'Unknown',
                                'quantity_grams': meal_food.quantity_grams,
                                'calories': meal_food.calories,
                                'protein': meal_food.protein,
                                'carbs': meal_food.carbs,
                                'fat': meal_food.fat
                            }
                            for meal_food in meal.foods
                        ]
                    }
                    for meal in meal_plan.meals
                ]
            }
        })
    except MealPlanNotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except DatabaseError as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500


@app.route('/api/meal-plans', methods=['POST'])
def create_meal_plan():
    """Create a new meal plan."""
    if not db_service:
        return jsonify({'error': 'Database service not initialized'}), 500
    
    try:
        data = request.get_json()
        name = data.get('name', 'Today\'s Meal Plan')
        
        meal_plan = db_service.create_meal_plan(name)
        return jsonify({
            'meal_plan': {
                'id': meal_plan.id,
                'name': meal_plan.name,
                'total_calories': meal_plan.total_calories,
                'total_protein': meal_plan.total_protein,
                'total_carbs': meal_plan.total_carbs,
                'total_fat': meal_plan.total_fat,
                'meals': []
            }
        }), 201
    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except DatabaseError as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500


# Meal API endpoints
@app.route('/api/meals', methods=['POST'])
def add_meal():
    """Add a new meal to a meal plan."""
    if not db_service:
        return jsonify({'error': 'Database service not initialized'}), 500
    
    try:
        data = request.get_json()
        meal_plan_id = data.get('meal_plan_id')
        name = data.get('name')
        emoji = data.get('emoji', '🍽️')
        
        if not meal_plan_id or not name:
            return jsonify({'error': 'meal_plan_id and name are required'}), 400
        
        meal = db_service.add_meal_to_plan(meal_plan_id, name, emoji)
        return jsonify({
            'meal': {
                'id': meal.id,
                'meal_plan_id': meal.meal_plan_id,
                'name': meal.name,
                'emoji': meal.emoji,
                'order_index': meal.order_index,
                'total_calories': meal.total_calories,
                'total_protein': meal.total_protein,
                'total_carbs': meal.total_carbs,
                'total_fat': meal.total_fat,
                'foods': []
            }
        }), 201
    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except DatabaseError as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500


@app.route('/api/meals/<meal_id>', methods=['DELETE'])
def delete_meal(meal_id):
    """Delete a meal and all its foods."""
    if not db_service:
        return jsonify({'error': 'Database service not initialized'}), 500
    
    try:
        db_service.delete_meal(meal_id)
        return jsonify({'message': 'Meal deleted successfully'}), 200
    except MealNotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except DatabaseError as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500


# Meal Food API endpoints
@app.route('/api/meal-foods', methods=['POST'])
def add_food_to_meal():
    """Add a food item to a meal - with or without database food."""
    if not db_service:
        return jsonify({'error': 'Database service not initialized'}), 500
    
    try:
        data = request.get_json()
        meal_id = data.get('meal_id')
        quantity_grams = data.get('quantity_grams')
        
        if not all([meal_id, quantity_grams is not None]):
            return jsonify({'error': 'meal_id and quantity_grams are required'}), 400
        
        # Option 1: Use existing database food
        if data.get('food_id'):
            meal_food = db_service.add_food_to_meal(meal_id, data['food_id'], quantity_grams)
            return jsonify({
                'meal_food': {
                    'id': meal_food.id,
                    'meal_id': meal_food.meal_id,
                    'food_id': meal_food.food_id,
                    'food_name': meal_food.food.name if meal_food.food else 'Unknown',
                    'quantity_grams': meal_food.quantity_grams,
                    'calories': meal_food.calories,
                    'protein': meal_food.protein,
                    'carbs': meal_food.carbs,
                    'fat': meal_food.fat
                }
            }), 201
        
        # Option 2: Add food directly with nutritional data (auto-save to database)
        else:
            food_name = data.get('food_name')
            calories_per_100g = data.get('calories_per_100g', 0)
            protein_per_100g = data.get('protein_per_100g', 0)
            carbs_per_100g = data.get('carbs_per_100g', 0)
            fat_per_100g = data.get('fat_per_100g', 0)
            fiber_per_100g = data.get('fiber_per_100g')
            
            if not food_name:
                return jsonify({'error': 'food_name is required for direct food addition'}), 400
            
            meal_food = db_service.add_direct_food_to_meal(
                meal_id, food_name, quantity_grams,
                calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g
            )
            return jsonify({
                'meal_food': {
                    'id': meal_food.id,
                    'meal_id': meal_food.meal_id,
                    'food_id': meal_food.food_id,
                    'food_name': meal_food.food_name,
                    'quantity_grams': meal_food.quantity_grams,
                    'calories': meal_food.calories,
                    'protein': meal_food.protein,
                    'carbs': meal_food.carbs,
                    'fat': meal_food.fat
                }
            }), 201
            
    except (FoodNotFoundError, ValidationError) as e:
        return jsonify({'error': str(e)}), 400
    except DatabaseError as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500


@app.route('/api/meal-foods/<meal_food_id>', methods=['PUT'])
def update_food_quantity(meal_food_id):
    """Update the quantity of a food item in a meal."""
    if not db_service:
        return jsonify({'error': 'Database service not initialized'}), 500
    
    try:
        data = request.get_json()
        quantity_grams = data.get('quantity_grams')
        
        if quantity_grams is None:
            return jsonify({'error': 'quantity_grams is required'}), 400
        
        meal_food = db_service.update_food_quantity(meal_food_id, quantity_grams)
        return jsonify({
            'meal_food': {
                'id': meal_food.id,
                'meal_id': meal_food.meal_id,
                'food_id': meal_food.food_id,
                'food_name': meal_food.food.name if meal_food.food else 'Unknown',
                'quantity_grams': meal_food.quantity_grams,
                'calories': meal_food.calories,
                'protein': meal_food.protein,
                'carbs': meal_food.carbs,
                'fat': meal_food.fat
            }
        })
    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except DatabaseError as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500


@app.route('/api/meal-foods/<meal_food_id>', methods=['DELETE'])
def remove_food_from_meal(meal_food_id):
    """Remove a food item from a meal."""
    if not db_service:
        return jsonify({'error': 'Database service not initialized'}), 500
    
    try:
        db_service.remove_food_from_meal(meal_food_id)
        return jsonify({'message': 'Food removed from meal successfully'}), 200
    except DatabaseError as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500


@app.route('/api/ai/generate-macros', methods=['POST'])
def generate_macros():
    """
    Generate nutritional data for a food using AI.
    
    Request JSON:
        - food_name (str): Name of the food to generate macros for
    
    Returns:
        JSON: {
            'calories_per_100g': float,
            'protein_per_100g': float,
            'carbs_per_100g': float,
            'fat_per_100g': float
        }
    """
    if not llm:
        return jsonify({'error': 'LLM wrapper not initialized. Check your API key.'}), 500
    
    try:
        data = request.get_json()
        food_name = data.get('food_name', '').strip()
        
        if not food_name:
            return jsonify({'error': 'food_name is required'}), 400
        
        # Create AI prompt for nutritional data generation
        prompt = f"""You are a nutritionist AI. Given a food name, provide accurate nutritional information per 100g.

Food: {food_name}

Respond in this exact JSON format (no other text):
{{
    "calories_per_100g": number,
    "protein_per_100g": number,
    "carbs_per_100g": number,
    "fat_per_100g": number
}}

Provide realistic, accurate nutritional data based on standard food databases."""
        
        # Generate AI response
        raw_response = llm.generate(
            prompt=prompt,
            model='claude-3-5-haiku-20241022',
            temperature=0.3,  # Lower temperature for more consistent data
            max_tokens=200
        )
        
        # Parse JSON response
        import json
        try:
            nutritional_data = json.loads(raw_response.strip())
            
            # Validate the response has required fields
            required_fields = ['calories_per_100g', 'protein_per_100g', 'carbs_per_100g', 'fat_per_100g']
            if not all(field in nutritional_data for field in required_fields):
                raise ValueError("Missing required nutritional fields")
            
            # Validate numeric values
            for field in required_fields:
                if not isinstance(nutritional_data[field], (int, float)) or nutritional_data[field] < 0:
                    raise ValueError(f"Invalid value for {field}")
            
            return jsonify(nutritional_data)
            
        except (json.JSONDecodeError, ValueError) as e:
            # Fallback to default values if AI response is invalid
            return jsonify({
                'calories_per_100g': 100.0,
                'protein_per_100g': 5.0,
                'carbs_per_100g': 10.0,
                'fat_per_100g': 3.0
            })
    
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
