#!/usr/bin/env python3
"""
Simple test script to check Supabase connection
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("🔍 Checking environment variables...")
print(f"SUPABASE_URL: {'✅ Set' if os.getenv('SUPABASE_URL') else '❌ Missing'}")
print(f"SUPABASE_ANON_KEY: {'✅ Set' if os.getenv('SUPABASE_ANON_KEY') else '❌ Missing'}")

if os.getenv('SUPABASE_URL'):
    print(f"URL: {os.getenv('SUPABASE_URL')[:50]}...")

if os.getenv('SUPABASE_ANON_KEY'):
    print(f"Key: {os.getenv('SUPABASE_ANON_KEY')[:20]}...")

print("\n🔌 Testing Supabase connection...")

try:
    from supabase import create_client
    
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_ANON_KEY')
    
    if not url or not key:
        print("❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY")
        exit(1)
    
    client = create_client(url, key)
    
    # Try a simple query
    response = client.table('foods').select('*').limit(1).execute()
    print("✅ Connection successful!")
    print(f"Response: {response}")
    
except Exception as e:
    print(f"❌ Connection failed: {e}")
    print("\nTroubleshooting:")
    print("1. Check your .env file has SUPABASE_URL and SUPABASE_ANON_KEY")
    print("2. Verify the values are correct from your Supabase dashboard")
    print("3. Make sure you've run the schema.sql in Supabase SQL editor")
