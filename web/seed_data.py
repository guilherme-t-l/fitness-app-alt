"""
Seed data script to populate the database with default foods and meal plan.
"""

from database_service import DatabaseService, DatabaseError
from models import Food, MealPlan, Meal, MealFood

def seed_default_foods() -> list:
    """Create the default food items from the hardcoded data."""
    return [
        # Breakfast foods
        Food(name="Greek Yogurt", calories_per_100g=65, protein_per_100g=10, carbs_per_100g=3, fat_per_100g=0, is_default=True),
        Food(name="Mixed Berries", calories_per_100g=42, protein_per_100g=1, carbs_per_100g=10, fat_per_100g=0, is_default=True),
        Food(name="Granola", calories_per_100g=440, protein_per_100g=12, carbs_per_100g=48, fat_per_100g=24, is_default=True),
        Food(name="Honey", calories_per_100g=304, protein_per_100g=0, carbs_per_100g=80, fat_per_100g=0, is_default=True),
        
        # Lunch foods
        Food(name="Grilled Chicken Breast", calories_per_100g=165, protein_per_100g=31, carbs_per_100g=0, fat_per_100g=3.6, is_default=True),
        Food(name="Quinoa", calories_per_100g=120, protein_per_100g=4, carbs_per_100g=22, fat_per_100g=2, is_default=True),
        Food(name="Mixed Vegetables", calories_per_100g=30, protein_per_100g=1.3, carbs_per_100g=6.7, fat_per_100g=0, is_default=True),
        Food(name="Olive Oil", calories_per_100g=884, protein_per_100g=0, carbs_per_100g=0, fat_per_100g=100, is_default=True),
        
        # Snack foods
        Food(name="Almonds", calories_per_100g=579, protein_per_100g=21, carbs_per_100g=22, fat_per_100g=50, is_default=True),
        Food(name="Apple", calories_per_100g=52, protein_per_100g=0.3, carbs_per_100g=14, fat_per_100g=0.2, is_default=True),
        
        # Dinner foods
        Food(name="Salmon Fillet", calories_per_100g=206, protein_per_100g=22, carbs_per_100g=0, fat_per_100g=12, is_default=True),
        Food(name="Sweet Potato", calories_per_100g=86, protein_per_100g=2, carbs_per_100g=20, fat_per_100g=0, is_default=True),
        Food(name="Broccoli", calories_per_100g=34, protein_per_100g=2.8, carbs_per_100g=7, fat_per_100g=0.4, is_default=True),
        Food(name="Avocado", calories_per_100g=160, protein_per_100g=2, carbs_per_100g=9, fat_per_100g=15, is_default=True),
    ]

def create_default_meal_plan(db_service: DatabaseService) -> str:
    """Create the default meal plan with the current hardcoded structure."""
    try:
        # Create meal plan
        meal_plan = db_service.create_meal_plan("Today's Meal Plan")
        
        # Get all foods for reference
        foods = db_service.get_all_foods()
        food_map = {food.name: food for food in foods}
        
        # Create meals with their foods
        meals_data = [
            {
                "name": "Breakfast",
                "emoji": "🍳",
                "foods": [
                    ("Greek Yogurt", 200),  # 200g
                    ("Mixed Berries", 100),  # 100g
                    ("Granola", 50),  # 50g
                    ("Honey", 15),  # 15g
                ]
            },
            {
                "name": "Lunch",
                "emoji": "🥗",
                "foods": [
                    ("Grilled Chicken Breast", 150),  # 150g
                    ("Quinoa", 100),  # 100g cooked
                    ("Mixed Vegetables", 150),  # 150g
                    ("Olive Oil", 10),  # 10ml = 10g
                ]
            },
            {
                "name": "Snack",
                "emoji": "🥜",
                "foods": [
                    ("Almonds", 25),  # 25g
                    ("Apple", 150),  # 1 medium apple
                ]
            },
            {
                "name": "Dinner",
                "emoji": "🍽️",
                "foods": [
                    ("Salmon Fillet", 120),  # 120g
                    ("Sweet Potato", 200),  # 200g
                    ("Broccoli", 150),  # 150g
                    ("Avocado", 50),  # 50g
                ]
            }
        ]
        
        for meal_data in meals_data:
            # Create meal
            meal = db_service.add_meal_to_plan(meal_plan.id, meal_data["name"], meal_data["emoji"])
            
            # Add foods to meal
            for food_name, quantity_grams in meal_data["foods"]:
                if food_name in food_map:
                    db_service.add_food_to_meal(meal.id, food_map[food_name].id, quantity_grams)
                else:
                    print(f"Warning: Food '{food_name}' not found in database")
        
        return meal_plan.id
        
    except Exception as e:
        raise DatabaseError(f"Failed to create default meal plan: {str(e)}")

def seed_database():
    """Main function to seed the database with default data."""
    try:
        db_service = DatabaseService()
        
        print("🌱 Starting database seeding...")
        
        # Check if foods already exist
        existing_foods = db_service.get_all_foods()
        if existing_foods:
            print(f"⚠️  Found {len(existing_foods)} existing foods in database. Skipping food seeding.")
        else:
            print("📦 Seeding default foods...")
            default_foods = seed_default_foods()
            
            for food in default_foods:
                try:
                    db_service.create_food(food)
                    print(f"✅ Created food: {food.name}")
                except Exception as e:
                    print(f"❌ Failed to create food '{food.name}': {str(e)}")
        
        # Check if default meal plan already exists
        try:
            # Try to get a meal plan (assuming there's only one for now)
            # This is a simplified check - in production you'd want a more robust approach
            print("🍽️  Checking for existing meal plans...")
            # For now, we'll always create a new meal plan
            # In the future, you might want to check if one exists first
        except:
            pass
        
        print("🍽️  Creating default meal plan...")
        meal_plan_id = create_default_meal_plan(db_service)
        print(f"✅ Created default meal plan with ID: {meal_plan_id}")
        
        print("🎉 Database seeding completed successfully!")
        return meal_plan_id
        
    except Exception as e:
        print(f"❌ Database seeding failed: {str(e)}")
        raise

if __name__ == "__main__":
    seed_database()
