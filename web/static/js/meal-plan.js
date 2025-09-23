/**
 * Meal Plan Manager
 * Handles all meal plan operations and UI updates
 */

class MealPlanManager {
    constructor(api) {
        this.api = api;
        this.currentMealPlan = null;
        this.foods = [];
        this.loading = false;
    }

    /**
     * Initialize the meal plan manager
     */
    async initialize() {
        try {
            this.showLoading(true);
            
            // Load foods
            await this.loadFoods();
            
            // Load or create default meal plan
            await this.loadDefaultMealPlan();
            
            this.showLoading(false);
        } catch (error) {
            this.showError(`Failed to initialize meal plan: ${error.message}`);
            this.showLoading(false);
        }
    }

    /**
     * Show/hide loading state
     */
    showLoading(show) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
        this.loading = show;
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error('MealPlanManager Error:', message);
        
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        
        // Insert at top of meal plan container
        const mealPlanContainer = document.getElementById('mealPlanContainer');
        if (mealPlanContainer) {
            mealPlanContainer.insertBefore(errorDiv, mealPlanContainer.firstChild);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 5000);
        }
    }

    /**
     * Load all foods from API
     */
    async loadFoods() {
        try {
            const response = await this.api.getFoods();
            this.foods = response.foods;
            console.log(`Loaded ${this.foods.length} foods`);
        } catch (error) {
            throw new Error(`Failed to load foods: ${error.message}`);
        }
    }

    /**
     * Load default meal plan or create one
     */
    async loadDefaultMealPlan() {
        try {
            // For now, we'll create a new meal plan each time
            // In the future, we might want to load an existing one
            const response = await this.api.createMealPlan("Today's Meal Plan");
            this.currentMealPlan = response.meal_plan;
            this.api.setDefaultMealPlanId(this.currentMealPlan.id);
            
            // Add default meals
            await this.createDefaultMeals();
            
            // Render the meal plan
            this.renderMealPlan();
            
        } catch (error) {
            throw new Error(`Failed to load meal plan: ${error.message}`);
        }
    }

    /**
     * Create the default meals (Breakfast, Lunch, Snack, Dinner)
     */
    async createDefaultMeals() {
        const defaultMeals = [
            { name: "Breakfast", emoji: "🍳" },
            { name: "Lunch", emoji: "🥗" },
            { name: "Snack", emoji: "🥜" },
            { name: "Dinner", emoji: "🍽️" }
        ];

        for (const mealData of defaultMeals) {
            try {
                const response = await this.api.addMeal(
                    this.currentMealPlan.id,
                    mealData.name,
                    mealData.emoji
                );
                
                // Add default foods to this meal
                await this.addDefaultFoodsToMeal(response.meal.id, mealData.name);
                
            } catch (error) {
                console.error(`Failed to create meal ${mealData.name}:`, error);
            }
        }

        // Reload the meal plan to get updated data
        await this.reloadMealPlan();
    }

    /**
     * Add default foods to a meal based on meal name
     */
    async addDefaultFoodsToMeal(mealId, mealName) {
        const defaultFoods = {
            "Breakfast": [
                { name: "Greek Yogurt", quantity: 200 },
                { name: "Mixed Berries", quantity: 100 },
                { name: "Granola", quantity: 50 },
                { name: "Honey", quantity: 15 }
            ],
            "Lunch": [
                { name: "Grilled Chicken Breast", quantity: 150 },
                { name: "Quinoa", quantity: 100 },
                { name: "Mixed Vegetables", quantity: 150 },
                { name: "Olive Oil", quantity: 10 }
            ],
            "Snack": [
                { name: "Almonds", quantity: 25 },
                { name: "Apple", quantity: 150 }
            ],
            "Dinner": [
                { name: "Salmon Fillet", quantity: 120 },
                { name: "Sweet Potato", quantity: 200 },
                { name: "Broccoli", quantity: 150 },
                { name: "Avocado", quantity: 50 }
            ]
        };

        const foodsToAdd = defaultFoods[mealName] || [];
        
        for (const foodData of foodsToAdd) {
            try {
                const food = this.foods.find(f => f.name === foodData.name);
                if (food) {
                    await this.api.addFoodToMeal(mealId, food.id, foodData.quantity);
                } else {
                    console.warn(`Food not found: ${foodData.name}`);
                }
            } catch (error) {
                console.error(`Failed to add ${foodData.name} to ${mealName}:`, error);
            }
        }
    }

    /**
     * Reload the current meal plan from API
     */
    async reloadMealPlan() {
        try {
            const response = await this.api.getMealPlan(this.currentMealPlan.id);
            this.currentMealPlan = response.meal_plan;
            this.renderMealPlan();
        } catch (error) {
            this.showError(`Failed to reload meal plan: ${error.message}`);
        }
    }

    /**
     * Render the meal plan in the UI
     */
    renderMealPlan() {
        if (!this.currentMealPlan) return;

        // Update total macros display
        this.updateTotalMacrosDisplay();

        // Render meals
        this.renderMeals();

        // Update meal plan context for chat
        this.updateMealPlanContext();
    }

    /**
     * Update the total macros display
     */
    updateTotalMacrosDisplay() {
        const totalCalories = document.getElementById('totalCalories');
        const totalCarbs = document.getElementById('totalCarbs');
        const totalProtein = document.getElementById('totalProtein');
        const totalFat = document.getElementById('totalFat');

        if (totalCalories) totalCalories.textContent = Math.round(this.currentMealPlan.total_calories);
        if (totalCarbs) totalCarbs.textContent = Math.round(this.currentMealPlan.total_carbs) + 'g';
        if (totalProtein) totalProtein.textContent = Math.round(this.currentMealPlan.total_protein) + 'g';
        if (totalFat) totalFat.textContent = Math.round(this.currentMealPlan.total_fat) + 'g';
    }

    /**
     * Render all meals
     */
    renderMeals() {
        const mealsContainer = document.getElementById('mealsContainer');
        if (!mealsContainer) return;

        mealsContainer.innerHTML = '';

        for (const meal of this.currentMealPlan.meals) {
            const mealElement = this.createMealElement(meal);
            mealsContainer.appendChild(mealElement);
        }
    }

    /**
     * Create a meal element
     */
    createMealElement(meal) {
        const mealDiv = document.createElement('div');
        mealDiv.className = 'meal-section';
        mealDiv.setAttribute('data-meal-id', meal.id);

        mealDiv.innerHTML = `
            <div class="meal-header">
                <span class="meal-name" onclick="mealPlanManager.editMealName('${meal.id}')">${meal.emoji} ${meal.name}</span>
                <span class="meal-macros">${Math.round(meal.total_calories)} kcal | ${Math.round(meal.total_carbs)}g C | ${Math.round(meal.total_protein)}g P | ${Math.round(meal.total_fat)}g F</span>
                <button onclick="mealPlanManager.deleteMeal('${meal.id}')" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-left: 10px;">Delete</button>
            </div>
            ${meal.foods.map(food => this.createFoodElement(meal.id, food)).join('')}
            <button class="add-food-btn" onclick="mealPlanManager.addFoodToMeal('${meal.id}')">+ Add Food</button>
        `;

        return mealDiv;
    }

    /**
     * Create a food element
     */
    createFoodElement(mealId, mealFood) {
        return `
            <div class="food-item" data-food-index="${mealFood.id}">
                <div class="food-info">
                    <div class="food-name" onclick="mealPlanManager.editFood('${mealId}', '${mealFood.id}')">${mealFood.food_name}</div>
                    <div class="food-quantity">${mealFood.quantity_grams}g</div>
                </div>
                <div class="food-macros">${Math.round(mealFood.calories)} kcal<br>${Math.round(mealFood.carbs)}g C | ${Math.round(mealFood.protein)}g P | ${Math.round(mealFood.fat)}g F</div>
                <button onclick="mealPlanManager.deleteFood('${mealId}', '${mealFood.id}')" style="background: #dc3545; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; margin-left: 10px; font-size: 12px;">×</button>
            </div>
        `;
    }

    /**
     * Update meal plan context for chat
     */
    updateMealPlanContext() {
        if (!this.currentMealPlan) return;

        let context = "Current Meal Plan:\n\n";
        
        for (const meal of this.currentMealPlan.meals) {
            context += `${meal.emoji} ${meal.name}:\n`;
            context += `Total: ${Math.round(meal.total_calories)} kcal | ${Math.round(meal.total_carbs)}g carbs | ${Math.round(meal.total_protein)}g protein | ${Math.round(meal.total_fat)}g fat\n`;
            
            for (const food of meal.foods) {
                context += `- ${food.food_name} (${food.quantity_grams}g): ${Math.round(food.calories)} kcal | ${Math.round(food.carbs)}g C | ${Math.round(food.protein)}g P | ${Math.round(food.fat)}g F\n`;
            }
            context += '\n';
        }
        
        const totals = this.currentMealPlan;
        context += `Daily Totals: ${Math.round(totals.total_calories)} kcal | ${Math.round(totals.total_carbs)}g carbs | ${Math.round(totals.total_protein)}g protein | ${Math.round(totals.total_fat)}g fat`;
        
        // Store in global variable for chat
        window.currentMealPlanContext = context;
    }

    /**
     * Add a new meal
     */
    async addNewMeal() {
        const mealName = prompt("Enter meal name (e.g., 'Post-Workout Snack', 'Mid-Morning Snack'):");
        if (!mealName) return;

        try {
            this.showLoading(true);
            const response = await this.api.addMeal(this.currentMealPlan.id, mealName, "🍽️");
            await this.reloadMealPlan();
        } catch (error) {
            this.showError(`Failed to add meal: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Delete a meal
     */
    async deleteMeal(mealId) {
        if (!confirm("Are you sure you want to delete this meal?")) return;

        try {
            this.showLoading(true);
            await this.api.deleteMeal(mealId);
            await this.reloadMealPlan();
        } catch (error) {
            this.showError(`Failed to delete meal: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Edit meal name
     */
    async editMealName(mealId) {
        const meal = this.currentMealPlan.meals.find(m => m.id === mealId);
        if (!meal) return;

        const currentName = meal.name;
        const newName = prompt("Edit meal name:", currentName);
        
        if (newName && newName !== currentName) {
            // For now, we'll just update the display
            // In the future, we'd call an API to update the meal name
            console.log(`Would update meal name from "${currentName}" to "${newName}"`);
        }
    }

    /**
     * Add food to meal
     */
    async addFoodToMeal(mealId) {
        const foodName = prompt("Enter food name:");
        if (!foodName) return;
        
        const quantity = prompt("Enter quantity in grams:");
        if (!quantity) return;
        
        const quantityGrams = parseFloat(quantity);
        if (isNaN(quantityGrams) || quantityGrams <= 0) {
            this.showError("Please enter a valid quantity in grams");
            return;
        }

        // Find food by name
        const food = this.foods.find(f => f.name.toLowerCase() === foodName.toLowerCase());
        if (!food) {
            this.showError(`Food "${foodName}" not found. Please check the spelling or add it to the database first.`);
            return;
        }

        try {
            this.showLoading(true);
            await this.api.addFoodToMeal(mealId, food.id, quantityGrams);
            await this.reloadMealPlan();
        } catch (error) {
            this.showError(`Failed to add food: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Edit food
     */
    async editFood(mealId, mealFoodId) {
        const meal = this.currentMealPlan.meals.find(m => m.id === mealId);
        if (!meal) return;

        const mealFood = meal.foods.find(f => f.id === mealFoodId);
        if (!mealFood) return;

        const newQuantity = prompt(`Edit quantity for ${mealFood.food_name} (current: ${mealFood.quantity_grams}g):`, mealFood.quantity_grams);
        if (!newQuantity) return;

        const quantityGrams = parseFloat(newQuantity);
        if (isNaN(quantityGrams) || quantityGrams <= 0) {
            this.showError("Please enter a valid quantity in grams");
            return;
        }

        try {
            this.showLoading(true);
            await this.api.updateFoodQuantity(mealFoodId, quantityGrams);
            await this.reloadMealPlan();
        } catch (error) {
            this.showError(`Failed to update food: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Delete food from meal
     */
    async deleteFood(mealId, mealFoodId) {
        if (!confirm("Are you sure you want to delete this food item?")) return;

        try {
            this.showLoading(true);
            await this.api.removeFoodFromMeal(mealFoodId);
            await this.reloadMealPlan();
        } catch (error) {
            this.showError(`Failed to delete food: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Get current meal plan context for chat
     */
    getCurrentMealPlanContext() {
        return window.currentMealPlanContext || "";
    }
}

// Create global meal plan manager instance
window.mealPlanManager = new MealPlanManager(window.nutritionistAPI);
