@echo off
echo ====================================================================
echo Starting Sharadha Stores Batch Inventory Tracker Application...
echo ====================================================================

echo Starting Python Flask API Server in a new window...
start cmd /k "cd backend && python app.py"

echo Starting React Vite Dev Server in a new window...
start cmd /k "cd frontend && npm run dev"

echo ====================================================================
echo Application servers are launching.
echo Backend URL: http://127.0.0.1:5000
echo Frontend URL: http://localhost:5173
echo ====================================================================
pause
