@echo off
rem Stop hosting the village (closes the host window). The link stays the same for next time.
powershell -NoProfile -Command "$c = Get-NetTCPConnection -LocalPort 8095 -State Listen -ErrorAction SilentlyContinue; if (-not $c) { 'Village is already closed.'; exit }; $p = Get-CimInstance Win32_Process -Filter \"ProcessId=$($c.OwningProcess)\"; Stop-Process -Id $p.ProcessId -Force; $w = Get-CimInstance Win32_Process -Filter \"ProcessId=$($p.ParentProcessId)\"; if ($w.CommandLine -like '*host-village*') { Stop-Process -Id $w.ProcessId -Force }; 'Village closed.'"
timeout /t 3 >nul
