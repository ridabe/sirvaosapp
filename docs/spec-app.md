# SPEC Técnico — SirvaOS App (Portal do Membro Mobile)

> **Documento:** Especificação Técnica e Arquitetura Funcional — App Mobile  
> **Produto:** SirvaOS App  
> **Versão:** 0.1  
> **Data:** Junho de 2026  
> **Status:** Rascunho técnico

---

## 1. Visão Geral da Arquitetura

O SirvaOS App é um aplicativo React Native/Expo que consume o mesmo backend Supabase do módulo web, respeitando as mesmas políticas RLS, Edge Functions e estrutura de dados já definidas. O app não possui servidor próprio — toda a lógica de negócio já está no backend compartilhado.

```
┌─────────────────────────────────────────────────────┐
│                  SirvaOS App (Expo)                  │
│                                                     │
│  ┌─────────────┐   ┌─────────────┐   ┌──────────┐  │
│  │  Expo Router│   │  UI Layer   │   │  State   │  │
│  │ (navegação) │   │ (NativeWind)│   │(Context) │  │
│  └──────┬──────┘   └──────┬──────┘   └────┬─────┘  │
│         └─────────────────┴───────────────┘        │
│                          │                          │
│              ┌───────────┴───────────┐              │
│              │   Supabase JS Client  │              │
│              └───────────┬───────────┘              │
└──────────────────────────┼──────────────────────────┘
                           │ HTTPS / JWT
         ┌─────────────────┼─────────────────┐
         │           Supabase                │
         │  ┌──────┐  ┌───────┐  ┌───────┐  │
         │  │ Auth │  │  DB   │  │Storage│  │
         │  │      │  │  RLS  │  │       │  │
         │  └──────┘  └───────┘  └───────┘  │
         │       ┌──────────────┐            │
         │       │Edge Functions│            │
         │       └──────────────┘            │
         └────────────────────────────────────┘
```

---

## 2. Stack e Dependências

### Core
```json
{
  "expo": "~52.x",
  "expo-router": "~4.x",
  "react-native": "0.76.x",
  "typescript": "~5.x"
}
```

### Backend
```json
{
  "@supabase/supabase-js": "^2.x",
  "expo-secure-store": "~14.x"
}
```

### UI
```json
{
  "nativewind": "^4.x",
  "tailwindcss": "^3.x",
  "expo-image": "~2.x",
  "react-native-safe-area-context": "^4.x",
  "react-native-screens": "^4.x"
}
```

### Notificações
```json
{
  "expo-notifications": "~0.29.x",
  "expo-device": "~7.x"
}
```

### Utilitários
```json
{
  "expo-constants": "~17.x",
  "expo-status-bar": "~2.x",
  "expo-splash-screen": "~0.29.x",
  "expo-font": "~13.x",
  "date-fns": "^4.x"
}
```

---

## 3. Estrutura de Pastas

```
SirvaOSApp/
├── app/                        # Expo Router — telas (file-based routing)
│   ├── (auth)/                 # Grupo de telas de autenticação (sem tab bar)
│   │   ├── login.tsx
│   │   ├── primeiro-acesso.tsx
│   │   └── recuperar-senha.tsx
│   ├── (app)/                  # Grupo de telas autenticadas
│   │   ├── _layout.tsx         # Tab navigator
│   │   ├── index.tsx           # Home / Dashboard
│   │   ├── perfil.tsx          # Perfil do membro
│   │   ├── notificacoes.tsx    # Central de notificações
│   │   └── modulos/            # Telas por módulo
│   │       ├── louvor/
│   │       │   ├── index.tsx   # Home do módulo Louvor
│   │       │   └── escala/[id].tsx
│   │       ├── financeiro/
│   │       │   └── index.tsx
│   │       ├── kids/
│   │       │   └── index.tsx
│   │       ├── escola-biblica/
│   │       │   └── index.tsx
│   │       └── acao-social/
│   │           └── index.tsx
│   └── _layout.tsx             # Root layout com providers
├── components/                 # Componentes reutilizáveis
│   ├── ui/                     # Componentes base (Button, Card, Badge, etc.)
│   ├── auth/                   # Formulários de autenticação
│   ├── home/                   # Componentes da home
│   ├── modules/                # Componentes por módulo
│   └── notifications/          # Componentes de notificação
├── lib/                        # Lógica de negócio e integrações
│   ├── supabase.ts             # Cliente Supabase configurado
│   ├── auth.ts                 # Funções de autenticação
│   ├── notifications.ts        # Registro e handling de push notifications
│   └── theme.ts                # Tokens de tema/cores
├── hooks/                      # Custom hooks
│   ├── useAuth.ts
│   ├── useMember.ts
│   ├── useModules.ts
│   └── useNotifications.ts
├── context/                    # React Context providers
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── types/                      # Tipos TypeScript
│   ├── database.ts             # Tipos gerados do Supabase schema
│   ├── member.ts
│   └── modules.ts
├── constants/                  # Constantes e configurações
│   ├── colors.ts
│   └── modules.ts
├── assets/                     # Assets estáticos
│   ├── images/                 # Logos e imagens
│   └── fonts/                  # Fontes customizadas (se houver)
├── docs/                       # Documentação do projeto
├── img/                        # Logos SVG do SirvaOS
├── .env.local                  # Variáveis de ambiente (não commitado)
├── app.json                    # Configuração Expo
├── eas.json                    # Configuração EAS Build
├── tailwind.config.js          # Configuração NativeWind
├── tsconfig.json
└── package.json
```

