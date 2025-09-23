/**
 * API client for nutritionist copilot application
 * Handles all communication with the backend API
 */

class NutritionistAPI {
    constructor() {
        this.baseURL = '';
        this.defaultMealPlanId = null;
    }

    /**
     * Set the default meal plan ID for the current session
     */
    setDefaultMealPlanId(mealPlanId) {
        this.defaultMealPlanId = mealPlanId;
    }

    /**
     * Get the default meal plan ID
     */
    getDefaultMealPlanId() {
        return this.defaultMealPlanId;
    }

    /**
     * Generic error handler for API responses
     */
    handleError(response, operation) {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || `Failed to ${operation}`);
            });
        }
        return response.json();
    }

    /**
     * Get all food items
     */
    async getFoods() {
        try {
            const response = await fetch(`${this.baseURL}/api/foods`);
            return await this.handleError(response, 'load foods');
        } catch (error) {
            console.error('Error loading foods:', error);
            throw new Error(`Failed to load foods: ${error.message}`);
        }
    }

    /**
     * Get a specific food item by ID
     */
    async getFood(foodId) {
        try {
            const response = await fetch(`${this.baseURL}/api/foods/${foodId}`);
            return await this.handleError(response, 'load food');
        } catch (error) {
            console.error('Error loading food:', error);
            throw new Error(`Failed to load food: ${error.message}`);
        }
    }

    /**
     * Get a meal plan with all its meals and foods
     */
    async getMealPlan(mealPlanId) {
        try {
            const response = await fetch(`${this.baseURL}/api/meal-plans/${mealPlanId}`);
            return await this.handleError(response, 'load meal plan');
        } catch (error) {
            console.error('Error loading meal plan:', error);
            throw new Error(`Failed to load meal plan: ${error.message}`);
        }
    }

    /**
     * Create a new meal plan
     */
    async createMealPlan(name = "Today's Meal Plan") {
        try {
            const response = await fetch(`${this.baseURL}/api/meal-plans`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name })
            });
            return await this.handleError(response, 'create meal plan');
        } catch (error) {
            console.error('Error creating meal plan:', error);
            throw new Error(`Failed to create meal plan: ${error.message}`);
        }
    }

    /**
     * Add a new meal to a meal plan
     */
    async addMeal(mealPlanId, name, emoji = '🍽️') {
        try {
            const response = await fetch(`${this.baseURL}/api/meals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    meal_plan_id: mealPlanId,
                    name: name,
                    emoji: emoji
                })
            });
            return await this.handleError(response, 'add meal');
        } catch (error) {
            console.error('Error adding meal:', error);
            throw new Error(`Failed to add meal: ${error.message}`);
        }
    }

    /**
     * Delete a meal and all its foods
     */
    async deleteMeal(mealId) {
        try {
            const response = await fetch(`${this.baseURL}/api/meals/${mealId}`, {
                method: 'DELETE'
            });
            return await this.handleError(response, 'delete meal');
        } catch (error) {
            console.error('Error deleting meal:', error);
            throw new Error(`Failed to delete meal: ${error.message}`);
        }
    }

    /**
     * Add a food item to a meal (existing database food)
     */
    async addFoodToMeal(mealId, foodId, quantityGrams) {
        try {
            const response = await fetch(`${this.baseURL}/api/meal-foods`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    meal_id: mealId,
                    food_id: foodId,
                    quantity_grams: quantityGrams
                })
            });
            return await this.handleError(response, 'add food to meal');
        } catch (error) {
            console.error('Error adding food to meal:', error);
            throw new Error(`Failed to add food to meal: ${error.message}`);
        }
    }

    /**
     * Add a food item directly to a meal with nutritional data (auto-save to database)
     */
    async addDirectFoodToMeal(mealId, foodName, quantityGrams, nutritionalData) {
        try {
            const response = await fetch(`${this.baseURL}/api/meal-foods`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    meal_id: mealId,
                    food_name: foodName,
                    quantity_grams: quantityGrams,
                    calories_per_100g: nutritionalData.calories_per_100g,
                    protein_per_100g: nutritionalData.protein_per_100g,
                    carbs_per_100g: nutritionalData.carbs_per_100g,
                    fat_per_100g: nutritionalData.fat_per_100g,
                    fiber_per_100g: nutritionalData.fiber_per_100g
                })
            });
            return await this.handleError(response, 'add direct food to meal');
        } catch (error) {
            console.error('Error adding direct food to meal:', error);
            throw new Error(`Failed to add food to meal: ${error.message}`);
        }
    }

    /**
     * Update the quantity of a food item in a meal
     */
    async updateFoodQuantity(mealFoodId, quantityGrams) {
        try {
            const response = await fetch(`${this.baseURL}/api/meal-foods/${mealFoodId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    quantity_grams: quantityGrams
                })
            });
            return await this.handleError(response, 'update food quantity');
        } catch (error) {
            console.error('Error updating food quantity:', error);
            throw new Error(`Failed to update food quantity: ${error.message}`);
        }
    }

    /**
     * Remove a food item from a meal
     */
    async removeFoodFromMeal(mealFoodId) {
        try {
            const response = await fetch(`${this.baseURL}/api/meal-foods/${mealFoodId}`, {
                method: 'DELETE'
            });
            return await this.handleError(response, 'remove food from meal');
        } catch (error) {
            console.error('Error removing food from meal:', error);
            throw new Error(`Failed to remove food from meal: ${error.message}`);
        }
    }

    /**
     * Get available LLM models
     */
    async getModels() {
        try {
            const response = await fetch(`${this.baseURL}/api/models`);
            return await this.handleError(response, 'load models');
        } catch (error) {
            console.error('Error loading models:', error);
            throw new Error(`Failed to load models: ${error.message}`);
        }
    }

    /**
     * Send a message to the nutritionist chat
     */
    async sendChatMessage(message, mealPlanContext, model, temperature, maxTokens) {
        try {
            const response = await fetch(`${this.baseURL}/api/nutritionist/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    meal_plan_context: mealPlanContext,
                    model: model,
                    temperature: temperature,
                    max_tokens: maxTokens
                })
            });
            return await this.handleError(response, 'send chat message');
        } catch (error) {
            console.error('Error sending chat message:', error);
            throw new Error(`Failed to send message: ${error.message}`);
        }
    }
}

// Create global API instance
window.nutritionistAPI = new NutritionistAPI();
