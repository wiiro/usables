@echo off
setlocal EnableExtensions
REM Sobe backend (Medusa) e site (Next.js) para teste local e abre o navegador.
REM Mensagens sem acento de proposito (compatibilidade com o console do Windows).
REM Cada passo tambem e gravado em iniciar.log (ao lado deste arquivo).

set "RAIZ=%~dp0"
if "%RAIZ:~-1%"=="\" set "RAIZ=%RAIZ:~0,-1%"
set "LOG=%RAIZ%\iniciar.log"
set "SWC_NATIVE_BINDING_CACHE=%USERPROFILE%\.swc-cache"
set "MEDUSA_DISABLE_TELEMETRY=1"

echo ==== %DATE% %TIME% ==== > "%LOG%"
echo.
echo === ensaio: iniciando ambiente de teste ===
echo.

call :msg "[1/4] Verificando PostgreSQL..."
sc query postgresql-x64-17 | find "RUNNING" >nul
if errorlevel 1 (
  call :msg "ERRO: o servico PostgreSQL postgresql-x64-17 nao esta rodando."
  echo Abra o app "Servicos" do Windows, clique com o botao direito em
  echo "postgresql-x64-17" e escolha "Iniciar". Depois rode este arquivo de novo.
  goto falha
)
call :msg "      PostgreSQL ok."

call :msg "[2/4] Iniciando backend (Medusa) e site (Next.js)..."
call :porta_ocupada 9000
if not errorlevel 1 (
  call :msg "      Backend ja estava rodando."
) else (
  call :msg "      Abrindo janela ensaio-backend..."
  start "ensaio-backend" /D "%RAIZ%\backend\apps\backend" cmd /k npx medusa develop
)
call :porta_ocupada 3000
if not errorlevel 1 (
  call :msg "      Site ja estava rodando."
) else (
  call :msg "      Abrindo janela ensaio-site..."
  start "ensaio-site" /D "%RAIZ%" cmd /k npm run dev
)

call :msg "[3/4] Aguardando o backend (ate 3 minutos)..."
set /a TENTATIVAS=0
:espera_backend
curl -s -o nul http://localhost:9000/health
if not errorlevel 1 goto backend_ok
set /a TENTATIVAS+=1
if %TENTATIVAS% GEQ 60 (
  call :msg "ERRO: o backend nao respondeu em 3 minutos. Veja a janela ensaio-backend."
  goto falha
)
ping -n 4 127.0.0.1 >nul
goto espera_backend
:backend_ok
call :msg "      Backend ok: http://localhost:9000"

call :msg "      Aguardando o site (ate 3 minutos)..."
set /a TENTATIVAS=0
:espera_site
curl -s -o nul http://localhost:3000
if not errorlevel 1 goto site_ok
set /a TENTATIVAS+=1
if %TENTATIVAS% GEQ 60 (
  call :msg "ERRO: o site nao respondeu em 3 minutos. Veja a janela ensaio-site."
  goto falha
)
ping -n 4 127.0.0.1 >nul
goto espera_site
:site_ok
call :msg "      Site ok: http://localhost:3000"

call :msg "[4/4] Abrindo o navegador..."
start "" "http://localhost:3000"
start "" "http://localhost:9000/app"

echo.
echo Pronto!
echo   SITE (loja): http://localhost:3000
echo   PAINEL:      http://localhost:9000/app   (login: admin@ensaio.local)
echo   Senha do painel: rode COPIAR-SENHA-ADMIN.bat e cole no campo de senha.
echo   Para encerrar tudo: rode PARAR.bat
echo.
ping -n 11 127.0.0.1 >nul
endlocal
exit /b 0

:falha
echo.
echo O ambiente NAO subiu por completo. Detalhes em: %LOG%
echo.
pause
endlocal
exit /b 1

:msg
echo %~1
echo %~1>> "%LOG%"
exit /b 0

:porta_ocupada
netstat -ano | findstr /R /C:":%~1 .*LISTENING" >nul
exit /b %errorlevel%
