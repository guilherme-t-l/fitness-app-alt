/**
 * Suggestion Parser
 * Parses natural language AI suggestions into structured changes
 */

class SuggestionParser {
    constructor() {
        // Common meal names and their variations
        this.mealNames = {
            'breakfast': ['breakfast', 'morning meal', 'first meal'],
            'lunch': ['lunch', 'midday meal', 'noon meal'],
            'snack': ['snack', 'snacks', 'between meals'],
            'dinner': ['dinner', 'evening meal', 'supper', 'main meal']
        };
        
        // Common food names and their variations
        this.foodSynonyms = {
            'chicken': ['chicken breast', 'grilled chicken', 'chicken', 'poultry'],
            'rice': ['rice', 'brown rice', 'white rice', 'quinoa'],
            'yogurt': ['yogurt', 'greek yogurt', 'yogurt', 'dairy'],
            'salmon': ['salmon', 'salmon fillet', 'fish', 'seafood'],
            'avocado': ['avocado', 'avocados', 'avocado fruit'],
            'almonds': ['almonds', 'nuts', 'almond nuts'],
            'olive oil': ['olive oil', 'oil', 'cooking oil'],
            'broccoli': ['broccoli', 'vegetables', 'green vegetables'],
            'sweet potato': ['sweet potato', 'sweet potatoes', 'potato'],
            'whey protein': ['whey protein', 'whey', 'protein powder', 'protein shake', 'protein']
        };
        
        // Quantity patterns
        this.quantityPatterns = [
            /(\d+(?:\.\d+)?)\s*(g|grams?|kg|kilograms?|oz|ounces?|lb|pounds?)/gi,
            /(\d+(?:\.\d+)?)\s*(cups?|tbsp|tablespoons?|tsp|teaspoons?)/gi,
            /(\d+(?:\.\d+)?)\s*(dose|doses|serving|servings|scoop|scoops)/gi
        ];
    }

    /**
     * Parse a natural language suggestion into structured changes
     * @param {string} suggestionText - The AI suggestion text
     * @returns {Object} Parsed suggestion with changes array
     */
    parseSuggestion(suggestionText) {
        console.log('Parsing suggestion text:', suggestionText);
        const changes = [];
        const lines = suggestionText.split('\n').filter(line => line.trim());
        console.log('Split into lines:', lines);
        
        let currentMeal = null;
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Check if this line indicates a meal context
            const mealContext = this.detectMealContext(trimmedLine);
            if (mealContext) {
                currentMeal = mealContext;
                console.log('Detected meal context:', currentMeal);
                continue;
            }
            
            // Parse the line with current meal context
            const change = this.parseLine(trimmedLine, currentMeal);
            if (change) {
                console.log('Parsed change from line:', line, '->', change);
                changes.push(change);
            } else {
                console.log('Could not parse line:', line);
            }
        }
        
        const result = {
            changes: changes,
            confidence: this.calculateConfidence(changes),
            raw_text: suggestionText,
            has_multiple_changes: changes.length > 1
        };
        
