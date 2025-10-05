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
        errorDiv.style.cssText = `
            background: #dc3545; 
            color: white; 
            padding: 12px 16px; 
            border-radius: 8px; 
            margin: 8px 0; 
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
        `;
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
     * Show success message
     */
    showSuccess(message) {
        console.log('MealPlanManager Success:', message);
        
        // Create success notification
        const successDiv = document.createElement('div');
        successDiv.className = 'success';
        successDiv.style.cssText = `
            background: #28a745; 
            color: white; 
            padding: 12px 16px; 
            border-radius: 8px; 
            margin: 8px 0; 
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
        `;
        successDiv.textContent = message;
        
        // Insert at top of meal plan container
        const mealPlanContainer = document.getElementById('mealPlanContainer');
        if (mealPlanContainer) {
            mealPlanContainer.insertBefore(successDiv, mealPlanContainer.firstChild);
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 3000);
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
            <button class="add-food-btn" onclick="mealPlanManager.addFoodToMeal('${meal.id}')" style="
                width: 100%; 
                padding: 16px; 
                background: linear-gradient(135deg, #007bff, #0056b3); 
                color: white; 
                border: none; 
                border-radius: 12px; 
                font-size: 16px; 
                font-weight: 600; 
                cursor: pointer; 
                margin: 16px 0; 
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
            " 
            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(0, 123, 255, 0.4)'"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0, 123, 255, 0.3)'">
                ➕ Add Food
            </button>
        `;

        return mealDiv;
    }

    /**
     * Create a food element
     */
    createFoodElement(mealId, mealFood) {
        return `
            <div class="food-item" data-food-index="${mealFood.id}" style="
                display: flex; 
                align-items: center; 
                padding: 12px; 
                margin: 8px 0; 
                background: #f8f9fa; 
                border-radius: 8px; 
                border: 1px solid #e9ecef;
                transition: all 0.2s ease;
            ">
                <div class="food-info" style="flex: 1; min-width: 0;">
                    <div class="food-name" style="
                        font-weight: 600; 
                        color: #333; 
                        margin-bottom: 4px;
                        cursor: pointer;
                        padding: 4px;
                        border-radius: 4px;
                        transition: background-color 0.2s ease;
                    " 
                    onmouseover="this.style.backgroundColor='#e9ecef'" 
                    onmouseout="this.style.backgroundColor='transparent'"
                    onclick="mealPlanManager.editFood('${mealId}', '${mealFood.id}')">${mealFood.food_name}</div>
                    <div class="food-quantity" style="
                        font-size: 14px; 
                        color: #666; 
                        font-weight: 500;
                    ">${mealFood.quantity_grams}g</div>
                </div>
                <div class="food-macros" style="
                    text-align: center; 
                    margin: 0 16px; 
                    min-width: 120px;
                ">
                    <div style="font-weight: 600; color: #007bff; margin-bottom: 2px;">${Math.round(mealFood.calories)} kcal</div>
                    <div style="font-size: 12px; color: #666;">
                        ${Math.round(mealFood.protein)}g P | ${Math.round(mealFood.carbs)}g C | ${Math.round(mealFood.fat)}g F
                    </div>
                </div>
                <div class="food-actions" style="display: flex; gap: 8px;">
                    <button onclick="mealPlanManager.editFoodMacros('${mealId}', '${mealFood.id}', '${mealFood.food_id || mealFood.food?.id || ''}')" 
                            style="
                                background: #007bff; 
                                color: white; 
                                border: none; 
                                padding: 8px 12px; 
                                border-radius: 6px; 
                                cursor: pointer; 
                                font-size: 12px; 
                                font-weight: 500;
                                transition: all 0.2s ease;
                            "
                            onmouseover="this.style.background='#0056b3'; this.style.transform='translateY(-1px)'"
                            onmouseout="this.style.background='#007bff'; this.style.transform='translateY(0)'">
                        ✏️ Edit
                    </button>
                    <button onclick="mealPlanManager.deleteFood('${mealId}', '${mealFood.id}')" 
                            style="
                                background: #dc3545; 
                                color: white; 
                                border: none; 
                                padding: 8px 12px; 
                                border-radius: 6px; 
                                cursor: pointer; 
                                font-size: 12px; 
                                font-weight: 500;
                                transition: all 0.2s ease;
                            "
                            onmouseover="this.style.background='#c82333'; this.style.transform='translateY(-1px)'"
                            onmouseout="this.style.background='#dc3545'; this.style.transform='translateY(0)'">
                        🗑️ Delete
                    </button>
                </div>
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

        // Try to find existing food first
        const existingFood = this.foods.find(f => f.name.toLowerCase() === foodName.toLowerCase());
        
        if (existingFood) {
            // Use existing food from database
            try {
                this.showLoading(true);
                await this.api.addFoodToMeal(mealId, existingFood.id, quantityGrams);
                await this.reloadMealPlan();
            } catch (error) {
                this.showError(`Failed to add food: ${error.message}`);
            } finally {
                this.showLoading(false);
            }
        } else {
            // Add new food with nutritional data
            await this.addNewFoodToMeal(mealId, foodName, quantityGrams);
        }
    }

    /**
     * Add new food with AI-generated nutritional data
     */
    async addNewFoodToMeal(mealId, foodName, quantityGrams) {
        try {
            this.showLoading(true);
            
            // Show AI generation message
            this.showAIGenerationMessage(foodName);
            
            // Generate nutritional data using AI
            const nutritionalData = await this.api.generateMacros(foodName);
            
            // Add food to meal with AI-generated data
            await this.api.addDirectFoodToMeal(mealId, foodName, quantityGrams, nutritionalData);
            await this.reloadMealPlan();
            
        } catch (error) {
            this.showError(`Failed to add food: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Show AI generation message
     */
    showAIGenerationMessage(foodName) {
        // Create temporary message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'ai-generation-message';
        messageDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: #007bff; color: white; padding: 20px; border-radius: 8px;
            z-index: 1001; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        messageDiv.innerHTML = `
            <div>🤖 AI is generating nutritional data for "${foodName}"...</div>
            <div style="margin-top: 10px; font-size: 14px; opacity: 0.8;">Please wait...</div>
        `;
        
        document.body.appendChild(messageDiv);
        
        // Remove after 3 seconds (or when loading stops)
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }

    /**
     * Show nutritional data input form
     */
    async showNutritionalDataForm(foodName) {
        return new Promise((resolve) => {
            // Create modal
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.5); display: flex; align-items: center;
                justify-content: center; z-index: 1000;
            `;
            
            modal.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 8px; max-width: 400px; width: 90%;">
                    <h3>Add "${foodName}" to Database</h3>
                    <p>Enter nutritional information per 100g:</p>
                    <div style="margin: 10px 0;">
                        <label>Calories: <input type="number" id="calories" value="100" min="0" step="0.1"></label>
                    </div>
                    <div style="margin: 10px 0;">
                        <label>Protein (g): <input type="number" id="protein" value="5" min="0" step="0.1"></label>
                    </div>
                    <div style="margin: 10px 0;">
                        <label>Carbs (g): <input type="number" id="carbs" value="10" min="0" step="0.1"></label>
                    </div>
                    <div style="margin: 10px 0;">
                        <label>Fat (g): <input type="number" id="fat" value="3" min="0" step="0.1"></label>
                    </div>
                    <div style="margin-top: 20px; text-align: right;">
                        <button id="cancelBtn" style="margin-right: 10px; padding: 8px 16px;">Cancel</button>
                        <button id="addBtn" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px;">Add Food</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Handle events
            document.getElementById('cancelBtn').onclick = () => {
                document.body.removeChild(modal);
                resolve(null);
            };
            
            document.getElementById('addBtn').onclick = () => {
                const data = {
                    calories_per_100g: parseFloat(document.getElementById('calories').value),
                    protein_per_100g: parseFloat(document.getElementById('protein').value),
                    carbs_per_100g: parseFloat(document.getElementById('carbs').value),
                    fat_per_100g: parseFloat(document.getElementById('fat').value)
                };
                document.body.removeChild(modal);
                resolve(data);
            };
        });
    }

    /**
     * Edit food quantity
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
     * Edit food macros (nutritional data)
     */
    async editFoodMacros(mealId, mealFoodId, foodId) {
        console.log('Edit button clicked with params:', { mealId, mealFoodId, foodId });
        
        const meal = this.currentMealPlan.meals.find(m => m.id === mealId);
        if (!meal) {
            console.error('Meal not found:', mealId);
            return;
        }

        const mealFood = meal.foods.find(f => f.id === mealFoodId);
        if (!mealFood) {
            console.error('MealFood not found:', mealFoodId);
            return;
        }

        // Get current nutritional data - handle both database foods and direct foods
        let currentMacros;
        
        // Debug: Log the mealFood object structure
        console.log('MealFood object:', mealFood);
        console.log('MealFood.food:', mealFood.food);
        
        if (mealFood.food && mealFood.food.calories_per_100g !== undefined) {
            // Database food
            currentMacros = {
                calories_per_100g: mealFood.food.calories_per_100g,
                protein_per_100g: mealFood.food.protein_per_100g,
                carbs_per_100g: mealFood.food.carbs_per_100g,
                fat_per_100g: mealFood.food.fat_per_100g
            };
            console.log('Using database food macros');
        } else if (mealFood.calories_per_100g !== undefined) {
            // Direct food (has macros stored directly)
            currentMacros = {
                calories_per_100g: mealFood.calories_per_100g,
                protein_per_100g: mealFood.protein_per_100g,
                carbs_per_100g: mealFood.carbs_per_100g,
                fat_per_100g: mealFood.fat_per_100g
            };
            console.log('Using direct food macros');
        } else {
            // Fallback - try to calculate from current values
            const quantity = mealFood.quantity_grams || 100;
            currentMacros = {
                calories_per_100g: mealFood.calories ? (mealFood.calories / quantity) * 100 : 0,
                protein_per_100g: mealFood.protein ? (mealFood.protein / quantity) * 100 : 0,
                carbs_per_100g: mealFood.carbs ? (mealFood.carbs / quantity) * 100 : 0,
                fat_per_100g: mealFood.fat ? (mealFood.fat / quantity) * 100 : 0
            };
            console.log('Using calculated macros from current values');
        }

        console.log('Current macros:', currentMacros);
        console.log('Food ID:', foodId);

        // Show edit modal
        const updatedMacros = await this.showEditMacrosModal(mealFood.food_name, currentMacros);
        if (!updatedMacros) return;

        try {
            this.showLoading(true);
            
            console.log('Updated macros to save:', updatedMacros);
            
            // Update food in database if it has a food_id
            if (foodId && foodId !== '') {
                console.log('Updating food in database with ID:', foodId);
                console.log('Calling API with:', { foodId, updatedMacros });
                
                const result = await this.api.updateFood(foodId, updatedMacros);
                console.log('API response:', result);
                
                // Reload meal plan to get updated data
                await this.reloadMealPlan();
                this.showSuccess('Food macros updated successfully!');
            } else {
                console.log('No food_id available, cannot update database');
                this.showError('Cannot update food macros - food not found in database. This food may have been added directly without being saved to the database.');
                return;
            }
        } catch (error) {
            console.error('Error updating food macros:', error);
            this.showError(`Failed to update food macros: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Show edit macros modal
     */
    async showEditMacrosModal(foodName, currentMacros) {
        return new Promise((resolve) => {
            // Create modal
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.6); display: flex; align-items: center;
                justify-content: center; z-index: 1000; backdrop-filter: blur(4px);
            `;
            
            modal.innerHTML = `
                <div style="
                    background: white; 
                    padding: 32px; 
                    border-radius: 16px; 
                    max-width: 500px; 
                    width: 90%; 
                    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                    animation: modalSlideIn 0.3s ease-out;
                ">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h2 style="margin: 0 0 8px 0; color: #333; font-size: 24px;">Edit "${foodName}"</h2>
                        <p style="margin: 0; color: #666; font-size: 14px;">Update nutritional information per 100g</p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                        <div>
                            <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #333;">Calories</label>
                            <input type="number" id="edit-calories" value="${currentMacros.calories_per_100g}" 
                                   min="0" step="0.1" style="
                                       width: 100%; 
                                       padding: 12px; 
                                       border: 2px solid #e9ecef; 
                                       border-radius: 8px; 
                                       font-size: 16px;
                                       transition: border-color 0.2s ease;
                                   " 
                                   onfocus="this.style.borderColor='#007bff'"
                                   onblur="this.style.borderColor='#e9ecef'">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #333;">Protein (g)</label>
                            <input type="number" id="edit-protein" value="${currentMacros.protein_per_100g}" 
                                   min="0" step="0.1" style="
                                       width: 100%; 
                                       padding: 12px; 
                                       border: 2px solid #e9ecef; 
                                       border-radius: 8px; 
                                       font-size: 16px;
                                       transition: border-color 0.2s ease;
                                   " 
                                   onfocus="this.style.borderColor='#007bff'"
                                   onblur="this.style.borderColor='#e9ecef'">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #333;">Carbs (g)</label>
                            <input type="number" id="edit-carbs" value="${currentMacros.carbs_per_100g}" 
                                   min="0" step="0.1" style="
                                       width: 100%; 
                                       padding: 12px; 
                                       border: 2px solid #e9ecef; 
                                       border-radius: 8px; 
                                       font-size: 16px;
                                       transition: border-color 0.2s ease;
                                   " 
                                   onfocus="this.style.borderColor='#007bff'"
                                   onblur="this.style.borderColor='#e9ecef'">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #333;">Fat (g)</label>
                            <input type="number" id="edit-fat" value="${currentMacros.fat_per_100g}" 
                                   min="0" step="0.1" style="
                                       width: 100%; 
                                       padding: 12px; 
                                       border: 2px solid #e9ecef; 
                                       border-radius: 8px; 
                                       font-size: 16px;
                                       transition: border-color 0.2s ease;
                                   " 
                                   onfocus="this.style.borderColor='#007bff'"
                                   onblur="this.style.borderColor='#e9ecef'">
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button id="edit-cancelBtn" style="
                            padding: 12px 24px; 
                            border: 2px solid #e9ecef; 
                            background: white; 
                            color: #666; 
                            border-radius: 8px; 
                            cursor: pointer; 
                            font-weight: 600;
                            transition: all 0.2s ease;
                        " 
                        onmouseover="this.style.borderColor='#dc3545'; this.style.color='#dc3545'"
                        onmouseout="this.style.borderColor='#e9ecef'; this.style.color='#666'">
                            Cancel
                        </button>
                        <button id="edit-saveBtn" style="
                            background: #007bff; 
                            color: white; 
                            border: none; 
                            padding: 12px 24px; 
                            border-radius: 8px; 
                            cursor: pointer; 
                            font-weight: 600;
                            transition: all 0.2s ease;
                        " 
                        onmouseover="this.style.background='#0056b3'; this.style.transform='translateY(-1px)'"
                        onmouseout="this.style.background='#007bff'; this.style.transform='translateY(0)'">
                            💾 Save Changes
                        </button>
                    </div>
                </div>
                
                <style>
                    @keyframes modalSlideIn {
                        from { opacity: 0; transform: translateY(-20px) scale(0.95); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                </style>
            `;
            
            document.body.appendChild(modal);
            
            // Handle events
            document.getElementById('edit-cancelBtn').onclick = () => {
                document.body.removeChild(modal);
                resolve(null);
            };
            
            document.getElementById('edit-saveBtn').onclick = () => {
                const data = {
                    calories_per_100g: parseFloat(document.getElementById('edit-calories').value),
                    protein_per_100g: parseFloat(document.getElementById('edit-protein').value),
                    carbs_per_100g: parseFloat(document.getElementById('edit-carbs').value),
                    fat_per_100g: parseFloat(document.getElementById('edit-fat').value)
                };
                document.body.removeChild(modal);
                resolve(data);
            };
            
            // Close modal on escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    document.body.removeChild(modal);
                    document.removeEventListener('keydown', handleEscape);
                    resolve(null);
                }
            };
            document.addEventListener('keydown', handleEscape);
        });
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

