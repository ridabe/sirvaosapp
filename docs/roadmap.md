# Roadmap de Desenvolvimento — SirvaOS App

> **Documento:** Roadmap de Etapas  
> **Versão:** 1.0  
> **Data:** Junho de 2026  
> **Status:** Referência ativa de desenvolvimento

---

## Como usar este documento

Cada etapa tem um escopo fechado e critérios de conclusão. **Não avançar para a próxima etapa antes de concluir os critérios da atual.** O objetivo é manter foco, evitar retrabalho e garantir que cada etapa gera algo testável no dispositivo.

---

## Etapa 1 — Fundação do Projeto ✅

**Objetivo:** Projeto inicializado, estrutura de pastas criada, dependências base instaladas, repositório configurado e rodando no dispositivo.

### Entregas
- [x] Projeto Expo criado com TypeScript
- [x] Expo Router configurado (file-based routing)
- [x] NativeWind configurado com tokens de cor do SirvaOS
- [x] Estrutura de pastas completa (`app/`, `components/`, `lib/`, `hooks/`, `context/`, `types/`, `constants/`)
- [x] `AuthContext` esqueleto criado
- [x] `lib/supabase.ts` com cliente configurado (SecureStore)
- [x] `lib/auth.ts` com funções de autenticação
- [x] `constants/colors.ts` e `constants/modules.ts`
- [x] Telas esqueleto de todas as rotas (auth + app)
- [x] `eas.json` configurado
- [x] GitHub Actions workflow de build AAB
- [x] `.gitignore` protegendo `.env.local`
- [x] Repositório com push para `main`
- [ ] `npm install` executado com sucesso
- [ ] `npx expo start` rodando no dispositivo/emulador sem erros

### Critérios de conclusão
- App abre no dispositivo mostrando a tela de login (mesmo que vazia)
- Nenhum erro de compilação ou import

---

## Etapa 2 — Autenticação Completa

**Objetivo:** Membro consegue fazer login, primeiro acesso e recuperar senha. A sessão persiste entre abertura e fechamento do app.

### Entregas
- [ ] Tela de login com e-mail, senha, botões e logo SirvaOS
- [ ] Validação de campos com feedback de erro
- [ ] Integração com `supabase.auth.signInWithPassword`
- [ ] Redirecionamento correto pós-login (home para membros)
- [ ] Fluxo de primeiro acesso — 3 steps:
  - Step 1: informar e-mail
  - Step 2: confirmar data de nascimento (quando exigida)
  - Step 3: definir senha
  - Integração com Edge Function `first-access` (já deployada)
- [ ] Tela de recuperação de senha (e-mail → link via Resend)
- [ ] Logout funcional
- [ ] Sessão persistida com SecureStore (app fecha e reabre logado)
- [ ] Tratamento de erros com mensagens amigáveis (lista no SPEC seção 12)
- [ ] Proteção de rotas: sem sessão → login; com sessão → home

### Critérios de conclusão
- Membro real (cadastrado no banco) consegue fazer primeiro acesso pelo app
- Membro consegue fazer login e logout
- App reabre já logado sem pedir senha novamente
- Erros de credencial exibem mensagem adequada (não "error" bruto)

---

## Etapa 3 — Home e Dashboard do Membro

**Objetivo:** Após login, membro vê sua home personalizada com próximos eventos, seus ministérios e comunicados recentes.

### Dependências
- Etapa 2 concluída
- Tabelas `profiles`, `members`, `tenant_modules`, `platform_modules` populadas no banco

### Entregas
- [ ] Header com saudação personalizada ("Olá, [nome]") e foto de perfil
- [ ] Seção "Próximos eventos" — lista horizontal com cards de eventos dos ministérios do membro
- [ ] Seção "Meus ministérios" — cards dos módulos em que o membro participa (dinâmico, vindo do banco)
- [ ] Cards de admin de módulo — visíveis apenas para membros com papel em `tenant_module_admins`
- [ ] Seção "Comunicados recentes" — últimos 3 comunicados do tenant e dos módulos do membro
- [ ] Estado de carregamento (skeleton/loading) para cada seção
- [ ] Estado vazio com mensagem quando não há dados
- [ ] Estado offline com mensagem clara
- [ ] Hook `useMember` para buscar dados do perfil e membro autenticado
- [ ] Hook `useModules` para buscar módulos ativos do membro

