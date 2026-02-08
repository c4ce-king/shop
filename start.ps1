$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd `"$root\backend`"; php artisan serve --host=127.0.0.1 --port=8000"
)

Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd `"$root\frontend`"; npm run dev"
)

Write-Host "Started backend (8000) and frontend (3000)."
