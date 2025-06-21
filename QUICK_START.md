# 🚀 Início Rápido - Hortifruti PDV

## Instalação Rápida

### Opção 1: Script Automatizado (Recomendado)

**Linux/macOS:**
```bash
chmod +x install.sh
./install.sh
```

**Windows:**
```cmd
install.bat
```

### Opção 2: Instalação Manual

#### 1. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/macOS
# ou
venv\Scripts\activate     # Windows
pip install -r requirements.txt
cp env.example .env
# Edite o arquivo .env com suas configurações
python init_db.py
python run.py
```

#### 2. Frontend
```bash
cd client
npm install
npm start
```

## Configuração do Banco de Dados

1. Instale o PostgreSQL
2. Crie o banco de dados:
```sql
CREATE DATABASE hortifruti_pdv;
```
3. Configure as credenciais no arquivo `backend/.env`

## Primeiro Acesso

- **URL**: http://localhost:3000
- **Usuário**: admin
- **Senha**: admin123

## Funcionalidades Principais

- ✅ **Dashboard** - Visão geral do negócio
- ✅ **PDV** - Sistema de vendas
- ✅ **Produtos** - Gestão de estoque
- ✅ **Clientes** - Cadastro de clientes
- ✅ **Fornecedores** - Gestão de fornecedores
- ✅ **Vendas** - Histórico de vendas

## Estrutura de Arquivos

```
hortifruti_pdv/
├── backend/          # API Python/FastAPI
├── client/           # Frontend React/TypeScript
├── install.sh        # Script de instalação (Linux/macOS)
├── install.bat       # Script de instalação (Windows)
├── docker-compose.yml # Deploy com Docker
└── README.md         # Documentação completa
```

## Suporte

Para problemas ou dúvidas, consulte o `README.md` completo ou abra uma issue no GitHub. 