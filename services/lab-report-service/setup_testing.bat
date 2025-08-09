@echo off
echo 🚀 Setting up MediLink Lab Report Service for Testing
echo ===============================================

echo.
echo 📦 Installing dependencies...
npm install

echo.
echo 🗄️ Running database migration...
npm run migration:run

echo.
echo 📊 Checking migration status...
npm run migration:show

echo.
echo 🌱 Running database seeds (if available)...
npm run seed || echo "No seed script found, skipping..."

echo.
echo ✅ Setup complete! You can now:
echo    1. Import the Postman collection: MediLink_Lab_Report_Dynamic_Parser.postman_collection.json
echo    2. Run the Python test script: python test_dynamic_parser.py
echo    3. Start the server: npm run dev
echo    4. Test the API endpoints using the provided test data

echo.
echo 📋 Quick Start Commands:
echo    npm run dev                    - Start the development server
echo    python test_dynamic_parser.py  - Test the dynamic parser system
echo    npm run migration:revert       - Revert the last migration (if needed)

pause
