# PRD — SirvaOS App (Portal do Membro Mobile)

> **Documento:** Product Requirements Document — App Mobile  
> **Produto:** SirvaOS App  
> **Módulo:** Portal do Membro  
> **Versão:** 0.1  
> **Data:** Junho de 2026  
> **Status:** Rascunho técnico-funcional

---

## 1. Visão do Produto

O **SirvaOS App** é o aplicativo mobile Android (e futuramente iOS) do portal do membro do SirvaOS. Ele entrega ao membro da igreja uma interface nativa, rápida e acessível para acompanhar os ministérios dos quais participa, visualizar escalas e eventos, confirmar presença, receber notificações e acessar informações pessoais — tudo conectado ao mesmo backend Supabase já utilizado pelo módulo web.

O app é a versão mobile do Portal do Membro disponível na plataforma web, adaptado para a experiência de celular com notificações push, navegação nativa e UX otimizada para uso em campo.

---

## 2. Objetivos

### Objetivo Principal
Permitir que membros da Primeira Igreja acessem as informações relevantes ao seu serviço e participação ministerial diretamente pelo celular, sem depender de grupos de WhatsApp ou comunicação manual.

### Objetivos Específicos

- Substituir o WhatsApp como canal de comunicação de escalas e eventos de ministérios.
- Dar ao membro visibilidade sobre seus próximos compromissos em todos os ministérios que participa.
- Enviar notificações push sobre escalas, eventos e comunicados.
- Permitir confirmação de presença em eventos e ensaios.
- Exibir informações pessoais do membro (perfil, histórico de ministérios, contribuições).
- Ser a porta de entrada do membro ao ecossistema SirvaOS.

---

## 3. Contexto e Justificativa

A Primeira Igreja tem mais de 40 ministérios ativos. Líderes e membros gerenciam escalas, eventos, ensaios e comunicados via grupos de WhatsApp, planilhas e agendas físicas. Isso gera:

- Perda de informação crítica (escalas atrasadas, ausências não comunicadas).
- Dificuldade da liderança em ter visibilidade do engajamento.
- Retrabalho administrativo.
- Comunicação fragmentada por ministério.

O módulo web do SirvaOS já resolve o lado administrativo. O app resolve o lado do membro.

---

## 4. Público-Alvo

| Perfil | Descrição |
|---|---|
| Membro ativo | Integrante da congregação vinculado a um ou mais ministérios |
| Membro com papel de admin de módulo | Líder de ministério que também é membro — acessa painel admin e app membro simultaneamente |
| Pais de crianças no Kids | Recebem comunicados e acompanham informações dos filhos |
| Voluntários de ação social | Acompanham escalas de voluntariado |

---

## 5. Proposta de Valor

| Para o membro | Para a liderança |
|---|---|
| Saber quando está escalado, em qual culto e em qual função | Reduzir faltas por falta de comunicação |
| Confirmar ou justificar ausência | Ter visibilidade de confirmações em tempo real |
| Receber comunicados do ministério no app | Parar de depender de WhatsApp para operação |
| Ver seus próximos compromissos em um único lugar | Membros mais engajados e informados |
| Acessar histórico de contribuições e participação | Dados precisos de frequência |

---

## 6. Funcionalidades do MVP

### 6.1 Autenticação

- **Login com e-mail e senha**
  - Autenticação via Supabase Auth
  - Sessão persistida no dispositivo
  - Logout manual

- **Primeiro acesso**
  - Fluxo idêntico ao web: membro informa e-mail → backend valida via Edge Function `first-access` → confirmação de data de nascimento quando cadastrada → criação de senha
  - Usa a mesma Edge Function já deployada na plataforma web

- **Recuperação de senha**
  - Link de redefinição enviado por e-mail (via Resend)

- **Redirecionamento por perfil pós-login**
  - Membro comum → home do app
  - Membro com `tenant_module_admins` → home do app com acesso adicional ao painel admin dos módulos que administra
  - `owner`/`admin` do tenant → home do app (painel web fica separado; o app não substitui o portal administrativo completo)

