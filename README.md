# Tinfoil Shop Frontend

Frontend moderno para o Tinfoil Shop, construído com React, TypeScript, tRPC e Vite.

## 📋 Pré-requisitos

- Node.js 18+
- pnpm (gerenciador de pacotes)
- Backend lojaTinfoil rodando e acessível

## 🚀 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/jesuscapivara/tinfoilFrontend.git
cd tinfoilFrontend
```

2. Instale as dependências:
```bash
pnpm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# App Configuration
VITE_APP_ID=seu_app_id
NODE_ENV=development

# OAuth Configuration
OAUTH_SERVER_URL=https://seu-oauth-server.com
OWNER_OPEN_ID=seu_open_id

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/tinfoil_shop

# JWT Secret
JWT_SECRET=seu_jwt_secret_super_seguro

# Backend API URL (lojaTinfoil backend)
VITE_BACKEND_API_URL=http://localhost:8080
BACKEND_API_URL=http://localhost:8080
```

## 🔗 Conexão com o Backend

O frontend precisa se conectar ao backend lojaTinfoil separado. Configure a URL do backend nas variáveis de ambiente:

- `VITE_BACKEND_API_URL`: URL do backend para uso no cliente (browser)
- `BACKEND_API_URL`: URL do backend para uso no servidor

### Endpoints do Backend Esperados

O frontend espera que o backend tenha os seguintes endpoints:

- `GET /api` - Lista de jogos (requer autenticação Tinfoil Basic Auth)
- `GET /health` - Status de saúde do backend
- `GET /indexing-status` - Status da indexação
- `GET /refresh` - Força nova indexação (requer autenticação)
- `GET /bridge/games` - Jogos via bridge (requer autenticação JWT)
- `GET /bridge/me` - Dados do usuário via bridge (requer autenticação JWT)

## 🏃 Executando

### Desenvolvimento

```bash
pnpm dev
```

O servidor de desenvolvimento estará disponível em `http://localhost:3000`

### Produção

```bash
pnpm build
pnpm start
```

## 📁 Estrutura do Projeto

```
frontend/
├── client/              # Código do cliente React
│   └── src/
│       ├── components/  # Componentes React
│       ├── pages/      # Páginas da aplicação
│       └── lib/        # Utilitários do cliente
├── server/              # Servidor tRPC
│   ├── _core/          # Código core do servidor
│   ├── routers/        # Routers tRPC
│   └── services/       # Serviços (incluindo integração com backend)
├── shared/              # Código compartilhado
└── drizzle/            # Migrações do banco de dados
```

## 🔧 Integração com Backend

O frontend se conecta ao backend através do serviço `backendService.ts` localizado em `server/services/backendService.ts`.

### Router tRPC

O router `backend` está disponível em `server/routers/backend.ts` e expõe os seguintes endpoints tRPC:

- `backend.getGames` - Obtém lista de jogos do backend
- `backend.getIndexingStatus` - Obtém status de indexação
- `backend.getHealth` - Obtém status de saúde
- `backend.refreshIndex` - Força nova indexação (admin only)
- `backend.getGamesViaBridge` - Obtém jogos via bridge

### Uso no Cliente

```typescript
import { trpc } from "@/lib/trpc";

// No componente React
const { data } = trpc.backend.getGames.useQuery();
const { data: status } = trpc.backend.getIndexingStatus.useQuery();
```

## 🔐 Autenticação

O frontend usa JWT para autenticação própria e faz proxy das credenciais Tinfoil para o backend quando necessário.

## 📝 Notas

- O frontend e o backend são repositórios separados
- O backend deve estar rodando e acessível antes de iniciar o frontend
- Certifique-se de que as URLs do backend estão corretas nas variáveis de ambiente
- Em produção, configure CORS no backend para permitir requisições do frontend

## 🐛 Troubleshooting

### Erro de conexão com o backend

1. Verifique se o backend está rodando
2. Verifique a URL do backend nas variáveis de ambiente
3. Verifique se o CORS está configurado no backend

### Erro de autenticação

1. Verifique se as credenciais Tinfoil estão configuradas para o usuário
2. Verifique se o JWT_SECRET está configurado corretamente

## 📄 Licença

[Adicione sua licença aqui]