/**
 * AI Suggestions Manager
 * Handles AI-generated food suggestions and user interactions
 */
class AISuggestionsManager {
    constructor(api, mealPlanManager) {
        this.api = api;
        this.mealPlanManager = mealPlanManager;
        this.suggestions = [];
        this.suggestionIdCounter = 0;
    }

    /**
     * Add a new AI suggestion
     */
    async addSuggestion(suggestionData) {
        const suggestion = {
            id: ++this.suggestionIdCounter,
            title: suggestionData.title || 'AI Suggestion',
            mealName: suggestionData.mealName || 'Unknown Meal',
            foods: suggestionData.foods || [],
            timestamp: new Date(),
            status: 'pending' // pending, accepted, rejected, dismissed
        };

        // Generate macros for foods that don't have them
        await this.generateMacrosForSuggestion(suggestion);

        this.suggestions.push(suggestion);
        this.renderSuggestions();
        this.updateSuggestionsTabBadge();
        this.showSuggestionsTab();
        return suggestion;
    }

    /**
     * Generate macros for foods in a suggestion
     */
    async generateMacrosForSuggestion(suggestion) {
        for (const food of suggestion.foods) {
            // Only generate if macros are not already set
            if (food.macros.calories === 0) {
                try {
                    // Check if food exists in database first
                    const existingFood = this.mealPlanManager.foods.find(
                        f => f.name.toLowerCase() === food.name.toLowerCase()
                    );

                    if (existingFood) {
                        // Use database macros
                        food.macros = {
                            calories: (existingFood.calories_per_100g / 100) * food.quantity,
                            protein: (existingFood.protein_per_100g / 100) * food.quantity,
                            carbs: (existingFood.carbs_per_100g / 100) * food.quantity,
                            fat: (existingFood.fat_per_100g / 100) * food.quantity
                        };
                    } else {
                        // Generate macros using AI
                        const nutritionalData = await this.api.generateMacros(food.name);
                        food.macros = {
                            calories: (nutritionalData.calories_per_100g / 100) * food.quantity,
                            protein: (nutritionalData.protein_per_100g / 100) * food.quantity,
                            carbs: (nutritionalData.carbs_per_100g / 100) * food.quantity,
                            fat: (nutritionalData.fat_per_100g / 100) * food.quantity
                        };
                    }
                } catch (error) {
                    console.error(`Failed to generate macros for ${food.name}:`, error);
                    // Keep default values if generation fails
                }
            }
        }
    }

