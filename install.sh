#!/bin/bash

echo "🚀 Instalando Hortifruti PDV..."
echo ""

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado. Por favor, instale o Python 3.8 ou superior."
    exit 1
fi

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js 16 ou superior."
    exit 1
fi

# Verificar se PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL não encontrado. Você precisará instalá-lo manualmente."
    echo "   Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "   macOS: brew install postgresql"
    echo "   Windows: https://www.postgresql.org/download/windows/"
fi

echo "✅ Dependências básicas verificadas"
echo ""

# Configurar Backend
echo "🔧 Configurando Backend..."
cd backend

# Criar ambiente virtual
if [ ! -d "venv" ]; then
    echo "   Criando ambiente virtual..."
    python3 -m venv venv
fi

# Ativar ambiente virtual
echo "   Ativando ambiente virtual..."
source venv/bin/activate

# Instalar dependências
echo "   Instalando dependências Python..."
pip install -r requirements.txt

# Configurar variáveis de ambiente
if [ ! -f ".env" ]; then
    echo "   Configurando variáveis de ambiente..."
    cp env.example .env
    echo "   ⚠️  Por favor, edite o arquivo .env com suas configurações de banco de dados"
fi

cd ..

# Configurar Frontend
echo "🔧 Configurando Frontend..."
cd client

# Instalar dependências
echo "   Instalando dependências Node.js..."
npm install

cd ..

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure o banco de dados PostgreSQL"
echo "2. Edite o arquivo backend/.env com suas credenciais"
echo "3. Execute: cd backend && python init_db.py"
echo "4. Execute o backend: cd backend && python run.py"
echo "5. Execute o frontend: cd client && npm start"
echo ""
echo "🌐 Acesse: http://localhost:3000"
echo "👤 Login: admin / admin123" 