# Tinfoil Shop Frontend - TODO

## Backend Modularizado
- [x] Estruturar rotas em módulos separados (auth, downloads, users, torrents)
- [x] Criar camada de serviços para lógica de negócio
- [x] Implementar middleware de autenticação JWT
- [ ] Configurar integração com Dropbox
- [ ] Implementar sistema de fila de downloads
- [ ] Adicionar validação de arquivos .torrent

## Autenticação & Usuários
- [x] Sistema de login/registro com JWT
- [x] Aprovação de usuários por admin
- [x] Geração de credenciais Tinfoil personalizadas
- [x] Regeneração de credenciais
- [x] Email de notificação para admin
- [x] Gerenciamento de usuários pendentes

## Dashboard Administrativo
- [x] Painel principal com estatísticas
- [x] Visualização de downloads ativos em tempo real
- [x] Histórico de downloads completados
- [x] Gerenciamento de usuários pendentes
- [x] Configuração de limite de downloads simultâneos

## Upload & Downloads de Torrents
- [x] Interface de upload de .torrent com validação
- [ ] Preview de arquivo torrent
- [x] Fila de downloads com limite configurável
- [x] Barra de progresso em tempo real
- [ ] Integração com WebTorrent
- [x] Armazenamento no Dropbox (serviço preparado)

## Interface Cyberpunk
- [x] Design com estética neon (rosa, ciano, preto)
- [x] Tipografia geométrica e ousada
- [x] Efeitos de brilho externo (glow)
- [ ] Elementos HUD com linhas técnicas
- [ ] Colchetes de canto (corner brackets)
- [x] Responsividade completa

## Testes & Qualidade
- [ ] Testes unitários do backend
- [ ] Testes de integração
- [ ] Validação de segurança JWT
- [ ] Testes de upload de arquivos

## Deploy & Documentação
- [ ] Documentação da API
- [ ] Guia de configuração de variáveis de ambiente
- [ ] README com instruções de uso
- [ ] Deploy na Vercel


## Melhorias Visuais e UX
- [x] Revisar contraste de cores em tema escuro
- [x] Melhorar hierarquia visual e alinhamentos
- [x] Otimizar espaçamento e padding
- [x] Melhorar ícones e sua visibilidade
- [x] Revisar tipografia e tamanhos de fonte
- [x] Melhorar feedback visual de interações
- [x] Otimizar responsividade mobile
