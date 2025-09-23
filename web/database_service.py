"""
Database service layer with detailed error handling for Supabase operations.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
from supabase import Client
from database import get_supabase_client
from models import Food, Meal, MealPlan, MealFood

class DatabaseError(Exception):
    """Base exception for database operations."""
    pass

class FoodNotFoundError(DatabaseError):
    """Raised when a food item is not found."""
    pass

class MealPlanNotFoundError(DatabaseError):
    """Raised when a meal plan is not found."""
    pass

class MealNotFoundError(DatabaseError):
    """Raised when a meal is not found."""
    pass

class ValidationError(DatabaseError):
    """Raised when data validation fails."""
    pass

class DatabaseService:
    """Service class for database operations with detailed error handling."""
    
    def __init__(self):
        self.supabase: Client = get_supabase_client()
    
    def _parse_datetime(self, dt_string):
        """Parse datetime string from Supabase, handling timezone issues."""
        # For now, just return None to avoid datetime parsing issues
        # We can add proper datetime handling later if needed
        return None
    
    def _handle_supabase_error(self, error: Exception, operation: str) -> None:
        """Convert Supabase errors to detailed user-friendly errors."""
        error_msg = str(error).lower()
        
        if "connection" in error_msg or "network" in error_msg:
            raise DatabaseError(
                f"Database connection failed during {operation}. "
                "Please check your internet connection and try again."
            )
        elif "not found" in error_msg or "does not exist" in error_msg:
            if "food" in operation.lower():
                raise FoodNotFoundError(f"Food item not found during {operation}.")
            elif "meal_plan" in operation.lower():
                raise MealPlanNotFoundError(f"Meal plan not found during {operation}.")
            elif "meal" in operation.lower():
                raise MealNotFoundError(f"Meal not found during {operation}.")
        elif "validation" in error_msg or "constraint" in error_msg:
            raise ValidationError(f"Data validation failed during {operation}. Please check your input.")
        else:
            raise DatabaseError(
                f"Database operation failed during {operation}. "
                f"Error: {str(error)}. Please try again or contact support if the problem persists."
            )
    
    # Food operations
    def get_all_foods(self) -> List[Food]:
        """Get all food items from the database."""
        try:
            response = self.supabase.table("foods").select("*").order("name").execute()
            
            if not response.data:
                return []
            
            return [
                Food(
                    id=item["id"],
                    name=item["name"],
                    calories_per_100g=item["calories_per_100g"],
                    protein_per_100g=item["protein_per_100g"],
                    carbs_per_100g=item["carbs_per_100g"],
                    fat_per_100g=item["fat_per_100g"],
                    fiber_per_100g=item.get("fiber_per_100g"),
                    is_default=item["is_default"],
                    created_at=self._parse_datetime(item["created_at"]),
                    updated_at=self._parse_datetime(item["updated_at"])
                )
                for item in response.data
            ]
        except Exception as e:
            self._handle_supabase_error(e, "get_all_foods")
    
    def get_food_by_id(self, food_id: str) -> Food:
        """Get a specific food item by ID."""
        try:
            response = self.supabase.table("foods").select("*").eq("id", food_id).execute()
            
            if not response.data:
                raise FoodNotFoundError(f"Food with ID {food_id} not found.")
            
            item = response.data[0]
            return Food(
                id=item["id"],
                name=item["name"],
                calories_per_100g=item["calories_per_100g"],
                protein_per_100g=item["protein_per_100g"],
                carbs_per_100g=item["carbs_per_100g"],
                fat_per_100g=item["fat_per_100g"],
                fiber_per_100g=item.get("fiber_per_100g"),
                is_default=item["is_default"],
                created_at=self._parse_datetime(item["created_at"]),
                updated_at=self._parse_datetime(item["updated_at"])
            )
        except FoodNotFoundError:
            raise
        except Exception as e:
            self._handle_supabase_error(e, f"get_food_by_id({food_id})")
    
    def create_food(self, food: Food) -> Food:
        """Create a new food item."""
        try:
            food_data = {
                "name": food.name,
                "calories_per_100g": food.calories_per_100g,
                "protein_per_100g": food.protein_per_100g,
                "carbs_per_100g": food.carbs_per_100g,
                "fat_per_100g": food.fat_per_100g,
                "fiber_per_100g": food.fiber_per_100g,
                "is_default": food.is_default
            }
            
            response = self.supabase.table("foods").insert(food_data).execute()
            
            if not response.data:
                raise DatabaseError("Failed to create food item. No data returned.")
            
            created_item = response.data[0]
            return Food(
                id=created_item["id"],
                name=created_item["name"],
                calories_per_100g=created_item["calories_per_100g"],
                protein_per_100g=created_item["protein_per_100g"],
                carbs_per_100g=created_item["carbs_per_100g"],
                fat_per_100g=created_item["fat_per_100g"],
                fiber_per_100g=created_item.get("fiber_per_100g"),
                is_default=created_item["is_default"],
                created_at=self._parse_datetime(created_item["created_at"]),
                updated_at=self._parse_datetime(created_item["updated_at"])
            )
        except Exception as e:
            self._handle_supabase_error(e, f"create_food({food.name})")
    
    # Meal Plan operations
    def get_meal_plan_by_id(self, meal_plan_id: str) -> MealPlan:
        """Get a meal plan with all its meals and foods."""
        try:
            # Get meal plan
            meal_plan_response = self.supabase.table("meal_plans").select("*").eq("id", meal_plan_id).execute()
            
            if not meal_plan_response.data:
                raise MealPlanNotFoundError(f"Meal plan with ID {meal_plan_id} not found.")
            
            meal_plan_data = meal_plan_response.data[0]
            
            # Get meals for this meal plan
            meals_response = self.supabase.table("meals").select("*").eq("meal_plan_id", meal_plan_id).order("order_index").execute()
            
            meals = []
            for meal_data in meals_response.data:
                # Get foods for this meal
                meal_foods_response = self.supabase.table("meal_foods").select("*, foods(*)").eq("meal_id", meal_data["id"]).execute()
                
                meal_foods = []
                for meal_food_data in meal_foods_response.data:
                    food_data = meal_food_data["foods"]
                    food = Food(
                        id=food_data["id"],
                        name=food_data["name"],
                        calories_per_100g=food_data["calories_per_100g"],
                        protein_per_100g=food_data["protein_per_100g"],
                        carbs_per_100g=food_data["carbs_per_100g"],
                        fat_per_100g=food_data["fat_per_100g"],
                        fiber_per_100g=food_data.get("fiber_per_100g"),
                        is_default=food_data["is_default"]
                    )
                    
                    meal_food = MealFood(
                        id=meal_food_data["id"],
                        meal_id=meal_food_data["meal_id"],
                        food_id=meal_food_data["food_id"],
                        quantity_grams=meal_food_data["quantity_grams"],
                        food=food
                    )
                    meal_foods.append(meal_food)
                
                meal = Meal(
                    id=meal_data["id"],
                    meal_plan_id=meal_data["meal_plan_id"],
                    name=meal_data["name"],
                    emoji=meal_data["emoji"],
                    order_index=meal_data["order_index"],
                    foods=meal_foods
                )
                meals.append(meal)
            
            return MealPlan(
                id=meal_plan_data["id"],
                name=meal_plan_data["name"],
                created_at=self._parse_datetime(meal_plan_data["created_at"]),
                updated_at=self._parse_datetime(meal_plan_data["updated_at"]),
                meals=meals
            )
        except (MealPlanNotFoundError, FoodNotFoundError, MealNotFoundError):
            raise
        except Exception as e:
            self._handle_supabase_error(e, f"get_meal_plan_by_id({meal_plan_id})")
    
    def create_meal_plan(self, name: str = "Today's Meal Plan") -> MealPlan:
        """Create a new meal plan."""
        try:
            meal_plan_data = {
                "name": name
            }
            
            response = self.supabase.table("meal_plans").insert(meal_plan_data).execute()
            
            if not response.data:
                raise DatabaseError("Failed to create meal plan. No data returned.")
            
            created_item = response.data[0]
            return MealPlan(
                id=created_item["id"],
                name=created_item["name"],
                created_at=self._parse_datetime(created_item["created_at"]),
                updated_at=self._parse_datetime(created_item["updated_at"]),
                meals=[]
            )
        except Exception as e:
            self._handle_supabase_error(e, f"create_meal_plan({name})")
    
    def add_meal_to_plan(self, meal_plan_id: str, name: str, emoji: str = "🍽️") -> Meal:
        """Add a new meal to a meal plan."""
        try:
            # Get current max order_index for this meal plan
            meals_response = self.supabase.table("meals").select("order_index").eq("meal_plan_id", meal_plan_id).order("order_index", desc=True).limit(1).execute()
            
            next_order = 0
            if meals_response.data:
                next_order = meals_response.data[0]["order_index"] + 1
            
            meal_data = {
                "meal_plan_id": meal_plan_id,
                "name": name,
                "emoji": emoji,
                "order_index": next_order
            }
            
            response = self.supabase.table("meals").insert(meal_data).execute()
            
            if not response.data:
                raise DatabaseError("Failed to create meal. No data returned.")
            
            created_item = response.data[0]
            return Meal(
                id=created_item["id"],
                meal_plan_id=created_item["meal_plan_id"],
                name=created_item["name"],
                emoji=created_item["emoji"],
                order_index=created_item["order_index"],
                foods=[]
            )
        except Exception as e:
            self._handle_supabase_error(e, f"add_meal_to_plan({meal_plan_id}, {name})")
    
    def delete_meal(self, meal_id: str) -> None:
        """Delete a meal and all its foods."""
        try:
            # First delete all meal_foods for this meal
            self.supabase.table("meal_foods").delete().eq("meal_id", meal_id).execute()
            
            # Then delete the meal
            response = self.supabase.table("meals").delete().eq("id", meal_id).execute()
            
            if not response.data:
                raise MealNotFoundError(f"Meal with ID {meal_id} not found or already deleted.")
        except MealNotFoundError:
            raise
        except Exception as e:
            self._handle_supabase_error(e, f"delete_meal({meal_id})")
    
    def add_food_to_meal(self, meal_id: str, food_id: str, quantity_grams: float) -> MealFood:
        """Add a food item to a meal."""
        try:
            # Verify food exists
            food = self.get_food_by_id(food_id)
            
            meal_food_data = {
                "meal_id": meal_id,
                "food_id": food_id,
                "quantity_grams": quantity_grams
            }
            
            response = self.supabase.table("meal_foods").insert(meal_food_data).execute()
            
            if not response.data:
                raise DatabaseError("Failed to add food to meal. No data returned.")
            
            created_item = response.data[0]
            return MealFood(
                id=created_item["id"],
                meal_id=created_item["meal_id"],
                food_id=created_item["food_id"],
                quantity_grams=created_item["quantity_grams"],
                food=food
            )
        except (FoodNotFoundError, DatabaseError):
            raise
        except Exception as e:
            self._handle_supabase_error(e, f"add_food_to_meal({meal_id}, {food_id})")
    
    def remove_food_from_meal(self, meal_food_id: str) -> None:
        """Remove a food item from a meal."""
        try:
            response = self.supabase.table("meal_foods").delete().eq("id", meal_food_id).execute()
            
            if not response.data:
                raise DatabaseError(f"Meal food with ID {meal_food_id} not found or already deleted.")
        except Exception as e:
            self._handle_supabase_error(e, f"remove_food_from_meal({meal_food_id})")
    
    def update_food_quantity(self, meal_food_id: str, quantity_grams: float) -> MealFood:
        """Update the quantity of a food item in a meal."""
        try:
            # Get current meal_food data
            current_response = self.supabase.table("meal_foods").select("*, foods(*)").eq("id", meal_food_id).execute()
            
            if not current_response.data:
                raise DatabaseError(f"Meal food with ID {meal_food_id} not found.")
            
            current_data = current_response.data[0]
            food_data = current_data["foods"]
            food = Food(
                id=food_data["id"],
                name=food_data["name"],
                calories_per_100g=food_data["calories_per_100g"],
                protein_per_100g=food_data["protein_per_100g"],
                carbs_per_100g=food_data["carbs_per_100g"],
                fat_per_100g=food_data["fat_per_100g"],
                fiber_per_100g=food_data.get("fiber_per_100g"),
                is_default=food_data["is_default"]
            )
            
            # Update quantity
            response = self.supabase.table("meal_foods").update({"quantity_grams": quantity_grams}).eq("id", meal_food_id).execute()
            
            if not response.data:
                raise DatabaseError("Failed to update food quantity. No data returned.")
            
            updated_item = response.data[0]
            return MealFood(
                id=updated_item["id"],
                meal_id=updated_item["meal_id"],
                food_id=updated_item["food_id"],
                quantity_grams=updated_item["quantity_grams"],
                food=food
            )
        except Exception as e:
            self._handle_supabase_error(e, f"update_food_quantity({meal_food_id})")