        console.log('Final parsed result:', result);
        return result;
    }

    /**
     * Parse a single line of suggestion text
     * @param {string} line - Single line of suggestion
     * @param {string} currentMeal - Current meal context
     * @returns {Object|null} Parsed change or null if not parseable
     */
    parseLine(line, currentMeal = null) {
        const lowerLine = line.toLowerCase();
        
        // Try to identify the type of change
        if (this.isAddition(lowerLine)) {
            return this.parseAddition(line, currentMeal);
        } else if (this.isReplacement(lowerLine)) {
            return this.parseReplacement(line, currentMeal);
        } else if (this.isDeletion(lowerLine)) {
            return this.parseDeletion(line, currentMeal);
        } else if (this.isQuantityModification(lowerLine)) {
            return this.parseQuantityModification(line, currentMeal);
        } else if (this.isNewMeal(lowerLine)) {
            return this.parseNewMeal(line);
        } else if (this.isFoodItemLine(line)) {
            // Try to parse food item lines like "2 Large Eggs (100g): 143 kcal | 1g C | 13g P | 10g F"
            return this.parseFoodItemLine(line, currentMeal);
        }
        
        return null;
    }

    /**
     * Detect meal context from a line
     */
    detectMealContext(line) {
        if (!line || typeof line !== 'string') {
            return null;
        }
        
        const lowerLine = line.toLowerCase();
        
        // Look for meal indicators
        if (lowerLine.includes('updated breakfast') || lowerLine.includes('breakfast:')) {
            return 'Breakfast';
        } else if (lowerLine.includes('updated lunch') || lowerLine.includes('lunch:')) {
            return 'Lunch';
        } else if (lowerLine.includes('updated dinner') || lowerLine.includes('dinner:')) {
            return 'Dinner';
        } else if (lowerLine.includes('updated snack') || lowerLine.includes('snack:')) {
            return 'Snack';
        } else if (lowerLine.includes('breakfast') && !lowerLine.includes(':')) {
            return 'Breakfast';
        } else if (lowerLine.includes('lunch') && !lowerLine.includes(':')) {
            return 'Lunch';
        } else if (lowerLine.includes('dinner') && !lowerLine.includes(':')) {
            return 'Dinner';
        } else if (lowerLine.includes('snack') && !lowerLine.includes(':')) {
            return 'Snack';
        }
        
        return null;
    }

    /**
     * Check if line indicates an addition
     */
    isAddition(line) {
        if (!line || typeof line !== 'string') return false;
        const additionKeywords = ['add', 'include', 'put', 'place', 'add in'];
        return additionKeywords.some(keyword => line.includes(keyword));
    }

    /**
     * Check if line indicates a replacement
     */
    isReplacement(line) {
        if (!line || typeof line !== 'string') return false;
        const replacementKeywords = ['replace', 'substitute', 'swap', 'change', 'instead of'];
        return replacementKeywords.some(keyword => line.includes(keyword));
    }

    /**
     * Check if line indicates a deletion
     */
    isDeletion(line) {
        if (!line || typeof line !== 'string') return false;
        const deletionKeywords = ['remove', 'delete', 'take out', 'eliminate', 'omit'];
        return deletionKeywords.some(keyword => line.includes(keyword));
    }

    /**
     * Check if line indicates a quantity modification
     */
    isQuantityModification(line) {
        if (!line || typeof line !== 'string') return false;
        const quantityKeywords = ['increase', 'decrease', 'reduce', 'more', 'less', 'change to'];
        return quantityKeywords.some(keyword => line.includes(keyword)) && 
               this.extractQuantity(line) !== null;
    }

    /**
     * Check if line indicates a new meal
     */
    isNewMeal(line) {
        if (!line || typeof line !== 'string') return false;
        const newMealKeywords = ['new meal', 'add meal', 'create meal', 'another meal'];
        return newMealKeywords.some(keyword => line.includes(keyword));
    }

    /**
     * Check if line is a food item with nutritional data
     */
    isFoodItemLine(line) {
        if (!line || typeof line !== 'string') return false;
        // Pattern: "Food Name (quantity): calories kcal | carbs C | protein P | fat F"
        const foodItemPattern = /^[^:]+\(\d+[^)]*\):\s*\d+\s*kcal/;
        return foodItemPattern.test(line);
    }

    /**
     * Parse a food item line
     */
    parseFoodItemLine(line, currentMeal = null) {
        // Extract food name and quantity from patterns like:
        // "2 Large Eggs (100g): 143 kcal | 1g C | 13g P | 10g F"
        // "Greek Yogurt (100g): 65 kcal | 3g C | 10g P | 0g F"
        
        const match = line.match(/^([^(]+)\s*\([^)]*(\d+)[^)]*\):/);
        if (!match) return null;
        
        const foodName = match[1].trim();
        const quantity = parseFloat(match[2]);
        
        // Use current meal context if available, otherwise try to determine from line
        const mealName = currentMeal || this.determineMealFromContext(line) || 'Breakfast';
        
        return {
            type: 'add',
            target_meal: mealName,
            food_name: foodName,
            quantity: quantity,
            unit: 'g',
            original_text: line,
            confidence: 0.8 // High confidence for well-formatted food items
        };
    }

    /**
     * Determine meal name from context
     */
    determineMealFromContext(line) {
        // This is a simplified approach - in practice, we'd track meal context
        // For now, we'll try to infer from common patterns
        const lowerLine = line.toLowerCase();
        
        if (lowerLine.includes('breakfast') || lowerLine.includes('morning')) {
            return 'Breakfast';
        } else if (lowerLine.includes('lunch') || lowerLine.includes('midday')) {
            return 'Lunch';
        } else if (lowerLine.includes('dinner') || lowerLine.includes('evening')) {
            return 'Dinner';
        } else if (lowerLine.includes('snack')) {
            return 'Snack';
        }
        
        return null; // Will default to 'Breakfast' in parseFoodItemLine
    }

    /**
     * Parse an addition suggestion
     */
    parseAddition(line, currentMeal = null) {
        const quantity = this.extractQuantity(line);
        const foodName = this.extractFoodName(line);
        const mealName = this.extractMealName(line) || currentMeal;
        
        if (!foodName) return null;
        
        return {
            type: 'add',
            target_meal: mealName || 'Breakfast', // Default to Breakfast if not specified
            food_name: foodName,
            quantity: quantity || 100, // Default to 100g if not specified
            unit: 'g',
            original_text: line,
            confidence: this.calculateLineConfidence(line, foodName, mealName)
        };
    }

    /**
     * Parse a replacement suggestion
     */
    parseReplacement(line, currentMeal = null) {
        const quantity = this.extractQuantity(line);
        const foodName = this.extractFoodName(line);
        const mealName = this.extractMealName(line) || currentMeal;
        const originalFood = this.extractOriginalFood(line);
        
        if (!foodName || !originalFood) return null;
        
        return {
            type: 'replace',
            target_meal: mealName || 'Breakfast',
            food_name: foodName,
            original_food: originalFood,
            quantity: quantity || 100,
            unit: 'g',
            original_text: line,
            confidence: this.calculateLineConfidence(line, foodName, mealName)
        };
    }

    /**
     * Parse a deletion suggestion
     */
    parseDeletion(line, currentMeal = null) {
        const foodName = this.extractFoodName(line);
        const mealName = this.extractMealName(line) || currentMeal;
        
        if (!foodName) return null;
        
        return {
            type: 'delete',
            target_meal: mealName || 'Breakfast',
            food_name: foodName,
            original_text: line,
            confidence: this.calculateLineConfidence(line, foodName, mealName)
        };
    }

    /**
     * Parse a quantity modification suggestion
     */
    parseQuantityModification(line, currentMeal = null) {
        const quantity = this.extractQuantity(line);
        const foodName = this.extractFoodName(line);
        const mealName = this.extractMealName(line) || currentMeal;
        
        if (!foodName || !quantity) return null;
        
        return {
            type: 'modify_quantity',
            target_meal: mealName || 'Breakfast',
            food_name: foodName,
            quantity: quantity,
            unit: 'g',
            original_text: line,
            confidence: this.calculateLineConfidence(line, foodName, mealName)
        };
    }

    /**
     * Parse a new meal suggestion
     */
    parseNewMeal(line) {
        const mealName = this.extractNewMealName(line);
        const foods = this.extractMultipleFoods(line);
        
        return {
            type: 'add_meal',
            meal_name: mealName || 'New Meal',
            foods: foods,
            original_text: line,
            confidence: 0.7 // Lower confidence for complex suggestions
        };
    }

    /**
     * Extract quantity from text
     */
    extractQuantity(text) {
        if (!text || typeof text !== 'string') {
            return null;
        }
        
        for (const pattern of this.quantityPatterns) {
            const match = text.match(pattern);
            if (match && match[2]) {
                const quantity = parseFloat(match[1]);
                const unit = match[2].toLowerCase();
                
                // Convert to grams if needed
                if (unit.includes('kg') || unit.includes('kilogram')) {
                    return quantity * 1000;
                } else if (unit.includes('oz') || unit.includes('ounce')) {
                    return quantity * 28.35; // Approximate conversion
                } else if (unit.includes('lb') || unit.includes('pound')) {
                    return quantity * 453.59; // Approximate conversion
                } else if (unit.includes('cup')) {
                    return quantity * 240; // Approximate conversion for most foods
                } else if (unit.includes('tbsp') || unit.includes('tablespoon')) {
                    return quantity * 15; // Approximate conversion
                } else if (unit.includes('tsp') || unit.includes('teaspoon')) {
                    return quantity * 5; // Approximate conversion
                } else if (unit.includes('dose') || unit.includes('serving') || unit.includes('scoop')) {
                    return quantity * 30; // Approximate conversion for protein servings
                }
                
                return quantity; // Assume grams
            }
        }
        return null;
    }

    /**
     * Extract food name from text
     */
    extractFoodName(text) {
        if (!text || typeof text !== 'string') {
            return null;
        }
        
        const lowerText = text.toLowerCase();
        
        // Look for food synonyms
        for (const [canonicalName, synonyms] of Object.entries(this.foodSynonyms)) {
            for (const synonym of synonyms) {
                if (lowerText.includes(synonym.toLowerCase())) {
                    return canonicalName;
                }
            }
        }
        
        // Try to extract food name after common keywords
        const foodKeywords = ['add', 'replace', 'remove', 'increase', 'decrease', 'with'];
        for (const keyword of foodKeywords) {
            const index = lowerText.indexOf(keyword);
            if (index !== -1) {
                const afterKeyword = text.substring(index + keyword.length).trim();
                // Extract first few words as potential food name
                const words = afterKeyword.split(/\s+/).slice(0, 3);
                return words.join(' ').replace(/[^\w\s]/g, '').trim();
            }
        }
        
        return null;
    }

    /**
     * Extract original food name for replacements
     */
    extractOriginalFood(text) {
        if (!text || typeof text !== 'string') {
            return null;
        }
        
        const lowerText = text.toLowerCase();
        
        // Look for patterns like "replace X with Y"
        const replacePatterns = [
            /replace\s+([^with]+)\s+with/gi,
            /substitute\s+([^with]+)\s+with/gi,
            /swap\s+([^with]+)\s+with/gi
        ];
        
        for (const pattern of replacePatterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1].trim().replace(/[^\w\s]/g, '');
            }
        }
        
        return null;
    }

    /**
     * Extract meal name from text
     */
    extractMealName(text) {
        if (!text || typeof text !== 'string') {
            return null;
        }
        
        const lowerText = text.toLowerCase();
        
        for (const [canonicalName, variations] of Object.entries(this.mealNames)) {
            for (const variation of variations) {
                if (lowerText.includes(variation)) {
                    return canonicalName.charAt(0).toUpperCase() + canonicalName.slice(1);
                }
            }
        }
        
        return null;
    }

    /**
     * Extract new meal name
     */
    extractNewMealName(text) {
        const newMealPatterns = [
            /add\s+(?:a\s+)?(?:new\s+)?meal[:\s]+(.+)/gi,
            /create\s+(?:a\s+)?(?:new\s+)?meal[:\s]+(.+)/gi
        ];
        
        for (const pattern of newMealPatterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1].trim().replace(/[^\w\s]/g, '');
            }
        }
        
        return null;
    }

    /**
     * Extract multiple foods from text
     */
    extractMultipleFoods(text) {
        // This is a simplified version - could be enhanced
        const foods = [];
        const foodNames = this.extractFoodName(text);
        if (foodNames) {
            foods.push({
                name: foodNames,
                quantity: this.extractQuantity(text) || 100
            });
        }
        return foods;
    }

    /**
     * Calculate confidence score for a parsed change
     */
    calculateLineConfidence(line, foodName, mealName) {
        let confidence = 0.5; // Base confidence
        
        if (foodName) confidence += 0.3;
        if (mealName) confidence += 0.2;
        if (this.extractQuantity(line)) confidence += 0.1;
        
        // Check for clear action words
        const clearActionWords = ['add', 'replace', 'remove', 'increase', 'decrease'];
        if (clearActionWords.some(word => line.toLowerCase().includes(word))) {
            confidence += 0.1;
        }
        
        return Math.min(confidence, 1.0);
    }

    /**
     * Calculate overall confidence for the parsed suggestion
     */
    calculateConfidence(changes) {
        if (changes.length === 0) return 0;
        
        const totalConfidence = changes.reduce((sum, change) => sum + change.confidence, 0);
        return totalConfidence / changes.length;
    }
}

// Export for use in other modules
window.SuggestionParser = SuggestionParser;