### Critérios de conclusão
- Home carrega e exibe dados reais do membro logado
- Módulos exibidos correspondem ao tenant do membro
- Scroll fluido sem travamentos

---

## Etapa 4 — Tela de Perfil do Membro

**Objetivo:** Membro acessa e edita seus dados pessoais básicos; visualiza seus ministérios e dados de membresia.

### Dependências
- Etapa 3 concluída

### Entregas
- [ ] Foto de perfil com opção de troca (câmera/galeria → upload para Supabase Storage)
- [ ] Nome completo, e-mail, telefone
- [ ] Data de ingresso e status de membresia
- [ ] Lista de ministérios vinculados
- [ ] Edição de nome, telefone e foto
- [ ] Botão de logout
- [ ] Link para política de privacidade
- [ ] Opção "Exportar meus dados" (via Edge Function ou e-mail)
- [ ] Opção "Solicitar exclusão de conta"

### Critérios de conclusão
- Membro visualiza seus dados reais
- Alteração de foto persiste no Storage e reflete na home
- Logout redireciona para login

---

## Etapa 5 — Notificações Push

**Objetivo:** Membro recebe notificações push sobre escalas, eventos e comunicados.

### Dependências
- Etapa 3 concluída
- Tabela `push_tokens` criada no banco (migration)

### Entregas
- [ ] Migration para tabela `push_tokens` (id, profile_id, platform, token, active)
- [ ] Solicitar permissão de notificação no primeiro login
- [ ] Obter e salvar `ExpoPushToken` na tabela `push_tokens`
- [ ] Renovação de token quando expirado
- [ ] Handling de notificação recebida com app em foreground (toast/banner in-app)
- [ ] Handling de notificação tocada com app em background (navegar para a tela relevante via deep link)
- [ ] Central de notificações (tela) — lista histórica de notificações recebidas
- [ ] Badge de contador na tab de notificações
- [ ] Edge Function `send-push` para envio via Expo Push API (acionada pelo backend quando admin publica escala/comunicado)

### Critérios de conclusão
- Dispositivo físico recebe notificação push
- Toque na notificação navega para a tela correta
- Token é salvo corretamente no banco com `profile_id`

---

## Etapa 6 — Módulo Louvor

**Objetivo:** Músico vê suas escalas, confirma presença e acessa histórico.

### Dependências
- Etapas 2, 3 e 5 concluídas
- Migrations das tabelas do módulo Louvor no banco (coordenado com módulo web)

### Tabelas necessárias no banco
- `module_louvor_events` — eventos/cultos/ensaios
- `module_louvor_scales` — escalas
- `module_louvor_scale_members` — membro na escala com função
- `module_louvor_confirmations` — confirmação de presença

### Entregas
- [ ] Migrations das tabelas do Louvor
- [ ] RLS das tabelas do Louvor (membro lê apenas as próprias escalas)
- [ ] Tela do módulo Louvor com próximas escalas
- [ ] Card de escala: data, evento, função/instrumento, status de confirmação
- [ ] Tela de detalhe da escala com botões "Confirmar" / "Justificar ausência"
- [ ] Histórico de escalas (passadas)
- [ ] Notificação de nova escala publicada
- [ ] Notificação de lembrete (24h antes)

### Critérios de conclusão
- Músico logado vê suas escalas reais cadastradas pelo admin do módulo web
- Confirmação de presença registrada no banco e visível para o admin no painel web
- Notificação chega ao dispositivo quando admin publica escala

---

## Etapa 7 — Módulos Financeiro, Kids, Escola Bíblica e Ação Social

**Objetivo:** Completar os módulos do MVP com as funcionalidades de leitura e interação básica.

### Dependências
- Etapa 6 concluída
- Migrations das tabelas de cada módulo no banco

### Módulo Financeiro
- [ ] Tabela `module_finance_contributions` (migration + RLS)
- [ ] Tela com histórico de dízimos e ofertas do membro
- [ ] Card de contribuição: data, valor, tipo
- [ ] Download/visualização de comprovante

