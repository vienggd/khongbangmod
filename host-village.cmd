@echo off
rem Host the Klong Bang Mot village on this PC and share it through Tailscale Funnel (https, port 8443).
rem Double-click to start. Close this window (or press Ctrl+C) to stop hosting.
cd /d "%~dp0"
if not exist server\node_modules\ws (
  echo Installing server package...
  pushd server && call npm install --no-audit --no-fund && popd
)
"C:\Program Files\Tailscale\tailscale.exe" funnel --bg --https=8443 http://127.0.0.1:8095
echo.
echo ================================================================
echo  Share this link with friends (phone, tablet or PC):
"C:\Program Files\Tailscale\tailscale.exe" funnel status | findstr /c:":8443"
echo ================================================================
echo.
node server\server.js
