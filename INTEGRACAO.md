# Guia de Integração Frontend-Backend

Este documento descreve como o frontend e backend se comunicam após a separação em serviços desacoplados.

## 🔧 Configuração

### Backend (lojaTinfoil)

Configure no `.env`:

```env
FRONTEND_URL=https://capivara.rossetti.eng.br
NODE_ENV=production
```

### Frontend

Configure no `.env`:

```env
# IMPORTANTE: Use a RAIZ do domínio, SEM /api no final!
# O código adiciona os sufixos corretos (/api, /health, etc.)
VITE_BACKEND_API_URL=https://tinfoilapp.discloud.app
```

**⚠️ ATENÇÃO**: Não coloque `/api` no final da URL! O código já adiciona os sufixos corretos:

- `/api` → Para a loja Tinfoil
- `/health` → Para status de saúde
- `/indexing-status` → Para status de indexação
- `/bridge/*` → Para rotas do dashboard

## 🌐 CORS

O backend está configurado para:

- **Produção**: Aceita apenas `FRONTEND_URL` configurado
- **Desenvolvimento**: Aceita qualquer porta em `localhost` ou `127.0.0.1`
- **Domínios específicos**: `https://capivara.rossetti.eng.br`

## 🔄 Proxy do Vite (Desenvolvimento)

O Vite está configurado com proxy para evitar problemas de CORS em desenvolvimento:

- `/api` → Backend
- `/indexing-status` → Backend
- `/health` → Backend
- `/refresh` → Backend
- `/bridge/*` → Backend

Isso significa que em desenvolvimento, você pode fazer chamadas como `/api` e o Vite redireciona automaticamente para o backend.

## 🔐 Autenticação

### Tinfoil Auth (Basic Auth)

Usado para rotas `/api/*` (Tinfoil console):

- Credenciais são armazenadas no `localStorage` como `tinfoil_auth` (base64)
- Funções `setTinfoilAuth()` e `getTinfoilAuth()` gerenciam isso automaticamente
- As credenciais são injetadas automaticamente nas requisições

### JWT Auth (Bearer Token)

Usado para rotas `/bridge/*` (Dashboard):

- Token JWT armazenado em `localStorage` como `auth_token`
- Enviado via header `Authorization: Bearer <token>`

## 📡 Rotas

### Rotas Públicas

- `GET /health` - Status de saúde
- `GET /indexing-status` - Status de indexação

### Rotas Tinfoil (Basic Auth)

- `GET /api` - Lista de jogos (formato Tinfoil)
- `GET /refresh` - Força indexação

### Rotas Bridge (JWT)

- `GET /bridge/games` - Lista de jogos (formato rico para dashboard)
- `GET /bridge/me` - Dados do usuário
- `POST /bridge/auth` - Login
- Outras rotas `/bridge/*`

## 🚀 Desenvolvimento

### Opção 1: Frontend local conectando ao backend em produção (Recomendado)

1. Configure o `.env` do frontend:

```env
VITE_BACKEND_API_URL=https://tinfoilapp.discloud.app
```

2. Inicie o frontend:

```bash
cd frontend
pnpm dev
```

O frontend rodará na porta 3000 e se conectará diretamente ao backend em produção.

### Opção 2: Frontend e backend locais

1. Configure o `.env` do frontend:

```env
VITE_BACKEND_API_URL=http://localhost:8080
```

2. Inicie o backend:

```bash
cd lojaTinfoil
node index.js
```

3. Inicie o frontend:

```bash
cd frontend
pnpm dev
```

O Vite rodará na porta 3000 e usará o proxy para chamadas ao backend local.

## 🌐 Produção

### Vercel (Frontend)

1. Vá em **Settings > Environment Variables**
2. Adicione:
   - **Key**: `VITE_BACKEND_API_URL`
   - **Value**: `https://tinfoilapp.discloud.app` (SEM `/api` no final!)
3. Faça redeploy do projeto

### Discloud (Backend)

Configure no `.env`:

```env
FRONTEND_URL=https://tinfoil-frontend.vercel.app
NODE_ENV=production
```

O CORS já está configurado para aceitar requisições da Vercel.

## 📝 Notas Importantes

- **Rota `/api`**: Formato otimizado para Tinfoil (console Switch)
- **Rota `/bridge/games`**: Formato rico com metadados para dashboard humano
- **Autenticação**: Centralizada no `api.ts` via localStorage
- **CORS**: Flexível em dev, estrito em produção
