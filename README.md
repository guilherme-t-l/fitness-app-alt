# Nutritionist Co-Pilot App

An AI-powered assistant that helps nutritionists create and modify meal plans through natural conversation. The AI understands nutrition context and can suggest food substitutions while maintaining macro balance.

## How It Works

1. **User chats** with an AI nutritionist in the left panel
2. **AI responds** with both chat messages and meal plan updates
3. **Meal plan panel** on the right updates automatically
4. **AI can suggest** food substitutions, dietary adjustments, and macro modifications

## Project Structure

```
fitness-app-alt/
├── web/                           # Main application
│   ├── app.py                    # 🔧 Flask server & API endpoints
│   ├── nutritionist_system_prompt.txt  # 🔧 AI personality/instructions
│   └── templates/
│       └── index.html            # 🔧 Frontend UI (chat + meal plan panels)
├── llm_wrapper/                   # AI provider abstraction
│   ├── core.py                   # 🔧 Main AI wrapper logic
│   ├── config.py                 # 🔧 Configuration management
│   └── providers/                # 🔧 AI providers (OpenAI, Anthropic)
├── requirements.txt              # Python dependencies
└── deploy.sh                     # Deployment script
```

## Key Files to Edit for Development

### **Frontend Changes**
- `web/templates/index.html` - UI layout, styling, chat interface

### **Backend Changes**
- `web/app.py` - API endpoints, meal plan logic, chat handling
- `web/nutritionist_system_prompt.txt` - AI behavior and responses

### **AI Provider Changes**
- `llm_wrapper/core.py` - Main AI wrapper functionality
- `llm_wrapper/providers/` - Add new AI providers or modify existing ones

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set API key:**
   ```bash
   export ANTHROPIC_API_KEY="your-api-key-here"
   ```

3. **Run the app:**
   ```bash
   python web/app.py
   ```

4. **Open browser:** `http://localhost:5000`

## Example Usage

- **"Replace chicken with a vegetarian option"** → AI suggests tofu/tempeh + updates meal plan
- **"Make this dairy-free"** → AI identifies dairy items and suggests alternatives
- **"Increase protein for muscle building"** → AI recommends protein-rich additions