### Módulo Kids
- [ ] Tabelas `module_kids_children`, `module_kids_events`, `module_kids_announcements`
- [ ] Tela para pais: crianças vinculadas + próximos eventos do Kids
- [ ] Feed de comunicados do Kids
- [ ] Card de criança com nome, turma e frequência

### Módulo Escola Bíblica
- [ ] Tabelas `module_ebd_classes`, `module_ebd_attendance`, `module_ebd_materials`
- [ ] Tela com turma, professor, frequência pessoal
- [ ] Lista de materiais da aula (links/documentos)

### Módulo Ação Social
- [ ] Tela com próximas escalas de voluntariado
- [ ] Confirmação de presença no voluntariado
- [ ] Histórico de participação

### Critérios de conclusão
- Cada módulo exibe dados reais do banco
- Apenas membros vinculados ao módulo acessam a tela
- Dados de um módulo não vazam para outro

---

## Etapa 8 — Polimento, Testes e Build de Produção

**Objetivo:** App pronto para distribuição interna e aprovação antes do Google Play.

### Entregas
- [ ] Splash screen com logo SirvaOS e fundo `#0E6B68`
- [ ] Ícone do app (adaptive icon Android)
- [ ] Ícone de notificação
- [ ] Animações e transições suaves entre telas
- [ ] Verificação de acessibilidade (contraste, tamanho de toque)
- [ ] Modo offline: dados em cache com feedback claro
- [ ] Testes manuais dos fluxos críticos (login, primeiro acesso, escala, confirmação, push)
- [ ] Build `preview` (APK) para testes internos via EAS
- [ ] Build `production` (AAB) via GitHub Actions
- [ ] Configurar secrets no GitHub (`EXPO_TOKEN`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
- [ ] Geração do arquivo `google-services.json` (Firebase para FCM, se necessário)
- [ ] Revisão de segurança: nenhuma chave sensível no bundle

### Critérios de conclusão
- APK instala e funciona em ao menos 3 dispositivos físicos diferentes
- Build AAB gerado via GitHub Actions sem erros
- Nenhum crash nos fluxos principais

---

## Etapa 9 — Google Play e Lançamento Interno

**Objetivo:** App publicado na trilha interna do Google Play para distribuição controlada.

### Entregas
- [ ] Conta de desenvolvedor Google Play configurada
- [ ] Política de privacidade publicada em URL pública
- [ ] Ficha do app (descrição, screenshots, categoria)
- [ ] Screenshots das telas principais
- [ ] Configurar `eas submit` com `google-play-key.json`
- [ ] Primeiro upload manual do AAB para trilha interna
- [ ] Testar download e instalação pelo Play Store

### Critérios de conclusão
- App disponível para download interno via Google Play
- Membros convidados conseguem instalar e usar

---

## Resumo Visual das Etapas

```
[1] Fundação          ← CONCLUÍDA (estrutura + repositório)
[2] Autenticação      ← PRÓXIMA
[3] Home/Dashboard
[4] Perfil
[5] Notificações Push
[6] Módulo Louvor     ← Primeiro módulo operacional completo
[7] Módulos Financeiro / Kids / EBD / Ação Social
[8] Polimento + Build de Produção
[9] Google Play
```

---

## Regras de foco

- **Uma etapa por vez.** Não iniciar a etapa N+1 antes de todos os critérios da etapa N estarem marcados.
- **Sem funcionalidades extras.** Se surgir uma ideia durante o desenvolvimento, anotar aqui na seção "Backlog" — não implementar na mesma etapa.
- **Testar no dispositivo físico.** Não validar só no emulador.
- **Migrations do banco são coordenadas.** As tabelas de módulo (Etapas 6 e 7) devem ser criadas em sincronia com o módulo web para não divergir o schema.

---

## Backlog (ideias para fases futuras)

- Modo escuro
- White-label por tenant (cores e logo carregados do banco)
- Check-in com QR Code
- Chat entre membros do mesmo ministério
- Relatórios visuais (gráfico de frequência)
- Suporte iOS
- Biblioteca de materiais
