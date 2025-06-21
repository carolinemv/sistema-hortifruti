# Hortifruti PDV - Sistema de Ponto de Venda

Sistema completo de PDV (Ponto de Venda) para hortifruti desenvolvido com Python/FastAPI no backend e React/TypeScript no frontend.

## 🚀 Funcionalidades

- **Autenticação e Controle de Acesso**: Sistema de login com JWT tokens
- **Gestão de Produtos**: Cadastro, edição e controle de estoque
- **Gestão de Fornecedores**: Cadastro e gerenciamento de fornecedores
- **Gestão de Clientes**: Cadastro e histórico de clientes
- **Sistema de Vendas**: PDV completo com múltiplas formas de pagamento
- **Controle de Estoque**: Movimentações de entrada, saída e ajustes
- **Dashboard**: Relatórios e métricas em tempo real
- **Interface Responsiva**: Design moderno e adaptável

## 🛠️ Tecnologias

### Backend
- **Python 3.8+**
- **FastAPI** - Framework web moderno e rápido
- **SQLAlchemy** - ORM para banco de dados
- **PostgreSQL** - Banco de dados principal
- **JWT** - Autenticação com tokens
- **Pydantic** - Validação de dados

### Frontend
- **React 18** - Biblioteca JavaScript para UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **React Query** - Gerenciamento de estado do servidor
- **React Router** - Roteamento
- **Lucide React** - Ícones

## 📋 Pré-requisitos

- Python 3.8 ou superior
- Node.js 16 ou superior
- PostgreSQL
- pip (gerenciador de pacotes Python)
- npm ou yarn

## 🔧 Instalação

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd hortifruti_pdv
```

### 2. Configuração do Backend

```bash
cd backend

# Crie um ambiente virtual
python -m venv venv

# Ative o ambiente virtual
# No Windows:
venv\Scripts\activate
# No macOS/Linux:
source venv/bin/activate

# Instale as dependências
pip install -r requirements.txt

# Configure as variáveis de ambiente
cp env.example .env
# Edite o arquivo .env com suas configurações de banco de dados
```

### 3. Configuração do Banco de Dados

```sql
-- Crie o banco de dados PostgreSQL
CREATE DATABASE hortifruti_pdv;
```

### 4. Configuração do Frontend

```bash
cd ../client

# Instale as dependências
npm install

# Configure o Tailwind CSS
npx tailwindcss init -p
```

## 🚀 Executando o Projeto

### Backend
```bash
cd backend

# Ative o ambiente virtual (se não estiver ativo)
source venv/bin/activate  # macOS/Linux
# ou
venv\Scripts\activate     # Windows

# Execute o servidor
python run.py
```

O backend estará disponível em: http://localhost:8000

### Frontend
```bash
cd client

# Execute o servidor de desenvolvimento
npm start
```

O frontend estará disponível em: http://localhost:3000

## 📖 Uso

### 1. Primeiro Acesso

1. Acesse http://localhost:3000
2. Faça login com as credenciais padrão:
   - **Usuário**: admin
   - **Senha**: admin123

### 2. Configuração Inicial

1. **Cadastre Fornecedores**: Vá em "Fornecedores" e adicione seus fornecedores
2. **Cadastre Produtos**: Vá em "Produtos" e adicione os produtos com seus fornecedores
3. **Cadastre Clientes**: Vá em "Clientes" e adicione seus clientes
4. **Configure Estoque**: Adicione movimentações de entrada para os produtos

### 3. Usando o PDV

1. Acesse a seção "PDV"
2. Selecione um cliente
3. Adicione produtos à venda
4. Escolha a forma de pagamento
5. Finalize a venda

## 📁 Estrutura do Projeto

```
hortifruti_pdv/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── auth.py
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── auth.py
│   │       ├── products.py
│   │       ├── sales.py
│   │       ├── customers.py
│   │       └── suppliers.py
│   ├── requirements.txt
│   ├── env.example
│   └── run.py
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## 🔐 Autenticação

O sistema usa JWT tokens para autenticação. Os tokens são armazenados no localStorage do navegador e são automaticamente incluídos em todas as requisições para a API.

### Níveis de Acesso

- **Administrador**: Acesso completo ao sistema
- **Usuário**: Acesso limitado (não pode excluir registros)

## 📊 API Endpoints

### Autenticação
- `POST /auth/token` - Login
- `POST /auth/register` - Registro de usuário
- `GET /auth/me` - Dados do usuário logado

### Produtos
- `GET /products` - Listar produtos
- `POST /products` - Criar produto
- `PUT /products/{id}` - Atualizar produto
- `DELETE /products/{id}` - Excluir produto
- `POST /products/{id}/stock-movement` - Movimentação de estoque

### Vendas
- `GET /sales` - Listar vendas
- `POST /sales` - Criar venda
- `GET /sales/daily-summary` - Resumo diário

### Clientes
- `GET /customers` - Listar clientes
- `POST /customers` - Criar cliente
- `PUT /customers/{id}` - Atualizar cliente

### Fornecedores
- `GET /suppliers` - Listar fornecedores
- `POST /suppliers` - Criar fornecedor
- `PUT /suppliers/{id}` - Atualizar fornecedor

## 🐛 Solução de Problemas

### Erro de Conexão com Banco de Dados
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no arquivo `.env`
- Certifique-se de que o banco `hortifruti_pdv` existe

### Erro de CORS
- Verifique se o backend está rodando na porta 8000
- Confirme se o frontend está acessando http://localhost:3000

### Dependências não encontradas
```bash
# Backend
pip install -r requirements.txt

# Frontend
npm install
```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, envie um email para [seu-email@exemplo.com] ou abra uma issue no GitHub. 