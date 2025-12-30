# Configuração da Conexão Frontend-Backend

Este documento descreve como configurar a conexão entre o frontend e o backend lojaTinfoil.

## 📋 Requisitos

1. Backend lojaTinfoil rodando e acessível
2. Frontend configurado com as variáveis de ambiente corretas

## 🔧 Configuração do Backend

O backend precisa aceitar requisições do frontend. Se o frontend estiver em um domínio diferente, você precisará configurar CORS no backend.

### Adicionar CORS ao Backend

No arquivo `lojaTinfoil/index.js`, adicione o middleware CORS:

```javascript
import cors from "cors";

// Após criar o app Express
const app = express();

// Configurar CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
```

E adicione `cors` às dependências do backend:

```bash
cd lojaTinfoil
npm install cors
```

### Variáveis de Ambiente do Backend

Adicione ao `.env` do backend:

```env
FRONTEND_URL=http://localhost:3000
```

## 🔧 Configuração do Frontend

### Variáveis de Ambiente

Configure no `.env` do frontend:

```env
# URL do backend lojaTinfoil
VITE_BACKEND_API_URL=http://localhost:8080
BACKEND_API_URL=http://localhost:8080
```

**Nota:** 
- `VITE_BACKEND_API_URL` é usado no cliente (browser)
- `BACKEND_API_URL` é usado no servidor Node.js

### Em Produção

Em produção, configure as URLs corretas:

```env
# Frontend
VITE_BACKEND_API_URL=https://backend.seu-dominio.com
BACKEND_API_URL=https://backend.seu-dominio.com

# Backend
FRONTEND_URL=https://frontend.seu-dominio.com
```

## 🔐 Autenticação

### Autenticação Tinfoil

O frontend usa as credenciais Tinfoil do usuário logado para fazer requisições ao backend. Essas credenciais são armazenadas no banco de dados do frontend e são geradas automaticamente quando um usuário é aprovado.

### Autenticação JWT (Bridge)

Para os endpoints `/bridge/*`, o backend espera um token JWT válido. Você pode precisar ajustar o backend para aceitar o token JWT do frontend ou criar um token compartilhado entre os dois sistemas.

## 🧪 Testando a Conexão

1. Inicie o backend:
```bash
cd lojaTinfoil
npm start
```

2. Inicie o frontend:
```bash
cd frontend
pnpm dev
```

3. Verifique os logs do backend para ver se as requisições estão chegando

4. No frontend, você pode testar a conexão usando o router tRPC:

```typescript
// Em um componente React
const { data: health } = trpc.backend.getHealth.useQuery();
console.log("Backend health:", health);
```

## 🐛 Troubleshooting

### Erro: CORS policy blocked

- Verifique se o CORS está configurado no backend
- Verifique se a URL do frontend está correta na configuração CORS do backend
- Verifique se `credentials: true` está configurado no CORS

### Erro: Connection refused

- Verifique se o backend está rodando
- Verifique se a URL do backend está correta nas variáveis de ambiente
- Verifique se não há firewall bloqueando a conexão

### Erro: 401 Unauthorized

- Verifique se as credenciais Tinfoil estão configuradas para o usuário
- Verifique se o backend está validando corretamente as credenciais

## 📝 Notas Importantes

1. O frontend e o backend são sistemas separados e independentes
2. O frontend faz proxy das requisições ao backend através do servidor tRPC
3. As credenciais Tinfoil são armazenadas no banco de dados do frontend
4. Em produção, use HTTPS para todas as conexões