### 6.2 Home (Dashboard do Membro)

- **Saudação personalizada** com nome do membro
- **Próximos eventos/escalas** — lista cronológica dos próximos compromissos nos ministérios do membro
- **Cards de módulos** — acesso rápido a cada ministério do qual o membro participa
- **Cards de admin de módulo** — exibidos apenas para membros com papel administrativo, com atalho para o painel do módulo
- **Feed de comunicados** — comunicados recentes dos ministérios do membro e comunicados gerais da igreja
- **Indicadores rápidos** — contadores por módulo (ex: eventos confirmados, alunos em aula, etc.)

### 6.3 Módulos do Membro

Cada módulo exibe uma área específica com o que é relevante para aquele membro:

#### Louvor
- Próximas escalas (data, evento, instrumento/função)
- Confirmação de presença
- Histórico de escalas

#### Financeiro
- Histórico pessoal de contribuições (dízimos e ofertas)
- Comprovantes de doação

#### Kids (para pais/responsáveis)
- Comunicados do ministério infantil
- Próximos eventos do Kids
- Informações das crianças vinculadas

#### Escola Bíblica
- Turma e professor
- Frequência pessoal
- Material da aula (links/documentos)

#### ONGs e Ação Social (voluntários)
- Próximas escalas de voluntariado
- Confirmação de presença
- Histórico de participação

#### Intercessão

Disponível apenas para membros do Ministério de Intercessão e admins do módulo.

- **Lista de pedidos de oração** — pedidos ativos enviados via sistema web, organizados por data
- **Submissão de pedido** — membro envia pedido de oração diretamente pelo app
- **Escalas de intercessão** — visualização das torres/turnos de oração nos quais o membro está escalado
- **Confirmação de presença** — confirmar participação na torre de oração
- **Histórico pessoal** — torres participadas e pedidos registrados pelo membro
- **Comunicados do ministério** — avisos e convocações da liderança de intercessão

> **Regras de acesso:**
> - Pedidos de oração e escalas: visíveis apenas a membros vinculados ao ministério de intercessão
> - Submissão de pedido: qualquer membro autenticado pode enviar (pedido fica pendente até aprovação pelo admin do módulo)
> - Histórico e detalhes de pedidos alheios: visível apenas ao admin do módulo e ao próprio solicitante
> - Gestão de escalas e aprovação de pedidos: exclusivo ao admin do módulo (via painel web; não editável pelo app)

### 6.4 Notificações Push

- Notificação de nova escala publicada
- Lembrete de evento próximo (24h e 2h antes)
- Comunicado novo do ministério
- Comunicado geral da igreja
- Solicitação de confirmação de presença
- **Intercessão:** novo pedido de oração submetido (notifica admins do módulo)
- **Intercessão:** pedido de oração aprovado (notifica solicitante)
- **Intercessão:** escala de torre publicada (notifica membros escalados)

### 6.5 Perfil do Membro

- Nome, foto, contato
- Ministérios em que participa
- Data de ingresso na igreja e na membresia
- Botão de edição dos dados pessoais básicos (nome, telefone, foto)

### 6.6 Confirmação de Presença

- Lista de eventos aguardando confirmação
- Ação de confirmar ou justificar ausência
- Feedback visual do status da confirmação

---

## 7. Funcionalidades Fora do MVP

- Painel administrativo completo de módulo no app (o admin de módulo usa o painel web)
- Gestão de membros dentro do app
- Financeiro completo (receitas/despesas da igreja)
- Check-in/check-out com QR Code
- Chat entre membros
- Streaming de cultos
- Internacionalização
- iOS (fase posterior, mesma base Expo)

---

## 8. Requisitos Não-Funcionais

### Segurança
- Autenticação via Supabase Auth com JWT
- Token armazenado com segurança no dispositivo (SecureStore)
- Sem exposição da `service_role_key` ou credenciais sensíveis no bundle do app
- Rate limiting nas operações de autenticação (herda do backend)
- HTTPS obrigatório para todas as chamadas à API