---

## 4. Variáveis de Ambiente

O app usa apenas variáveis públicas no bundle. O prefixo `EXPO_PUBLIC_` torna a variável acessível no código do app (equivalente ao `NEXT_PUBLIC_` do Next.js).

```bash
# .env.local
EXPO_PUBLIC_SUPABASE_URL=https://gaqkjsnomkdaghvwerlb.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_pCZdyEjASpcjSXzMieLizw_woLtzDu9
```

**Nunca incluir no app:**
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_PASS`
- Qualquer chave de API de terceiros com permissões de escrita irrestrita

---

## 5. Autenticação

### Cliente Supabase (`lib/supabase.ts`)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
```

### Fluxos de Autenticação

#### Login normal
1. Usuário informa e-mail e senha
2. `supabase.auth.signInWithPassword({ email, password })`
3. Em caso de sucesso: redirecionar para home
4. Em caso de erro: exibir mensagem adequada (credenciais inválidas, e-mail não confirmado, etc.)

#### Primeiro acesso
1. Usuário informa e-mail e seleciona "Primeiro acesso"
2. App chama Edge Function `first-access` com `action: 'start'` e `email`
3. Se o membro tem data de nascimento: exibir tela de confirmação de data
4. Backend retorna token curto
5. Usuário define senha
6. App chama `first-access` com `action: 'complete'`, token e nova senha
7. Backend cria perfil Auth, vincula `member_id`, registra auditoria
8. App faz login automático e redireciona para home

#### Recuperação de senha
1. Usuário informa e-mail
2. `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'sirvaosapp://reset-password' })`
3. Usuário recebe e-mail com link deep link
4. App abre a tela de redefinição com o token da URL
5. `supabase.auth.updateUser({ password: novasenha })`

### Proteção de Rotas

O `_layout.tsx` raiz verifica a sessão do Supabase Auth:
- Sem sessão: redirecionar para `/(auth)/login`
- Com sessão: carregar perfil do membro e redirecionar para `/(app)/`

---

## 6. Modelo de Dados (Leitura)

O app consome as mesmas tabelas do banco do módulo web, respeitando as políticas RLS. O membro autenticado só acessa os próprios dados.

### Tabelas relevantes para o app

```sql
-- Perfil do usuário autenticado
profiles (
  id uuid,
  email text,
  full_name text,
  avatar_url text,
  tenant_id uuid,
  member_id uuid,
  tenant_role text, -- 'member', 'owner', 'admin'
  global_role text,
  status text
)

-- Cadastro do membro
members (
  id uuid,
  tenant_id uuid,
  full_name text,
  email text,
  phone text,
  birth_date date,
  membership_status text,
  photo_url text
)

-- Módulos ativos do tenant
tenant_modules (
  id uuid,
  tenant_id uuid,
  module_id uuid,
  status text -- 'active', 'inactive'
)

-- Módulos da plataforma (catálogo)
platform_modules (
  id uuid,
  slug text, -- 'louvor', 'financeiro', 'kids', etc.
  name text,
  description text,
  icon text
)

-- Configuração do tenant (tema/white-label)
tenants (
  id uuid,
  name text,
  slug text,
  logo_main_url text,
  logo_compact_url text,
  primary_color text,
  secondary_color text,
  accent_color text
)
```

### Tabelas por módulo (a serem criadas nas próximas migrations)

```sql
-- Louvor
module_louvor_events       -- eventos/cultos/ensaios
module_louvor_scales       -- escalas de serviço
module_louvor_scale_members -- membro na escala com função
module_louvor_confirmations -- confirmação de presença

-- Financeiro
module_finance_contributions -- dízimos e ofertas do membro

-- Kids
module_kids_children       -- crianças vinculadas ao membro
module_kids_events         -- eventos do kids
module_kids_announcements  -- comunicados para pais

-- Escola Bíblica
module_ebd_classes         -- turmas
module_ebd_attendance      -- frequência do membro
module_ebd_materials       -- materiais da aula

-- Comunicados gerais
announcements              -- comunicados do tenant ou do módulo
```

