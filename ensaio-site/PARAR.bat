@echo off
setlocal
REM Encerra o site (porta 3000) e o backend (porta 9000) e fecha as janelas deles.

echo Encerrando ensaio...

for %%P in (3000 9000) do (
  for /f "tokens=5" %%I in ('netstat -ano ^| findstr ":%%P " ^| findstr "LISTENING"') do (
    taskkill /PID %%I /T /F >nul 2>&1
  )
)
taskkill /FI "WINDOWTITLE eq ensaio-backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq ensaio-site*" /T /F >nul 2>&1

echo Pronto. O PostgreSQL continua rodando (e um servico do Windows).
ping -n 5 127.0.0.1 >nul
endlocal
