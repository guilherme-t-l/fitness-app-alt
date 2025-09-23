-- Supabase database schema for nutritionist copilot
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Foods table
CREATE TABLE IF NOT EXISTS foods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    calories_per_100g NUMERIC NOT NULL DEFAULT 0,
    protein_per_100g NUMERIC NOT NULL DEFAULT 0,
    carbs_per_100g NUMERIC NOT NULL DEFAULT 0,
    fat_per_100g NUMERIC NOT NULL DEFAULT 0,
    fiber_per_100g NUMERIC,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meal plans table
CREATE TABLE IF NOT EXISTS meal_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL DEFAULT 'Today''s Meal Plan',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meals table
CREATE TABLE IF NOT EXISTS meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '🍽️',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meal foods table (junction table)
CREATE TABLE IF NOT EXISTS meal_foods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
    quantity_grams NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);
CREATE INDEX IF NOT EXISTS idx_foods_is_default ON foods(is_default);
CREATE INDEX IF NOT EXISTS idx_meals_meal_plan_id ON meals(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_meals_order_index ON meals(order_index);
CREATE INDEX IF NOT EXISTS idx_meal_foods_meal_id ON meal_foods(meal_id);
CREATE INDEX IF NOT EXISTS idx_meal_foods_food_id ON meal_foods(food_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_foods_updated_at BEFORE UPDATE ON foods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plans_updated_at BEFORE UPDATE ON meal_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for future multi-user support
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_foods ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for now, since we're single-user)
-- In the future, these will be user-specific
CREATE POLICY "Allow all operations on foods" ON foods
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on meal_plans" ON meal_plans
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on meals" ON meals
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on meal_foods" ON meal_foods
    FOR ALL USING (true);