---

## 7. Navegação (Expo Router)

### Estrutura de rotas

```
/                           → (auth)/login (sem sessão) | (app)/ (com sessão)

/(auth)/login               → Tela de login
/(auth)/primeiro-acesso     → Fluxo de primeiro acesso
/(auth)/recuperar-senha     → Recuperação de senha

/(app)/                     → Home (tab: Início)
/(app)/perfil               → Perfil do membro (tab: Perfil)
/(app)/notificacoes         → Central de notificações

/(app)/modulos/louvor/      → Home do módulo Louvor
/(app)/modulos/louvor/escala/[id] → Detalhe da escala
/(app)/modulos/financeiro/  → Histórico financeiro
/(app)/modulos/kids/        → Área kids para pais
/(app)/modulos/escola-biblica/ → Área EBD
/(app)/modulos/acao-social/ → Área voluntários
```

### Tab Navigator

A tab bar inferior tem 4 itens:

| Tab | Ícone | Rota |
|---|---|---|
| Início | home | `/(app)/` |
| Ministérios | grid | `/(app)/modulos` |
| Notificações | bell | `/(app)/notificacoes` |
| Perfil | user | `/(app)/perfil` |

---

## 8. Notificações Push

### Registro do dispositivo

1. No primeiro login bem-sucedido, solicitar permissão de notificação
2. Obter `ExpoPushToken` via `Notifications.getExpoPushTokenAsync()`
3. Salvar token na tabela `push_tokens` com `profile_id`, `platform` e `token`
4. Renovar token quando o Expo detectar mudança

### Tabela de tokens

```sql
push_tokens (
  id uuid,
  profile_id uuid,
  platform text,      -- 'android', 'ios'
  token text,         -- Expo Push Token
  active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
```

### Envio de notificações (backend)

O envio é feito via Edge Function que usa a API do Expo Push:

```
POST https://exp.host/--/api/v2/push/send
```

Os gatilhos de envio são:
- Admin de módulo publica uma escala → notifica membros escalados
- Evento em 24h → notifica membros com confirmação pendente
- Admin publica comunicado → notifica membros do módulo/tenant

### Handling no app

```typescript
// Notificação recebida com app em foreground: exibir in-app toast
// Notificação tocada com app em background/closed: navegar para a tela relevante
```

---

## 9. Tema e Design System

### Tokens de cor (`constants/colors.ts`)

```typescript
export const colors = {
  brand: {
    primary: '#0E6B68',
    primaryDark: '#084C4A',
    primarySoft: '#DDF1EE',
    accent: '#2BB3C0',
    accentSoft: '#E1F7FA',
  },
  neutral: {
    950: '#17201F',
    700: '#3D4A47',
    500: '#6B7774',
    300: '#B9C8C4',
    200: '#D9E3E0',
    100: '#EEF5F3',
    50: '#F7FAF9',
    white: '#FFFFFF',
  },
  semantic: {
    success: '#2F8A5F',
    successSoft: '#E3F5EC',
    warning: '#C98A13',
    warningSoft: '#FFF3D8',
    danger: '#C94A4A',
    dangerSoft: '#FBE4E4',
    info: '#3578A8',
    infoSoft: '#E5F1FA',
  },
}
```

### NativeWind (Tailwind para RN)

As classes Tailwind são mapeadas para os tokens do SirvaOS via `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#0E6B68',
        'primary-dark': '#084C4A',
        'primary-soft': '#DDF1EE',
        accent: '#2BB3C0',
        // ...
      },
    },
  },
}
```

### White-label (suporte futuro)

O `ThemeContext` carregará as cores do tenant a partir de `tenants.primary_color`, `tenants.secondary_color` e `tenants.accent_color`. Quando presentes, substituem os valores padrão do SirvaOS.

---

## 10. Build e CI/CD

### Configuração EAS (`eas.json`)

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": { "buildType": "apk" },
      "distribution": "internal"
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

### GitHub Actions — Build de Produção

`.github/workflows/build-android.yml`:

```yaml
name: Build Android AAB

on:
  push:
    branches: [main, release/**]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform android --profile production --non-interactive
        env:
          EXPO_PUBLIC_SUPABASE_URL: ${{ secrets.EXPO_PUBLIC_SUPABASE_URL }}
          EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY }}
      - name: Download AAB
        run: eas build:list --platform android --limit 1 --json > build-info.json
```

### Secrets necessários no repositório

