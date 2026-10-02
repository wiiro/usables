@echo off
rem ===========================================================================
rem  Rotinas e Metodos - launcher
rem  Duplo clique para abrir. Serve o app compilado (pasta dist) em
rem  http://localhost:8790 e abre o navegador padrao.
rem
rem  A porta e fixa de proposito: os dados ficam no navegador, presos ao
rem  endereco. Abrir em outra porta mostraria o app vazio.
rem ===========================================================================
setlocal
chcp 65001 >nul
pushd "%~dp0"

set "PORT=8790"
set "URL=http://localhost:%PORT%/"

where node >nul 2>&1
if errorlevel 1 (
  echo ERRO: Node.js nao encontrado nesta maquina.
  echo Instale o Node.js e execute este arquivo novamente.
  pause
  goto :fim
)

rem Porta ja escutando? O servidor ja esta no ar - so abre o navegador.
netstat -ano | findstr /c:"127.0.0.1:%PORT% " | findstr /c:"LISTENING" >nul 2>&1
if not errorlevel 1 (
  echo Servidor ja estava rodando. Abrindo %URL%
  start "" %URL%
  goto :fim
)

rem Primeira vez, ou pasta dist apagada: instala dependencias e compila.
if not exist "dist\index.html" (
  call :preparar
  if errorlevel 1 goto :erro
)

rem Abre o navegador 2s depois, quando o servidor ja subiu.
start "" /min cmd /c "timeout /t 2 /nobreak >nul && start "" %URL%"

echo.
echo   Rotinas e Metodos  --  %URL%
echo   Feche esta janela para parar o servidor.
echo.
node "%~dp0serve.js" %PORT%
goto :fim

:preparar
if not exist "node_modules\" (
  echo Instalando dependencias - so na primeira vez...
  call npm install
  if errorlevel 1 exit /b 1
)
echo Compilando o app...
call npm run build
exit /b %errorlevel%

:erro
echo.
echo ERRO: a preparacao falhou. Veja as mensagens acima.
pause

:fim
popd
endlocal
