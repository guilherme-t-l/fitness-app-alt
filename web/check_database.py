#!/usr/bin/env python3
"""
Database check script for the nutritionist copilot application.
This script checks if the database already has data and is ready to use.
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
        return False
    
    return True

def check_database_status():
    """Check if the database has data and is ready to use."""
    try:
        db_service = DatabaseService()
        
        # Try to get foods to check if database has data
        foods = db_service.get_all_foods()
        
        if foods and len(foods) > 0:
            print(f"✅ Database has {len(foods)} foods and is ready to use")
            return True
        else:
            print("⚠️  Database is empty - needs seeding")
            return False
            
    except Exception as e:
        if "relation" in str(e).lower() or "does not exist" in str(e).lower():
            print("⚠️  Database tables don't exist - needs setup")
            return False
        else:
            print(f"❌ Database check failed: {str(e)}")
            return False

def main():
    """Main check function."""
    # Check environment variables
    if not check_environment():
        sys.exit(1)
    
    # Check database status
    if check_database_status():
        sys.exit(0)  # Database is ready
    else:
        sys.exit(1)  # Database needs setup

if __name__ == "__main__":
    main()
