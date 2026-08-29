@echo off
REM ============================================================================
REM AQUA FARMING - Render.com Quick Deploy Script (Windows)
REM ============================================================================
REM This script automates deployment to Render.com
REM Prerequisites: Git, GitHub account, Render.com account

echo.
echo ============================================
echo AQUA FARMING - Render Deployment Script
echo ============================================
echo.

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git not found. Install from https://git-scm.com/
    pause
    exit /b 1
)
echo OK: Git found

REM Initialize Git if needed
if not exist ".git" (
    echo.
    echo Initializing Git repository...
    git init
    git add .
    git commit -m "Initial AQUA Farming deployment"
)

REM Check for .env file
echo.
if not exist ".env" (
    echo WARNING: .env file not found!
    echo Creating .env from template...
    copy .env.example .env
    echo.
    echo OK: .env created. Please edit it with your values:
    echo  - MONGODB_URI (from MongoDB Atlas)
    echo  - JWT_SECRET (random secret)
    echo.
    echo Edit .env then run this script again.
    pause
    exit /b 1
)
echo OK: .env file found

REM Check for local MongoDB
findstr /R "mongodb://127.0.0.1" .env >nul
if %errorlevel% equ 0 (
    echo.
    echo WARNING: Local MongoDB URL detected in .env
    echo For production, use MongoDB Atlas:
    echo  1. Go to https://www.mongodb.com/cloud/atlas
    echo  2. Create account and database
    echo  3. Get connection string
    echo  4. Update MONGODB_URI in .env
    echo.
    set /p "continue=Continue anyway? (y/n) "
    if /i not "%continue%"=="y" (
        exit /b 1
    )
)

REM Check Git status
echo.
echo Checking Git status...
git status --porcelain | findstr . >nul
if %errorlevel% equ 0 (
    echo.
    echo Uncommitted changes found
    set /p "commit=Commit changes? (y/n) "
    if /i "%commit%"=="y" (
        git add .
        git commit -m "Production deployment updates"
    )
)

REM Display Instructions
echo.
echo ============================================
echo DEPLOYMENT INSTRUCTIONS FOR RENDER.COM
echo ============================================
echo.
echo 1. Push this repository to GitHub:
echo    git push origin main
echo.
echo 2. Go to https://render.com and sign in
echo.
echo 3. Click "New +" / "Web Service"
echo.
echo 4. Connect GitHub repository
echo.
echo 5. Configure Web Service:
echo    Name: aqua-farming-prod
echo    Environment: Node
echo    Build Command: npm install
echo    Start Command: npm start
echo    Instance: Free
echo.
echo 6. Add Environment Variables from your .env:
echo    NODE_ENV = production
echo    PORT = 5000
echo    JWT_SECRET = (from .env)
echo    MONGODB_URI = (from .env)
echo    CORS_ORIGINS = https://aqua-farming-prod.onrender.com
echo.
echo 7. Click "Create Web Service"
echo.
echo 8. Render will deploy automatically
echo.
echo 9. Access your app at: https://aqua-farming-prod.onrender.com
echo.
echo 10. Test login:
echo     Username: admin
echo     Password: admin@123
echo.
echo ============================================
echo OK: Ready to deploy!
echo ============================================
echo.
pause
