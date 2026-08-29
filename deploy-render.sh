#!/bin/bash
# ============================================================================
# AQUA FARMING - Render.com Quick Deploy Script
# ============================================================================
# This script automates deployment to Render.com
# Prerequisites: Git, GitHub account, Render.com account

echo "=============================================="
echo "AQUA FARMING - Render Deployment Script"
echo "=============================================="

# Step 1: Check Prerequisites
echo ""
echo "✓ Checking prerequisites..."
if ! command -v git &> /dev/null; then
    echo "❌ Git not found. Install from https://git-scm.com/"
    exit 1
fi
echo "✓ Git found"

# Step 2: Initialize Git if needed
if [ ! -d ".git" ]; then
    echo ""
    echo "✓ Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial AQUA Farming deployment"
fi

# Step 3: Verify .env file
echo ""
if [ ! -f ".env" ]; then
    echo "⚠ .env file not found!"
    echo "Creating .env from template..."
    cp .env.example .env
    echo "✓ .env created. Please edit it with your values:"
    echo "  - MONGODB_URI (from MongoDB Atlas)"
    echo "  - JWT_SECRET (random secret)"
    echo ""
    echo "Edit .env then run this script again."
    exit 1
fi
echo "✓ .env file found"

# Step 4: Verify MongoDB URI
if grep -q "mongodb://127.0.0.1" .env; then
    echo "⚠ WARNING: Local MongoDB URL detected in .env"
    echo "For production, use MongoDB Atlas:"
    echo "  1. Go to https://www.mongodb.com/cloud/atlas"
    echo "  2. Create account and database"
    echo "  3. Get connection string"
    echo "  4. Update MONGODB_URI in .env"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 5: Check for uncommitted changes
echo ""
echo "✓ Checking Git status..."
if ! git diff-index --quiet HEAD --; then
    echo "⚠ Uncommitted changes found"
    git add .
    read -p "Commit changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git commit -m "Production deployment updates"
    fi
fi

# Step 6: Display Deployment Instructions
echo ""
echo "=============================================="
echo "DEPLOYMENT INSTRUCTIONS FOR RENDER.COM"
echo "=============================================="
echo ""
echo "1. Push this repository to GitHub:"
echo "   git push origin main"
echo ""
echo "2. Go to https://render.com and sign in"
echo ""
echo "3. Click 'New +' → 'Web Service'"
echo ""
echo "4. Connect GitHub repository"
echo ""
echo "5. Configure Web Service:"
echo "   Name: aqua-farming-prod"
echo "   Environment: Node"
echo "   Build Command: npm install"
echo "   Start Command: npm start"
echo "   Instance: Free"
echo ""
echo "6. Add Environment Variables:"
echo "   NODE_ENV = production"
echo "   PORT = 5000"

# Display env variables from .env
echo "   JWT_SECRET = $(grep JWT_SECRET .env | cut -d '=' -f2 | xargs)"
echo "   MONGODB_URI = $(grep MONGODB_URI .env | cut -d '=' -f2 | xargs)"
echo "   CORS_ORIGINS = https://aqua-farming-prod.onrender.com"
echo ""
echo "7. Click 'Create Web Service'"
echo ""
echo "8. Render will deploy automatically"
echo ""
echo "9. Access your app at: https://aqua-farming-prod.onrender.com"
echo ""
echo "10. Test login:"
echo "    Username: admin"
echo "    Password: admin@123"
echo ""
echo "=============================================="
echo "✅ Ready to deploy!"
echo "=============================================="
