"""
Data models for the nutritionist copilot application.
"""

from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime

@dataclass
class Food:
    """Food item model with nutritional information per 100g."""
    id: Optional[str] = None
    name: str = ""
    calories_per_100g: float = 0.0
    protein_per_100g: float = 0.0
    carbs_per_100g: float = 0.0
    fat_per_100g: float = 0.0
    fiber_per_100g: Optional[float] = None
    is_default: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

@dataclass
class MealFood:
    """Food item within a meal with specific quantity."""
    id: Optional[str] = None
    meal_id: str = ""
    food_id: str = ""
    quantity_grams: float = 0.0
    created_at: Optional[datetime] = None
    
    # Computed nutritional values for this specific quantity
    @property
    def calories(self) -> float:
        return (self.quantity_grams / 100.0) * self.food.calories_per_100g if self.food else 0.0
    
    @property
    def protein(self) -> float:
        return (self.quantity_grams / 100.0) * self.food.protein_per_100g if self.food else 0.0
    
    @property
    def carbs(self) -> float:
        return (self.quantity_grams / 100.0) * self.food.carbs_per_100g if self.food else 0.0
    
    @property
    def fat(self) -> float:
        return (self.quantity_grams / 100.0) * self.food.fat_per_100g if self.food else 0.0
    
    # Reference to the food object (populated when needed)
    food: Optional[Food] = None

@dataclass
class Meal:
    """Meal model containing multiple food items."""
    id: Optional[str] = None
    meal_plan_id: str = ""
    name: str = ""
    emoji: str = ""
    order_index: int = 0
    created_at: Optional[datetime] = None
    foods: List[MealFood] = None
    
    def __post_init__(self):
        if self.foods is None:
            self.foods = []
    
    @property
    def total_calories(self) -> float:
        return sum(food.calories for food in self.foods)
    
    @property
    def total_protein(self) -> float:
        return sum(food.protein for food in self.foods)
    
    @property
    def total_carbs(self) -> float:
        return sum(food.carbs for food in self.foods)
    
    @property
    def total_fat(self) -> float:
        return sum(food.fat for food in self.foods)

@dataclass
class MealPlan:
    """Meal plan model containing multiple meals."""
    id: Optional[str] = None
    name: str = "Today's Meal Plan"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    meals: List[Meal] = None
    
    def __post_init__(self):
        if self.meals is None:
            self.meals = []
    
    @property
    def total_calories(self) -> float:
        return sum(meal.total_calories for meal in self.meals)
    
    @property
    def total_protein(self) -> float:
        return sum(meal.total_protein for meal in self.meals)
    
    @property
    def total_carbs(self) -> float:
        return sum(meal.total_carbs for meal in self.meals)
    
    @property
    def total_fat(self) -> float:
        return sum(meal.total_fat for meal in self.meals)
