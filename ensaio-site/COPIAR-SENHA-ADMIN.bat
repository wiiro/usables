@echo off
setlocal
REM Copia a senha do admin local para a area de transferencia, sem exibi-la na tela.
set "ENVF=%~dp0backend\apps\backend\.env"

if not exist "%ENVF%" (
  echo ERRO: arquivo nao encontrado: %ENVF%
  pause
  exit /b 1
)

powershell -NoProfile -Command "$l = Get-Content -LiteralPath $env:ENVF | Where-Object { $_ -like 'ADMIN_PASSWORD=*' } | Select-Object -First 1; if (-not $l) { exit 1 }; ($l -replace '^ADMIN_PASSWORD=','') | Set-Clipboard"
if errorlevel 1 (
  echo ERRO: ADMIN_PASSWORD nao encontrado no .env.
  pause
  exit /b 1
)

echo Senha copiada! Cole (Ctrl+V) no campo de senha do painel.
echo Login: admin@ensaio.local
echo Dica: depois de colar, copie outra coisa para limpar a area de transferencia.
ping -n 7 127.0.0.1 >nul
endlocal