### LGPD
- Consentimento na primeira abertura do app
- Link para política de privacidade
- Opção de exportação e exclusão de dados acessível pelo perfil

### Performance
- Tempo de carregamento inicial da home abaixo de 2 segundos em conexão 4G
- Navegação entre telas fluida (sem travamentos perceptíveis)
- Imagens com lazy loading

### Disponibilidade
- App funcional offline para leitura de dados já carregados (escalas, eventos)
- Sincronização automática ao retomar conexão
- Mensagem clara de estado offline

### Compatibilidade
- Android 10 (API 29) ou superior
- Telas de 5 a 7 polegadas
- Modo claro (modo escuro como evolução futura)

---

## 9. Arquitetura de Backend

O app **não possui backend próprio**. Toda a lógica de dados é servida pelo mesmo Supabase já em produção para o módulo web:

- **Supabase Auth** — autenticação e gerenciamento de sessão
- **Supabase Database** — mesmo banco PostgreSQL com RLS
- **Supabase Storage** — fotos de perfil, materiais de aula, logos
- **Supabase Edge Functions** — mesmas funções já deployadas (ex: `first-access`)
- **Resend** — e-mails transacionais (recuperação de senha, notificações por e-mail)

O app consome a API pública do Supabase usando a `SUPABASE_PUBLISHABLE_KEY` (anon key), respeitando as policies RLS do banco.

---

## 10. Identidade Visual e Tema

O app usa a identidade visual base do SirvaOS:

- Paleta principal: `brand.primary #0E6B68` e variantes
- Paleta de acento: `brand.accent #2BB3C0`
- Superfícies: `neutral.50 #F7FAF9` e `white`
- Logos da pasta `img/` do projeto

O sistema de temas do app deve suportar futuramente a customização por tenant (white-label), carregando as cores e logo da igreja a partir das configurações do tenant no banco.

---

## 11. Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework mobile | Expo (React Native) |
| Linguagem | TypeScript |
| Navegação | Expo Router (file-based routing) |
| UI Components | React Native + NativeWind (Tailwind para RN) |
| Backend | Supabase (já em produção) |
| Notificações push | Expo Notifications + Supabase Edge Function |
| Build Android (AAB) | GitHub Actions + EAS Build |
| Gerenciador de pacotes | npm |

---

## 12. Fluxo de Build e Distribuição

### Testes durante desenvolvimento
- `npx expo start` com Expo Go ou build de desenvolvimento no dispositivo físico

### Build de produção (AAB)
- GitHub Actions aciona EAS Build no push para a branch `main` ou `release/*`
- O `.aab` gerado é disponibilizado como artefato da Action e/ou enviado ao Google Play

### Variáveis de ambiente no app
- Apenas variáveis públicas no bundle: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Nenhuma chave sensível (service role, DB pass) no app

---

## 13. Métricas de Sucesso

| Métrica | Meta MVP |
|---|---|
| Taxa de adoção (membros com app instalado) | 50% dos membros ativos em 60 dias |
| Taxa de confirmação de presença via app | 70% das confirmações via app vs. WhatsApp |
| Taxa de abertura de notificações push | > 40% |
| NPS dos membros | ≥ 7 |
| Crashes por sessão | < 0,5% |

---

## 14. Fases e Roadmap

| Fase | Escopo | Prazo estimado |
|---|---|---|
| **MVP** | Auth, home, módulos prioritários (Louvor, Financeiro, Kids, Escola Bíblica), notificações, perfil | Fase atual |
| **Fase 2 — Intercessão** | Módulo de Intercessão no app (pedidos de oração, escalas de torre, submissão de pedido, notificações específicas); controle de acesso por vínculo ao ministério | Após MVP |
| **Fase 2 — Expansão** | Demais módulos de expansão (Jovens, Feminino, Masculino, Casais), white-label por tenant, modo offline aprimorado | Após validação do MVP |
| **Fase 3** | iOS, check-in QR Code, relatórios visuais, biblioteca de materiais | Longo prazo |

