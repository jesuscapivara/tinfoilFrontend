# Guia de Deploy no Vercel

Este projeto está configurado para funcionar no Vercel usando Serverless Functions.

## Estrutura

- **Frontend**: Compilado pelo Vite em `dist/public`
- **Backend**: Serverless Function em `api/server.ts`

## Configuração no Vercel

1. **Framework Preset**: Outro (não Next.js, não Vite, etc.)
2. **Build Command**: `pnpm build:vercel`
3. **Output Directory**: `dist/public`
4. **Install Command**: `pnpm install`

## Variáveis de Ambiente

Configure as seguintes variáveis no painel do Vercel:

- `NODE_ENV=production`
- `DATABASE_URL` - URL do banco de dados
- `JWT_SECRET` - Secret para JWT
- `VITE_APP_ID` - App ID
- `OAUTH_SERVER_URL` - URL do servidor OAuth
- `BACKEND_API_URL` - URL do backend lojaTinfoil
- Outras variáveis conforme necessário

## Como Funciona

1. O Vercel compila o frontend com `vite build` → `dist/public`
2. O Vercel detecta `api/server.ts` e cria uma Serverless Function
3. As rotas `/api/*` são redirecionadas para a função serverless
4. As rotas estáticas servem os arquivos de `dist/public`

## Troubleshooting

### Erro: "Cannot find module"

- Verifique se todas as dependências estão em `dependencies` (não apenas `devDependencies`)
- Execute `pnpm install --production=false` localmente para testar

### Erro: Arquivos TypeScript sendo servidos

- Verifique se o `.vercelignore` está correto
- Certifique-se de que o `vercel.json` está configurado corretamente

### Build falha

- Verifique os logs de build no Vercel
- Teste o build localmente: `pnpm build:vercel`

