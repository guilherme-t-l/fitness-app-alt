# Nutritionist Co-Pilot App

You’re building a **nutritionist co-pilot app** — an AI-powered assistant designed to make creating and adjusting meal plans faster, easier, and more accurate.

---

## How It Works (Plain Words)

1. A nutritionist starts by either:
   - creating a meal plan from scratch, or  
   - uploading one they already use (in text format directly in the chat).
2. If the client doesn’t like a food, the assistant instantly suggests **smart substitutes** that taste similar and keep the nutritional balance (carbs, protein, fat) almost the same.
3. Every time a change is made, the app **automatically recalculates the macros** for the entire plan, removing the need for manual math or spreadsheet updates.
4. The end result: the nutritionist spends less time crunching numbers and searching for alternatives, and more time actually guiding the client and building trust.

---

## What We Need

- A **chat panel** on the left; with the **plan on the right**.  
- The plan must be **editable** both by the agent and the nutritionist.  
- A system to **calculate the macronutrients**:
  - **Food level** (per item)  
  - **Meal level** (per meal)  
  - **Day level** (total daily intake)  
- Macros to compute: **carbs, fats, proteins, and kcal**.  

---

## In Short

It’s like having a **tireless junior nutritionist** who:
- Instantly finds balanced food swaps  
- Does all the macro math for you  
- Remembers each client’s needs  

---

## Refined Pains You’re Solving

1. **Time-consuming meal plan adjustments**  
   - Nutritionists and clients spend significant time manually adapting diets when clients dislike certain foods or have restrictions.

2. **Difficulty maintaining nutritional balance when swapping foods**  
   - Replacing a food without breaking the macro balance (carbs, fats, proteins) is tricky and requires quick calculations.

3. **Tedious macronutrient calculations**  
   - Manually tracking macros for every change is error-prone and eats into valuable time.

4. **Limited creativity in substitutions**  
   - Without quick access to alternative ingredients that match both taste and nutrition, plans can become repetitive or boring for clients.  

---

## Agent Differentiators (How It Solves the Pains)

- **Smart Food Substitution Engine**  
  Instantly suggests multiple substitutes for any food, preserving the original macro profile within a small tolerance (e.g., ±5%).

- **Automated Macro Recalculation**  
  Every substitution or change triggers an instant macro re-computation — no manual math needed.

- **Contextual Creativity**  
  Offers swaps that aren’t just nutritionally similar, but also:
  - culturally appropriate  
  - seasonal  
  - budget-conscious  
  - tailored to user preferences