### Etapas de Implementação — Módulo Intercessão (App)

#### Etapa 1 — Backend e RLS
- [ ] Verificar/criar tabelas: `module_intercession_prayer_requests`, `module_intercession_scales`, `module_intercession_scale_members`, `module_intercession_confirmations`
- [ ] Criar policies RLS para membro comum (apenas próprios pedidos), membro do ministério (escalas próprias + pedidos aprovados) e admin do módulo (acesso total)
- [ ] Criar/validar função/view para verificar vínculo do membro ao ministério de intercessão (`module_member_links` com `module_slug = 'intercessao'`)
- [ ] Testar isolamento: membro comum não acessa escalas nem pedidos alheios

#### Etapa 2 — Tipagem e Hooks
- [ ] Gerar/atualizar tipos TypeScript (`types/database.ts`) com as novas tabelas do módulo
- [ ] Criar `hooks/useIntercession.ts` com:
  - `usePrayerRequests()` — lista pedidos do membro autenticado
  - `useIntercessionScales()` — escalas do membro no ministério
  - `useSubmitPrayerRequest()` — mutation para envio de pedido
  - `useConfirmIntercessionPresence()` — mutation para confirmação de torre

#### Etapa 3 — Telas
- [ ] `app/(app)/modulos/intercessao/index.tsx` — home do módulo com escalas e pedidos
- [ ] `app/(app)/modulos/intercessao/pedido/novo.tsx` — formulário de submissão de pedido
- [ ] `app/(app)/modulos/intercessao/pedido/[id].tsx` — detalhe do pedido (solicitante ou admin)
- [ ] `app/(app)/modulos/intercessao/escala/[id].tsx` — detalhe da torre de oração com confirmação

#### Etapa 4 — Componentes
- [ ] `components/modules/intercessao/TowerCard.tsx` — card de torre com badge de status e botão de confirmação inline
- [ ] `components/modules/intercessao/PrayerRequestCard.tsx` — card do pedido de oração com status
- [ ] `components/modules/intercessao/PrayerRequestForm.tsx` — formulário reutilizável de submissão

#### Etapa 5 — Notificações
- [ ] Trigger/Edge Function: admin recebe push ao chegar novo pedido pendente
- [ ] Trigger/Edge Function: solicitante recebe push ao pedido ser aprovado
- [ ] Trigger/Edge Function: membro escalado recebe push ao publicar nova torre
- [ ] Lembrete: membro escalado em torre recebe push 24h antes do turno

#### Etapa 6 — Integração na Home e Navegação
- [ ] Card do módulo Intercessão na home (exibido apenas para membros do ministério)
- [ ] Botão "Enviar pedido de oração" acessível a qualquer membro autenticado (via home ou perfil)
- [ ] Rota `/(app)/modulos/intercessao/` protegida para membros do ministério; rota `/pedido/novo` aberta a todos os membros

#### Etapa 7 — QA e Validação
- [ ] Testar fluxo completo de membro comum: submeter pedido → receber confirmação de status pendente
- [ ] Testar fluxo de membro do ministério: ver escalas → confirmar presença → não ver pedidos alheios
- [ ] Testar que admin do módulo vê todos os pedidos e escalas
- [ ] Testar notificações push em cada gatilho

---

## 15. Glossário

| Termo | Definição |
|---|---|
| Membro | Integrante da congregação cadastrado no SirvaOS |
| Escala | Atribuição de um membro a um evento com função definida |
| Módulo | Área funcional do sistema associada a um ministério |
| Tenant | Igreja/cliente que contratou o SirvaOS |
| AAB | Android App Bundle — formato de distribuição Android |
| EAS Build | Expo Application Services Build — serviço de build do Expo |
| RLS | Row Level Security — políticas de isolamento de dados no Supabase |
