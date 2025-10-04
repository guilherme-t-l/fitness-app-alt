/**
 * Suggestion Applier
 * Executes structured changes on the meal plan
 */

class SuggestionApplier {
    constructor(api, mealPlanManager) {
        this.api = api;
        this.mealPlanManager = mealPlanManager;
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Apply a single change to the meal plan
     * @param {Object} change - The parsed change object
     * @returns {Promise<Object>} Result of the operation
     */
    async applyChange(change) {
        try {
            let result;
            
            switch (change.type) {
                case 'add':
                    result = await this.applyAddition(change);
                    break;
                case 'replace':
                    result = await this.applyReplacement(change);
                    break;
                case 'delete':
                    result = await this.applyDeletion(change);
                    break;
                case 'modify_quantity':
                    result = await this.applyQuantityModification(change);
                    break;
                case 'add_meal':
                    result = await this.applyNewMeal(change);
                    break;
                default:
                    throw new Error(`Unknown change type: ${change.type}`);
            }
            
            // Add to undo stack
            this.addToUndoStack(change, result);
            
            return {
                success: true,
                change: change,
                result: result,
                message: this.getSuccessMessage(change)
            };
            
        } catch (error) {
            console.error('Error applying change:', error);
            return {
                success: false,
                change: change,
                error: error.message,
                message: `Failed to apply change: ${error.message}`
            };
        }
    }

    /**
     * Apply multiple changes in sequence
     * @param {Array} changes - Array of parsed change objects
     * @returns {Promise<Object>} Results of all operations
     */
    async applyMultipleChanges(changes) {
        const results = [];
        const successfulChanges = [];
        
        for (const change of changes) {
            const result = await this.applyChange(change);
            results.push(result);
            
            if (result.success) {
                successfulChanges.push(change);
            }
        }
        
        // Add all successful changes to undo stack as a group
        if (successfulChanges.length > 0) {
            this.addMultiChangeToUndoStack(successfulChanges, results.filter(r => r.success));
        }
        
        return {
            success: results.some(r => r.success),
            results: results,
            successful_count: successfulChanges.length,
            total_count: changes.length,
            message: `Applied ${successfulChanges.length} out of ${changes.length} changes`
        };
    }

    /**
     * Apply an addition change
     */
    async applyAddition(change) {
        const mealId = await this.getMealId(change.target_meal);
        if (!mealId) {
            throw new Error(`Meal "${change.target_meal}" not found`);
        }
        
        // Try to find existing food in database first
        const existingFood = await this.findFoodInDatabase(change.food_name);
        
        if (existingFood) {
            // Use existing food from database
            return await this.api.addFoodToMeal(mealId, existingFood.id, change.quantity);
        } else {
            // Generate nutritional data using AI
            const nutritionalData = await this.api.generateMacros(change.food_name);
            return await this.api.addDirectFoodToMeal(
                mealId, 
                change.food_name, 
                change.quantity, 
                nutritionalData
            );
        }
    }

    /**
     * Apply a replacement change
     */
    async applyReplacement(change) {
        const mealId = await this.getMealId(change.target_meal);
        if (!mealId) {
            throw new Error(`Meal "${change.target_meal}" not found`);
        }
        
        // Find the food to replace
        const mealFoodToReplace = await this.findFoodInMeal(mealId, change.original_food);
        if (!mealFoodToReplace) {
            throw new Error(`Food "${change.original_food}" not found in ${change.target_meal}`);
        }
        
        // Remove the old food
        await this.api.removeFoodFromMeal(mealFoodToReplace.id);
        
        // Add the new food
        return await this.applyAddition(change);
    }

    /**
     * Apply a deletion change
     */
    async applyDeletion(change) {
        const mealId = await this.getMealId(change.target_meal);
        if (!mealId) {
            throw new Error(`Meal "${change.target_meal}" not found`);
        }
        
        // Find the food to delete
        const mealFoodToDelete = await this.findFoodInMeal(mealId, change.food_name);
        if (!mealFoodToDelete) {
            throw new Error(`Food "${change.food_name}" not found in ${change.target_meal}`);
        }
        
        return await this.api.removeFoodFromMeal(mealFoodToDelete.id);
    }

    /**
     * Apply a quantity modification change
     */
    async applyQuantityModification(change) {
        const mealId = await this.getMealId(change.target_meal);
        if (!mealId) {
            throw new Error(`Meal "${change.target_meal}" not found`);
        }
        
        // Find the food to modify
        const mealFoodToModify = await this.findFoodInMeal(mealId, change.food_name);
        if (!mealFoodToModify) {
            throw new Error(`Food "${change.food_name}" not found in ${change.target_meal}`);
        }
        
        return await this.api.updateFoodQuantity(mealFoodToModify.id, change.quantity);
    }

    /**
     * Apply a new meal change
     */
    async applyNewMeal(change) {
        const mealPlanId = this.mealPlanManager.currentMealPlan?.id;
        if (!mealPlanId) {
            throw new Error('No active meal plan found');
        }
        
        // Create the new meal
        const mealResult = await this.api.addMeal(mealPlanId, change.meal_name, '🍽️');
        
        // Add foods to the new meal if specified
        if (change.foods && change.foods.length > 0) {
            for (const food of change.foods) {
                try {
                    await this.applyAddition({
                        type: 'add',
                        target_meal: change.meal_name,
                        food_name: food.name,
                        quantity: food.quantity
                    });
                } catch (error) {
                    console.warn(`Failed to add food ${food.name} to new meal:`, error);
                }
            }
        }
        
        return mealResult;
    }

    /**
     * Get meal ID by name
     */
    async getMealId(mealName) {
        const mealPlan = this.mealPlanManager.currentMealPlan;
        if (!mealPlan) return null;
        
        const meal = mealPlan.meals.find(m => 
            m.name.toLowerCase() === mealName.toLowerCase()
        );
        
        return meal ? meal.id : null;
    }

    /**
     * Find food in database by name
     */
    async findFoodInDatabase(foodName) {
        const foods = this.mealPlanManager.foods || [];
        return foods.find(f => 
            f.name.toLowerCase().includes(foodName.toLowerCase()) ||
            foodName.toLowerCase().includes(f.name.toLowerCase())
        );
    }

    /**
     * Find food in a specific meal
     */
    async findFoodInMeal(mealId, foodName) {
        const mealPlan = this.mealPlanManager.currentMealPlan;
        if (!mealPlan) return null;
        
        const meal = mealPlan.meals.find(m => m.id === mealId);
        if (!meal) return null;
        
        return meal.foods.find(f => 
            f.food_name.toLowerCase().includes(foodName.toLowerCase()) ||
            foodName.toLowerCase().includes(f.food_name.toLowerCase())
        );
    }

    /**
     * Add a single change to undo stack
     */
    addToUndoStack(change, result) {
        this.undoStack.push({
            type: 'single',
            change: change,
            result: result,
            timestamp: Date.now()
        });
        
        // Clear redo stack when new changes are made
        this.redoStack = [];
    }

    /**
     * Add multiple changes to undo stack
     */
    addMultiChangeToUndoStack(changes, results) {
        this.undoStack.push({
            type: 'multi',
            changes: changes,
            results: results,
            timestamp: Date.now()
        });
        
        // Clear redo stack when new changes are made
        this.redoStack = [];
    }

    /**
     * Undo the last change
     */
    async undoLastChange() {
        if (this.undoStack.length === 0) {
            throw new Error('No changes to undo');
        }
        
        const lastChange = this.undoStack.pop();
        this.redoStack.push(lastChange);
        
        try {
            if (lastChange.type === 'single') {
                await this.undoSingleChange(lastChange);
            } else if (lastChange.type === 'multi') {
                await this.undoMultiChange(lastChange);
            }
            
            return {
                success: true,
                message: 'Change undone successfully'
            };
        } catch (error) {
            // Put the change back in undo stack if undo failed
            this.undoStack.push(lastChange);
            this.redoStack.pop();
            throw error;
        }
    }

    /**
     * Undo a single change
     */
    async undoSingleChange(changeData) {
        const { change, result } = changeData;
        
        switch (change.type) {
            case 'add':
                // Remove the added food
                if (result.meal_food) {
                    await this.api.removeFoodFromMeal(result.meal_food.id);
                }
                break;
            case 'replace':
                // Remove the new food and add back the original
                if (result.meal_food) {
                    await this.api.removeFoodFromMeal(result.meal_food.id);
                }
                // Note: We'd need to store the original food data to restore it
                break;
            case 'delete':
                // Add back the deleted food
                // Note: We'd need to store the deleted food data to restore it
                break;
            case 'modify_quantity':
                // Restore original quantity
                // Note: We'd need to store the original quantity to restore it
                break;
            case 'add_meal':
                // Delete the added meal
                if (result.meal) {
                    await this.api.deleteMeal(result.meal.id);
                }
                break;
        }
    }

    /**
     * Undo multiple changes
     */
    async undoMultiChange(changeData) {
        const { changes, results } = changeData;
        
        // Undo changes in reverse order
        for (let i = changes.length - 1; i >= 0; i--) {
            try {
                await this.undoSingleChange({
                    change: changes[i],
                    result: results[i]
                });
            } catch (error) {
                console.warn(`Failed to undo change ${i}:`, error);
            }
        }
    }

    /**
     * Get success message for a change
     */
    getSuccessMessage(change) {
        switch (change.type) {
            case 'add':
                return `Added ${change.quantity}g ${change.food_name} to ${change.target_meal}`;
            case 'replace':
                return `Replaced ${change.original_food} with ${change.food_name} in ${change.target_meal}`;
            case 'delete':
                return `Removed ${change.food_name} from ${change.target_meal}`;
            case 'modify_quantity':
                return `Changed ${change.food_name} quantity to ${change.quantity}g in ${change.target_meal}`;
            case 'add_meal':
                return `Added new meal: ${change.meal_name}`;
            default:
                return 'Change applied successfully';
        }
    }

    /**
     * Get undo stack length
     */
    getUndoStackLength() {
        return this.undoStack.length;
    }

    /**
     * Get redo stack length
     */
    getRedoStackLength() {
        return this.redoStack.length;
    }

    /**
     * Clear all undo/redo history
     */
    clearHistory() {
        this.undoStack = [];
        this.redoStack = [];
    }
}

// Export for use in other modules
window.SuggestionApplier = SuggestionApplier;