    /**
     * Parse AI response for food suggestions
     */
    parseAIResponse(aiResponse) {
        const suggestions = [];
        
        // Only create suggestions if the AI is actually suggesting foods
        const suggestionKeywords = ['add', 'suggest', 'recommend', 'try', 'include', 'consider', 'incorporate'];
        const hasSuggestionKeywords = suggestionKeywords.some(keyword => 
            aiResponse.toLowerCase().includes(keyword)
        );
        
        if (!hasSuggestionKeywords) {
            return suggestions;
        }

        // Extract meal name if mentioned
        let mealName = 'Breakfast'; // Default
        const meals = ['breakfast', 'lunch', 'dinner', 'snack'];
        for (const meal of meals) {
            if (aiResponse.toLowerCase().includes(meal)) {
                mealName = meal.charAt(0).toUpperCase() + meal.slice(1);
                break;
            }
        }

        // Try to extract specific food names and quantities
        const foods = this.extractFoodsFromResponse(aiResponse);
        
        if (foods.length > 0) {
            suggestions.push({
                title: 'AI Food Recommendation',
                mealName: mealName,
                foods: foods
            });
        } else {
            // Don't create generic suggestions - only create if we found specific foods
            console.log('No specific foods found in AI response');
        }

        return suggestions;
    }

