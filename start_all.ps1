# VEXA AI - Full Stack Launcher (Windows)
# This script starts both the Python backend and the Next.js frontend in separate windows.

Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         VEXA AI — Full Stack               ║" -ForegroundColor Cyan
Write-Host "║  FASHN v1.5 (HF Space) + Next.js Frontend  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$PROJECT_ROOT = $PSScriptRoot

# ── 1. VEXA Python backend (port 8000) ────────────────────────────────────────
Write-Host "⚙️  Starting VEXA Backend (port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PROJECT_ROOT\backend'; if (Test-Path '.venv\Scripts\Activate.ps1') { .\.venv\Scripts\Activate.ps1 }; uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

# ── 2. Next.js frontend (port 4028) ───────────────────────────────────────────
Write-Host "🌐 Starting Next.js Frontend (port 4028)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PROJECT_ROOT\frontend'; npm run dev"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Services starting in separate windows      ║" -ForegroundColor Cyan
Write-Host "║                                              ║" -ForegroundColor Cyan
Write-Host "║  VEXA Backend:  http://localhost:8000        ║" -ForegroundColor Cyan
Write-Host "║  VEXA App:      http://localhost:4028        ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Health checks:"
Write-Host "  curl http://localhost:8000/health"
Write-Host "  curl http://localhost:4028"
Write-Host ""
Write-Host "Note: Virtual try-on is powered by FASHN v1.5 on HuggingFace Spaces."
