@echo off
rem ===========================================================================
rem  Guia de Tarefas - launcher
rem  Duplo clique para abrir. Serve a pasta deste arquivo (%~dp0) em
rem  http://localhost:PORT e abre o navegador padrao.
rem  Porta opcional:  abrir.cmd 8899
rem ===========================================================================
setlocal
chcp 65001 >nul
pushd "%~dp0"

set "PORT=%~1"
if "%PORT%"=="" set "PORT=8778"
set "URL=http://localhost:%PORT%/"

rem Porta ja escutando? O servidor ja esta no ar - so abre o navegador.
netstat -ano | findstr /c:"127.0.0.1:%PORT% " | findstr /c:"LISTENING" >nul 2>&1
if not errorlevel 1 (
  echo Servidor ja estava rodando. Abrindo %URL%
  start "" %URL%
  popd
  exit /b 0
)

rem Abre o navegador 2s depois, quando o servidor ja subiu.
start "" /min cmd /c "timeout /t 2 /nobreak >nul && start "" %URL%"

echo.
echo   Guia de Tarefas  --  %URL%
echo   Feche esta janela para parar o servidor.
echo.

rem _serve.py / _serve.js sao usados no lugar de "python -m http.server"
rem porque enviam Cache-Control: no-store - sem isso o navegador reusa o
rem state.js de um documento em outro servido na mesma porta.
where py >nul 2>&1
if not errorlevel 1 (
  py -3 "%~dp0_serve.py" %PORT%
  goto :fim
)

where python >nul 2>&1
if not errorlevel 1 (
  python "%~dp0_serve.py" %PORT%
  goto :fim
)

where node >nul 2>&1
if not errorlevel 1 (
  node "%~dp0_serve.js" %PORT%
  goto :fim
)

echo ERRO: nao encontrei Python nem Node.js nesta maquina.
echo Instale um dos dois e execute este arquivo novamente.
pause

:fim
popd
endlocal
