#!/usr/bin/env python3
"""
Database setup script for the nutritionist copilot application.
This script will create the database schema and seed it with default data.
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import modules directly
from database_service import DatabaseService, DatabaseError
from seed_data import seed_database

def check_environment():
    """Check if required environment variables are set."""
    required_vars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease set these variables in your .env file or environment.")
        print("You can find these values in your Supabase project settings.")
        return False
    
    return True

def test_database_connection():
    """Test the database connection."""
    try:
        print("🔌 Testing database connection...")
        db_service = DatabaseService()
        
        # Try to get foods (this will fail if tables don't exist, which is expected)
        try:
            foods = db_service.get_all_foods()
            print(f"✅ Database connection successful. Found {len(foods)} existing foods.")
            return True
        except Exception as e:
            if "relation" in str(e).lower() or "does not exist" in str(e).lower():
                print("⚠️  Database tables don't exist yet. This is expected for first-time setup.")
                return True
            else:
                raise e
                
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        print("\nPlease check your Supabase configuration:")
        print("1. Make sure SUPABASE_URL and SUPABASE_ANON_KEY are correct")
        print("2. Make sure your Supabase project is running")
        print("3. Make sure you've run the schema.sql in your Supabase SQL editor")
        return False

def main():
    """Main setup function."""
    print("🚀 Nutritionist Copilot Database Setup")
    print("=" * 50)
    
    # Check environment variables
    if not check_environment():
        sys.exit(1)
    
    # Test database connection
    if not test_database_connection():
        sys.exit(1)
    
    # Seed the database
    try:
        print("\n🌱 Seeding database with default data...")
        meal_plan_id = seed_database()
        print(f"\n🎉 Setup completed successfully!")
        print(f"📋 Default meal plan ID: {meal_plan_id}")
        print("\nYou can now start the Flask application with:")
        print("   python web/app.py")
        
    except Exception as e:
        print(f"\n❌ Setup failed: {str(e)}")
        print("\nTroubleshooting:")
        print("1. Make sure you've run the schema.sql in your Supabase SQL editor")
        print("2. Check that your Supabase project is accessible")
        print("3. Verify your API keys are correct")
        sys.exit(1)

if __name__ == "__main__":
    main()
