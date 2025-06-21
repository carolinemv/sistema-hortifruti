@echo off
echo 🚀 Instalando Hortifruti PDV...
echo.

REM Verificar se Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python não encontrado. Por favor, instale o Python 3.8 ou superior.
    pause
    exit /b 1
)

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js não encontrado. Por favor, instale o Node.js 16 ou superior.
    pause
    exit /b 1
)

echo ✅ Dependências básicas verificadas
echo.

REM Configurar Backend
echo 🔧 Configurando Backend...
cd backend

REM Criar ambiente virtual
if not exist "venv" (
    echo    Criando ambiente virtual...
    python -m venv venv
)

REM Ativar ambiente virtual
echo    Ativando ambiente virtual...
call venv\Scripts\activate.bat

REM Instalar dependências
echo    Instalando dependências Python...
pip install -r requirements.txt

REM Configurar variáveis de ambiente
if not exist ".env" (
    echo    Configurando variáveis de ambiente...
    copy env.example .env
    echo    ⚠️  Por favor, edite o arquivo .env com suas configurações de banco de dados
)

cd ..

REM Configurar Frontend
echo 🔧 Configurando Frontend...
cd client

REM Instalar dependências
echo    Instalando dependências Node.js...
npm install

cd ..

echo.
echo ✅ Instalação concluída!
echo.
echo 📋 Próximos passos:
echo 1. Configure o banco de dados PostgreSQL
echo 2. Edite o arquivo backend\.env com suas credenciais
echo 3. Execute: cd backend ^&^& python init_db.py
echo 4. Execute o backend: cd backend ^&^& python run.py
echo 5. Execute o frontend: cd client ^&^& npm start
echo.
echo 🌐 Acesse: http://localhost:3000
echo 👤 Login: admin / admin123
pause 