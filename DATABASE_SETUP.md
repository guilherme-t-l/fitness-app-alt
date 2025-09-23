# Database Setup Guide

This guide will help you set up the Supabase database for the Nutritionist Copilot application.

## Prerequisites

1. A Supabase account and project
2. Python environment with required packages installed

## Step 1: Get Supabase Credentials

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/evvatudtfojbmpgfwmrp
2. Navigate to Settings > API
3. Copy the following values:
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_ANON_KEY)

## Step 2: Set Environment Variables

Create a `.env` file in the project root with the following content:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# LLM API Keys (existing)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

## Step 3: Create Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the contents of `web/schema.sql`
3. Paste and run the SQL script
4. This will create all necessary tables and indexes

## Step 4: Install Dependencies

```bash
pip install -r requirements.txt
```

## Step 5: Seed the Database

Run the setup script to populate the database with default foods and meal plan:

```bash
python web/setup_database.py
```

This will:
- Test the database connection
- Create default food items (Greek Yogurt, Chicken Breast, etc.)
- Create a default meal plan with the current hardcoded structure
- Mark all seeded foods as `is_default = true`

## Step 6: Start the Application

```bash
python web/app.py
```

## Verification

You can verify the setup by:

1. Checking the Supabase dashboard for the new tables and data
2. Testing the API endpoints:
   - `GET /api/foods` - Should return all food items
   - `GET /api/meal-plans/{id}` - Should return the default meal plan

## Troubleshooting

### Database Connection Issues
- Verify your SUPABASE_URL and SUPABASE_ANON_KEY are correct
- Check that your Supabase project is running
- Ensure you've run the schema.sql script

### Missing Tables Error
- Make sure you've executed the schema.sql in Supabase SQL editor
- Check that the tables were created successfully

### API Key Issues
- Verify your Anthropic API key is set correctly
- Check that the LLM wrapper can connect to the AI service

## Database Schema

The database includes these tables:

- **foods**: Food items with nutritional data per 100g
- **meal_plans**: User meal plans
- **meals**: Individual meals within a plan
- **meal_foods**: Junction table linking foods to meals with quantities

All nutritional calculations are standardized to grams for consistency.