| Secret | Valor |
|---|---|
| `EXPO_TOKEN` | Token da conta Expo (EAS) |
| `EXPO_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key do Supabase |

---

## 11. Segurança

### O que o app pode acessar
- Dados do próprio membro autenticado (RLS garante isolamento)
- Dados dos módulos dos quais o membro faz parte
- Configurações públicas do tenant (nome, cores, logo)
- Comunicados direcionados ao membro ou ao tenant

### O que o app não pode acessar
- Dados de outros membros
- Dados administrativos (tabelas sem policy para `member`)
- Dados financeiros de outros ou relatórios administrativos
- Qualquer dado de outro tenant

### Armazenamento seguro
- JWT da sessão: `expo-secure-store` (Keystore no Android)
- Nenhum dado sensível no `AsyncStorage`

### Auditoria
- Login registrado via trigger/function no Supabase
- Confirmações de presença registradas com `profile_id` e timestamp
- Exportação de dados e solicitações LGPD passam pela Edge Function

---

## 12. Tratamento de Erros

### Padrão de resposta de erro

```typescript
type AppError = {
  code: string
  message: string   // mensagem técnica para log
  userMessage: string // mensagem amigável para exibição
}
```

### Códigos de erro relevantes

| Código | Situação | Mensagem ao usuário |
|---|---|---|
| `AUTH_INVALID_CREDENTIALS` | E-mail ou senha incorretos | "E-mail ou senha incorretos." |
| `AUTH_EMAIL_NOT_FOUND` | E-mail não cadastrado como membro | "Não encontramos esse e-mail. Verifique com a secretaria da igreja." |
| `AUTH_FIRST_ACCESS_ACTIVE` | Perfil já ativo, tentando primeiro acesso | "Você já possui acesso. Use a opção Entrar ou recupere sua senha." |
| `AUTH_BIRTH_DATE_REQUIRED` | Data de nascimento obrigatória | "Informe sua data de nascimento para continuar." |
| `AUTH_BIRTH_DATE_MISMATCH` | Data não confere | "A data de nascimento não confere com o cadastro." |
| `NETWORK_ERROR` | Sem conexão | "Sem conexão. Verifique sua internet e tente novamente." |

---

## 13. Telas e Componentes Principais

### Login
- Input e-mail
- Input senha (com toggle de visibilidade)
- Botão "Entrar"
- Link "Primeiro acesso"
- Link "Esqueci minha senha"
- Logo SirvaOS centralizada

### Primeiro Acesso — Step 1
- Input e-mail
- Botão "Continuar"
- Explicação do fluxo

### Primeiro Acesso — Step 2 (data de nascimento, se aplicável)
- DatePicker nativo
- Botão "Confirmar"

### Primeiro Acesso — Step 3 (definir senha)
- Input nova senha (com requisitos visuais)
- Input confirmar senha
- Botão "Ativar minha conta"

### Home
- Header: saudação + nome + avatar
- Seção "Próximos eventos" (ScrollView horizontal)
- Seção "Meus ministérios" (cards de módulo)
- Seção "Comunicados recentes" (lista)
- Cards de admin de módulo (se aplicável)

### Card de Escala (componente)
- Data e hora
- Nome do evento
- Função/instrumento
- Badge de status (confirmado / pendente / recusado)
- Botão de confirmação inline

### Tela de Módulo (template base)
- Header com nome e ícone do módulo
- Conteúdo específico do módulo (escalas, frequência, etc.)
- Seção de comunicados do módulo

### Perfil
- Foto + nome + status de membro
- Data de ingresso
- Lista de ministérios vinculados
- Botão de edição básica
- Link para política de privacidade / exportação de dados

---

## 14. Decisões Técnicas Registradas

| Decisão | Motivo |
|---|---|
| Expo Router (file-based) em vez de React Navigation manual | Menor boilerplate, melhor DX, padrão atual do Expo |
| NativeWind em vez de StyleSheet puro | Consistência com os tokens do design system web, velocidade de desenvolvimento |
| SecureStore para token JWT | Mais seguro que AsyncStorage para credenciais |
| Sem backend próprio — consumir Supabase diretamente | Evitar duplicação de camada, aproveitar RLS e infra já em produção |
| EAS Build via GitHub Actions em vez de build local | Reprodutibilidade, rastreabilidade, integração futura com Google Play |
| Tipos TypeScript gerados pelo Supabase CLI | Segurança de tipos e sync automático com o schema do banco |

---

## 15. Próximas Decisões Pendentes

- Tipografia: usar fonte do sistema (padrão) ou adicionar fonte customizada (ex: Inter)?
- Modo escuro: implementar desde o MVP ou como evolução?
- Deep links: configurar para suportar reset de senha e notificações com navegação direta
- Google Play: definir conta de desenvolvedor, pacote (`com.sirvaos.app` ou `com.primeiraigreja.app`?) e política de privacidade publicada
- Push notifications: usar somente Expo Push Service ou adicionar FCM direto para maior controle?
- Expo SDK version: confirmar versão estável na data de início do desenvolvimento
