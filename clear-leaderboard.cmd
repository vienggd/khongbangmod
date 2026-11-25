@echo off
rem Empty the village leaderboard. Closes the village first; a backup copy is kept in server\data.
cd /d "%~dp0"
call "%~dp0close-village.cmd"
if exist server\data\board.json copy /y server\data\board.json server\data\board-backup.json >nul
echo {}> server\data\board.json
echo Leaderboard cleared. Double-click host-village.cmd to open the village again.
pause
