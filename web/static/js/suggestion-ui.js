/**
 * Suggestion UI
 * Renders AI suggestions with apply buttons and handles user interactions
 */

class SuggestionUI {
    constructor(parser, applier, mealPlanManager) {
        this.parser = parser;
        this.applier = applier;
        this.mealPlanManager = mealPlanManager;
        this.activeSuggestions = new Map(); // Track active suggestions by ID
        this.suggestionCounter = 0;
    }

    /**
     * Render AI suggestions in the meal plan panel
     * @param {string} suggestionText - Raw AI suggestion text
     * @param {string} chatMessage - The chat message that triggered this suggestion
     */
    renderSuggestions(suggestionText, chatMessage = '') {
        // Parse the suggestion
        const parsedSuggestion = this.parser.parseSuggestion(suggestionText);
        
        if (parsedSuggestion.changes.length === 0) {
            console.warn('No parseable changes found in suggestion');
            return null;
        }

        // Generate unique ID for this suggestion
        const suggestionId = `suggestion_${++this.suggestionCounter}`;
        
        // Create suggestion container
        const suggestionContainer = this.createSuggestionContainer(suggestionId, parsedSuggestion, chatMessage);
        
        // Store active suggestion
        this.activeSuggestions.set(suggestionId, {
            parsedSuggestion,
            chatMessage,
            container: suggestionContainer,
            appliedChanges: new Set()
        });
        
        // Insert into meal plan panel
        this.insertSuggestionIntoMealPlan(suggestionContainer);
        
        return suggestionId;
    }