    /**
     * Extract food names and quantities from AI response
     */
    extractFoodsFromResponse(response) {
        const foods = [];
        
        // Common food patterns - more comprehensive
        const patterns = [
            // "Add 150g chicken breast"
            /(?:add|suggest|recommend|try|include)\s+(\d+)\s*(?:g|grams?)\s+([^.!?,]+)/gi,
            // "chicken breast (150g)"
            /([^.!?,]+?)\s*\((\d+)\s*(?:g|grams?)\)/gi,
            // "150g of chicken breast"
            /(\d+)\s*(?:g|grams?)\s+of\s+([^.!?,]+)/gi,
            // "adding 100g salmon"
            /adding\s+(\d+)\s*(?:g|grams?)\s+([^.!?,]+)/gi,
            // "2 egg whites" or "two egg whites"
            /(?:(\d+)|two|three|four|five)\s+(?:egg whites?|eggs?)\b/gi,
            // "protein powder" with quantity
            /(?:add|include)\s+(\d+)\s*(?:g|grams?)\s+protein powder/gi,
            // "cottage cheese" with quantity
            /(?:add|include)\s+(\d+)\s*(?:g|grams?)\s+cottage cheese/gi
        ];

        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(response)) !== null) {
                let quantity = 100; // Default
                let foodName = 'Suggested Food';
                
                if (match[1] && !isNaN(parseInt(match[1]))) {
                    quantity = parseInt(match[1]);
                    foodName = match[2] ? match[2].trim() : 'Suggested Food';
                } else if (match[2] && !isNaN(parseInt(match[2]))) {
                    quantity = parseInt(match[2]);
                    foodName = match[1] ? match[1].trim() : 'Suggested Food';
                } else {
                    // Handle text numbers like "two egg whites"
                    if (match[0].toLowerCase().includes('two')) quantity = 2;
                    else if (match[0].toLowerCase().includes('three')) quantity = 3;
                    else if (match[0].toLowerCase().includes('four')) quantity = 4;
                    else if (match[0].toLowerCase().includes('five')) quantity = 5;
                    
                    foodName = match[0].replace(/\d+|\b(two|three|four|five)\b/gi, '').trim();
                }
                
                // Clean up food name
                foodName = foodName.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '').trim();
                
                // Avoid duplicates and empty names
                if (foodName && foodName.length > 0 && !foods.some(f => f.name.toLowerCase() === foodName.toLowerCase())) {
                    foods.push({
                        name: foodName.charAt(0).toUpperCase() + foodName.slice(1),
                        quantity: quantity,
                        macros: {
                            calories: 0, // Will be generated when accepted
                            protein: 0,
                            carbs: 0,
                            fat: 0
                        }
                    });
                }
            }
        });

        // If no specific foods found, try to extract just food names
        if (foods.length === 0) {
            const commonFoods = [
                'chicken breast', 'salmon', 'eggs', 'egg whites', 'greek yogurt', 'quinoa', 'rice',
                'avocado', 'spinach', 'broccoli', 'sweet potato', 'almonds', 'banana',
                'oatmeal', 'protein powder', 'olive oil', 'mixed berries', 'cottage cheese',
                'chia seeds', 'hemp seeds', 'almond butter', 'peanut butter'
            ];
            
            for (const food of commonFoods) {
                if (response.toLowerCase().includes(food)) {
                    foods.push({
                        name: food.charAt(0).toUpperCase() + food.slice(1),
                        quantity: 100,
                        macros: {
                            calories: 0,
                            protein: 0,
                            carbs: 0,
                            fat: 0
                        }
                    });
                    break; // Only suggest the first match to avoid too many suggestions
                }
            }
        }

        return foods;
    }

    /**
     * Show suggestions tab
     */
    showSuggestionsTab() {
        if (typeof switchTab === 'function') {
            switchTab('suggestions');
        }
    }

    /**
     * Render all suggestions
     */
    renderSuggestions() {
        const container = document.getElementById('suggestionsContainer');
        const noSuggestionsEl = document.getElementById('noSuggestions');
        
        if (!container) {
            console.warn('Suggestions container not found');
            return;
        }

        // Get pending suggestions
        const pendingSuggestions = this.suggestions.filter(s => s.status === 'pending');

        if (pendingSuggestions.length === 0) {
            if (noSuggestionsEl) {
                noSuggestionsEl.style.display = 'block';
            }
            container.innerHTML = '';
            this.updateSuggestionsTabBadge();
            return;
        }

        if (noSuggestionsEl) {
            noSuggestionsEl.style.display = 'none';
        }
        container.innerHTML = '';

        pendingSuggestions.forEach(suggestion => {
            const suggestionElement = this.createSuggestionElement(suggestion);
            container.appendChild(suggestionElement);
        });

        // Update badge after rendering
        this.updateSuggestionsTabBadge();
    }

    /**
     * Create a suggestion element
     */
    createSuggestionElement(suggestion) {
        const div = document.createElement('div');
        div.className = 'suggestion-card';
        div.setAttribute('data-suggestion-id', suggestion.id);

        const foodsHtml = suggestion.foods.map(food => `
            <div class="suggestion-food">
                <div class="food-info">
                    <div class="food-name">${food.name}</div>
                    <div class="food-quantity">${food.quantity}g</div>
                </div>
                <div class="food-macros">
                    <div class="macro-calories">${Math.round(food.macros.calories)} kcal</div>
                    <div class="macro-details">
                        ${Math.round(food.macros.protein)}g P | ${Math.round(food.macros.carbs)}g C | ${Math.round(food.macros.fat)}g F
                    </div>
                </div>
            </div>
        `).join('');

        div.innerHTML = `
            <div class="suggestion-header">
                <div class="suggestion-title">
                    🤖 ${suggestion.title}
                </div>
                <div class="suggestion-meal">
                    ${suggestion.mealName}
                </div>
            </div>
            <div class="suggestion-body">
                ${foodsHtml}
                <div class="suggestion-actions">
                    <button class="suggestion-btn accept" onclick="aiSuggestionsManager.acceptSuggestion(${suggestion.id})">
                        ✅ Accept
                    </button>
                    <button class="suggestion-btn reject" onclick="aiSuggestionsManager.rejectSuggestion(${suggestion.id})">
                        ❌ Reject
                    </button>
                    <button class="suggestion-btn dismiss" onclick="aiSuggestionsManager.dismissSuggestion(${suggestion.id})">
                        🗑️ Dismiss
                    </button>
                </div>
            </div>
        `;

        return div;
    }

    /**
     * Accept a suggestion
     */
    async acceptSuggestion(suggestionId) {
        const suggestion = this.suggestions.find(s => s.id === suggestionId);
        if (!suggestion) return;

        try {
            // Show loading state
            this.mealPlanManager.showLoading(true);
            
            // Find the target meal
            const meal = this.mealPlanManager.currentMealPlan.meals.find(
                m => m.name.toLowerCase() === suggestion.mealName.toLowerCase()
            );

            if (!meal) {
                alert(`Meal "${suggestion.mealName}" not found. Please add it first.`);
                this.mealPlanManager.showLoading(false);
                return;
            }

            // Add each food to the meal
            for (const food of suggestion.foods) {
                // Check if food exists in database
                const existingFood = this.mealPlanManager.foods.find(
                    f => f.name.toLowerCase() === food.name.toLowerCase()
                );

                if (existingFood) {
                    // Use existing food
                    await this.api.addFoodToMeal(meal.id, existingFood.id, food.quantity);
                } else {
                    // Generate macros and add directly
                    const nutritionalData = await this.api.generateMacros(food.name);
                    await this.api.addDirectFoodToMeal(meal.id, food.name, food.quantity, nutritionalData);
                }
            }

            // Update suggestion status
            suggestion.status = 'accepted';
            
            // Reload meal plan to show changes
            await this.mealPlanManager.reloadMealPlan();
            
            // Show success message
            this.mealPlanManager.showSuccess(`Added ${suggestion.foods.length} food(s) to ${suggestion.mealName}!`);
            
            // Remove from UI
            this.renderSuggestions();
            
            // Switch back to meals tab
            setTimeout(() => {
                if (typeof switchTab === 'function') {
                    switchTab('meals');
                }
            }, 500); // Small delay to ensure UI updates are complete

        } catch (error) {
            console.error('Error accepting suggestion:', error);
            this.mealPlanManager.showError(`Failed to add foods: ${error.message}`);
        } finally {
            this.mealPlanManager.showLoading(false);
        }
    }

    /**
     * Reject a suggestion
     */
    rejectSuggestion(suggestionId) {
        const suggestion = this.suggestions.find(s => s.id === suggestionId);
        if (!suggestion) return;

        suggestion.status = 'rejected';
        this.renderSuggestions();
        
        // Show feedback
        this.mealPlanManager.showSuccess('Suggestion rejected');
    }

    /**
     * Dismiss a suggestion
     */
    dismissSuggestion(suggestionId) {
        const suggestion = this.suggestions.find(s => s.id === suggestionId);
        if (!suggestion) return;

        suggestion.status = 'dismissed';
        this.renderSuggestions();
    }

    /**
     * Clear all suggestions
     */
    clearAllSuggestions() {
        this.suggestions = [];
        this.renderSuggestions();
    }

    /**
     * Get suggestions count
     */
    getPendingSuggestionsCount() {
        return this.suggestions.filter(s => s.status === 'pending').length;
    }

    /**
     * Update suggestions tab badge
     */
    updateSuggestionsTabBadge() {
        const suggestionsTab = document.getElementById('suggestionsTab');
        if (!suggestionsTab) return;

        const pendingCount = this.getPendingSuggestionsCount();
        
        // Remove existing badge
        const existingBadge = suggestionsTab.querySelector('.tab-badge');
        if (existingBadge) {
            existingBadge.remove();
        }

        // Add badge if there are pending suggestions
        if (pendingCount > 0) {
            const badge = document.createElement('span');
            badge.className = 'tab-badge';
            badge.style.cssText = `
                background: #dc3545;
                color: white;
                border-radius: 50%;
                padding: 2px 6px;
                font-size: 11px;
                font-weight: bold;
                margin-left: 8px;
                min-width: 18px;
                text-align: center;
                line-height: 1.2;
            `;
            badge.textContent = pendingCount;
            suggestionsTab.appendChild(badge);
        }
    }
}

// Create global meal plan manager instance
window.mealPlanManager = new MealPlanManager(window.nutritionistAPI);

// Create global AI suggestions manager instance
window.aiSuggestionsManager = new AISuggestionsManager(window.nutritionistAPI, window.mealPlanManager);

