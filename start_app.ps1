Write-Host "====================================================================" -ForegroundColor Green
Write-Host "Starting Sharadha Stores Batch Inventory Tracker..." -ForegroundColor Green
Write-Host "====================================================================" -ForegroundColor Green

Write-Host "Launching Flask Backend on port 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python app.py"

Write-Host "Launching Vite React Frontend on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Both servers started in separate PowerShell windows!" -ForegroundColor Cyan
Write-Host "Open http://localhost:5173 to interact with the application." -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Green