    /**
     * Create the main suggestion container
     */
    createSuggestionContainer(suggestionId, parsedSuggestion, chatMessage) {
        const container = document.createElement('div');
        container.className = 'ai-suggestion-container';
        container.setAttribute('data-suggestion-id', suggestionId);
        
        const hasMultipleChanges = parsedSuggestion.changes.length > 1;
        const changesListHTML = this.renderChangesList(parsedSuggestion.changes, suggestionId);
        
        container.innerHTML = `
            <div class="ai-suggestion-header">
                <div class="ai-suggestion-title">
                    <span class="ai-icon">🤖</span>
                    <span class="ai-title">AI Suggestions</span>
                    <span class="confidence-badge" style="
                        background: ${this.getConfidenceColor(parsedSuggestion.confidence)};
                        color: white;
                        padding: 2px 8px;
                        border-radius: 12px;
                        font-size: 12px;
                        margin-left: 8px;
                    ">${Math.round(parsedSuggestion.confidence * 100)}% confidence</span>
                </div>
                ${chatMessage ? `<div class="ai-suggestion-trigger">"${chatMessage}"</div>` : ''}
            </div>
            
            <div class="ai-suggestion-content">
                ${changesListHTML}
            </div>
            
            <div class="ai-suggestion-actions">
                ${hasMultipleChanges ? `
                    <button class="btn-apply-all" onclick="suggestionUI.applyAllChanges('${suggestionId}')" style="
                        background: linear-gradient(135deg, #28a745, #20c997);
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        margin-right: 10px;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(40, 167, 69, 0.3)'"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                        ✅ Apply All Changes
                    </button>
                ` : ''}
                
                <button class="btn-dismiss" onclick="suggestionUI.dismissSuggestion('${suggestionId}')" style="
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                " onmouseover="this.style.background='#5a6268'"
                onmouseout="this.style.background='#6c757d'">
                    ❌ Dismiss
                </button>
            </div>
        `;
        
        return container;
    }

    /**
     * Render the list of changes
     */
    renderChangesList(changes, suggestionId) {
        const html = changes.map((change, index) => {
            return `
            <div class="ai-change-item" data-change-index="${index}" style="
                display: flex;
                align-items: center;
                padding: 12px;
                margin: 8px 0;
                background: #f8f9fa;
                border-radius: 8px;
                border-left: 4px solid ${this.getChangeTypeColor(change.type)};
                transition: all 0.2s ease;
            ">
                <div class="change-icon" style="
                    font-size: 20px;
                    margin-right: 12px;
                    min-width: 24px;
                ">${this.getChangeTypeIcon(change.type)}</div>
                
                <div class="change-content" style="flex: 1;">
                    <div class="change-description" style="
                        font-weight: 500;
                        color: #333;
                        margin-bottom: 4px;
                    ">${this.formatChangeDescription(change)}</div>
                    
                    <div class="change-details" style="
                        font-size: 12px;
                        color: #666;
                    ">${this.formatChangeDetails(change)}</div>
                </div>
                
                <div class="change-actions" style="margin-left: 12px;">
                    <button class="btn-apply-single" onclick="suggestionUI.applySingleChange('${suggestionId}', ${index})" style="
                        background: #007bff;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-size: 12px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    " onmouseover="this.style.background='#0056b3'; this.style.transform='translateY(-1px)'"
                    onmouseout="this.style.background='#007bff'; this.style.transform='translateY(0)'">
                        Apply
                    </button>
                </div>
            </div>
        `;
        }).join('');
        
        return html;
    }

    /**
     * Apply a single change
     */
    async applySingleChange(suggestionId, changeIndex) {
        const suggestion = this.activeSuggestions.get(suggestionId);
        if (!suggestion) return;
        
        const change = suggestion.parsedSuggestion.changes[changeIndex];
        if (!change) return;
        
        // Disable the button and show loading
        const button = document.querySelector(`[data-suggestion-id="${suggestionId}"] [data-change-index="${changeIndex}"] .btn-apply-single`);
        if (button) {
            button.disabled = true;
            button.textContent = 'Applying...';
            button.style.background = '#6c757d';
        }
        
        try {
            const result = await this.applier.applyChange(change);
            
            if (result.success) {
                // Mark change as applied
                suggestion.appliedChanges.add(changeIndex);
                
                // Update button to show success
                if (button) {
                    button.textContent = '✅ Applied';
                    button.style.background = '#28a745';
                    button.disabled = true;
                }
                
                // Show success message
                this.showSuccessMessage(result.message);
                
                // Reload meal plan to show changes
                await this.mealPlanManager.reloadMealPlan();
                
            } else {
                // Show error message
                this.showErrorMessage(result.message);
                
                // Reset button
                if (button) {
                    button.disabled = false;
                    button.textContent = 'Apply';
                    button.style.background = '#007bff';
                }
            }
        } catch (error) {
            console.error('Error applying change:', error);
            this.showErrorMessage(`Failed to apply change: ${error.message}`);
            
            // Reset button
            if (button) {
                button.disabled = false;
                button.textContent = 'Apply';
                button.style.background = '#007bff';
            }
        }
    }

    /**
     * Apply all changes in a suggestion
     */
    async applyAllChanges(suggestionId) {
        const suggestion = this.activeSuggestions.get(suggestionId);
        if (!suggestion) return;
        
        const button = document.querySelector(`[data-suggestion-id="${suggestionId}"] .btn-apply-all`);
        if (button) {
            button.disabled = true;
            button.textContent = 'Applying All...';
            button.style.background = '#6c757d';
        }
        
        try {
            const result = await this.applier.applyMultipleChanges(suggestion.parsedSuggestion.changes);
            
            if (result.success) {
                // Mark all changes as applied
                suggestion.parsedSuggestion.changes.forEach((_, index) => {
                    suggestion.appliedChanges.add(index);
                });
                
                // Update all buttons
                suggestion.parsedSuggestion.changes.forEach((_, index) => {
                    const changeButton = document.querySelector(`[data-suggestion-id="${suggestionId}"] [data-change-index="${index}"] .btn-apply-single`);
                    if (changeButton) {
                        changeButton.textContent = '✅ Applied';
                        changeButton.style.background = '#28a745';
                        changeButton.disabled = true;
                    }
                });
                
                // Update main button
                if (button) {
                    button.textContent = '✅ All Applied';
                    button.style.background = '#28a745';
                }
                
                // Show success message
                this.showSuccessMessage(result.message);
                
                // Reload meal plan to show changes
                await this.mealPlanManager.reloadMealPlan();
                
            } else {
                // Show error message
                this.showErrorMessage(result.message);
                
                // Reset button
                if (button) {
                    button.disabled = false;
                    button.textContent = '✅ Apply All Changes';
                    button.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
                }
            }
        } catch (error) {
            console.error('Error applying all changes:', error);
            this.showErrorMessage(`Failed to apply changes: ${error.message}`);
            
            // Reset button
            if (button) {
                button.disabled = false;
                button.textContent = '✅ Apply All Changes';
                button.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
            }
        }
    }

    /**
     * Dismiss a suggestion
     */
    dismissSuggestion(suggestionId) {
        const suggestion = this.activeSuggestions.get(suggestionId);
        if (!suggestion) return;
        
        // Remove from DOM
        if (suggestion.container && suggestion.container.parentNode) {
            suggestion.container.parentNode.removeChild(suggestion.container);
        }
        
        // Remove from active suggestions
        this.activeSuggestions.delete(suggestionId);
    }

    /**
     * Insert suggestion into meal plan panel
     */
    insertSuggestionIntoMealPlan(container) {
        const mealsContainer = document.getElementById('mealsContainer');
        if (mealsContainer) {
            // Insert at the top of the meals container
            mealsContainer.insertBefore(container, mealsContainer.firstChild);
            
            // Scroll to show the suggestion
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /**
     * Format change description for display
     */
    formatChangeDescription(change) {
        switch (change.type) {
            case 'add':
                return `Add ${change.quantity}g ${change.food_name} to ${change.target_meal}`;
            case 'replace':
                return `Replace ${change.original_food} with ${change.food_name} in ${change.target_meal}`;
            case 'delete':
                return `Remove ${change.food_name} from ${change.target_meal}`;
            case 'modify_quantity':
                return `Change ${change.food_name} quantity to ${change.quantity}g in ${change.target_meal}`;
            case 'add_meal':
                return `Add new meal: ${change.meal_name}`;
            default:
                return change.original_text;
        }
    }

    /**
     * Format change details for display
     */
    formatChangeDetails(change) {
        const details = [];
        
        if (change.confidence) {
            details.push(`Confidence: ${Math.round(change.confidence * 100)}%`);
        }
        
        if (change.unit && change.quantity) {
            details.push(`Quantity: ${change.quantity}${change.unit}`);
        }
        
        return details.join(' • ');
    }

    /**
     * Get change type icon
     */
    getChangeTypeIcon(type) {
        const icons = {
            'add': '➕',
            'replace': '🔄',
            'delete': '🗑️',
            'modify_quantity': '📊',
            'add_meal': '🍽️'
        };
        return icons[type] || '📝';
    }

    /**
     * Get change type color
     */
    getChangeTypeColor(type) {
        const colors = {
            'add': '#28a745',
            'replace': '#ffc107',
            'delete': '#dc3545',
            'modify_quantity': '#17a2b8',
            'add_meal': '#6f42c1'
        };
        return colors[type] || '#6c757d';
    }

    /**
     * Get confidence color
     */
    getConfidenceColor(confidence) {
        if (confidence >= 0.8) return '#28a745';
        if (confidence >= 0.6) return '#ffc107';
        return '#dc3545';
    }

    /**
     * Show success message
     */
    showSuccessMessage(message) {
        this.mealPlanManager.showSuccess(message);
    }

    /**
     * Show error message
     */
    showErrorMessage(message) {
        this.mealPlanManager.showError(message);
    }

    /**
     * Clear all suggestions
     */
    clearAllSuggestions() {
        this.activeSuggestions.forEach((suggestion, id) => {
            this.dismissSuggestion(id);
        });
    }

    /**
     * Get active suggestions count
     */
    getActiveSuggestionsCount() {
        return this.activeSuggestions.size;
    }

    /**
     * Undo the last change
     */
    async undoLastChange() {
        try {
            const result = await this.applier.undoLastChange();
            if (result.success) {
                this.showSuccessMessage(result.message);
                await this.mealPlanManager.reloadMealPlan();
                this.updateUndoControls();
            }
        } catch (error) {
            this.showErrorMessage(`Failed to undo: ${error.message}`);
        }
    }

    /**
     * Undo all changes
     */
    async undoAllChanges() {
        try {
            const undoCount = this.applier.getUndoStackLength();
            for (let i = 0; i < undoCount; i++) {
                await this.applier.undoLastChange();
            }
            this.showSuccessMessage(`Undid ${undoCount} changes`);
            await this.mealPlanManager.reloadMealPlan();
            this.updateUndoControls();
        } catch (error) {
            this.showErrorMessage(`Failed to undo all changes: ${error.message}`);
        }
    }

    /**
     * Clear undo history
     */
    clearHistory() {
        this.applier.clearHistory();
        this.updateUndoControls();
        this.showSuccessMessage('Undo history cleared');
    }

    /**
     * Update undo controls visibility
     */
    updateUndoControls() {
        const undoControls = document.getElementById('undoControls');
        if (undoControls) {
            const hasChanges = this.applier.getUndoStackLength() > 0;
            if (hasChanges) {
                undoControls.classList.remove('hidden');
            } else {
                undoControls.classList.add('hidden');
            }
        }
    }
}

// Export for use in other modules
window.SuggestionUI = SuggestionUI;
