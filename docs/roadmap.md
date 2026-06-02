# Roadmap de Desenvolvimento — SirvaOS App

> **Documento:** Roadmap de Etapas  
> **Versão:** 1.0  
> **Data:** Junho de 2026  
> **Status:** Referência ativa de desenvolvimento

---

## Como usar este documento

Cada etapa tem um escopo fechado e critérios de conclusão. **Não avançar para a próxima etapa antes de concluir os critérios da atual.** O objetivo é manter foco, evitar retrabalho e garantir que cada etapa gera algo testável no dispositivo.

---

## Etapa 1 — Fundação do Projeto ✅ CONCLUÍDA

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
- [x] `npm install` executado com sucesso
- [x] `npx expo start` rodando no dispositivo/emulador sem erros

### Critérios de conclusão
- [x] App abre no dispositivo mostrando a tela de login (mesmo que vazia)
- [x] Nenhum erro de compilação ou import

### Notas técnicas
- NativeWind removido temporariamente: v4 tem conflito de dependências com SDK 54 no Expo Go (reanimated v4 → worklets → postcss async). Será reintegrado na Etapa 2 com configuração correta.
- Estilização provisória: StyleSheet puro nas telas placeholder.
- SDK 54 confirmado: expo-router 6.x, React 19.1, RN 0.81.5.

---

## Etapa 2 — Autenticação Completa ✅ CONCLUÍDA

**Objetivo:** Membro consegue fazer login, primeiro acesso e recuperar senha. A sessão persiste entre abertura e fechamento do app.

### Entregas
- [x] Tela de login com e-mail, senha, botões e logo SirvaOS
- [x] Validação de campos com feedback de erro
- [x] Integração com `supabase.auth.signInWithPassword`
- [x] Redirecionamento correto pós-login (home para membros)
- [x] Fluxo de primeiro acesso — 3 steps:
  - Step 1: informar e-mail
  - Step 2: confirmar data de nascimento (quando exigida)
  - Step 3: definir senha
  - Integração com Edge Function `first-access` (já deployada)
- [x] Tela de recuperação de senha (e-mail → link via Resend)
- [x] Logout funcional
- [x] Sessão persistida com SecureStore (app fecha e reabre logado)
- [x] Tratamento de erros com mensagens amigáveis (lista no SPEC seção 12)
- [x] Proteção de rotas: sem sessão → login; com sessão → home
- [x] Login com digital quando o celular do usuario permitir
- [x] fluxo para usar a camera do usuario para futuros modulos do sistema

### Critérios de conclusão
- [x] Membro real (cadastrado no banco) consegue fazer primeiro acesso pelo app
- [x] Membro consegue fazer login e logout
- [x] App reabre já logado sem pedir senha novamente
- [x] Erros de credencial exibem mensagem adequada (não "error" bruto)

---

## Etapa 3 — Home e Dashboard do Membro ✅ CONCLUÍDA

**Objetivo:** Após login, membro vê sua home personalizada com próximos eventos, seus ministérios e comunicados recentes.
Tambem todos os modulos que ele tem acesso com admin
### Dependências
- Etapa 2 concluída
- Tabelas `profiles`, `members`, `tenant_modules`, `platform_modules` populadas no banco

### Entregas
- [x] Header com saudação personalizada ("Olá, [nome]") e foto de perfil
- [x] Seção "Próximos eventos" — lista horizontal com cards de eventos dos ministérios do membro
- [x] Seção "Meus ministérios" — cards dos módulos em que o membro participa (dinâmico, vindo do banco)
- [x] Cards de admin de módulo — visíveis apenas para membros com papel em `tenant_module_admins`
- [x] Seção "Comunicados recentes" — últimos 3 comunicados do tenant e dos módulos do membro
- [x] Estado de carregamento (skeleton/loading) para cada seção
- [x] Estado vazio com mensagem quando não há dados
- [x] Estado offline com mensagem clara
- [x] Hook `useMember` para buscar dados do perfil e membro autenticado
- [x] Hook `useModules` para buscar módulos ativos do membro

### Critérios de conclusão
- [x] Home carrega e exibe dados reais do membro logado
- [x] Módulos exibidos correspondem ao tenant do membro
- [x] Scroll fluido sem travamentos

---

## Etapa 4 — Tela de Perfil do Membro ✅ CONCLUÍDA

**Objetivo:** Membro acessa e edita seus dados pessoais básicos; visualiza seus ministérios e dados de membresia.
Lembrando que os usuarios so terao acesso aos modulos basicos do sistema e aos modulos que estao classificados como admin daquele modulo, caso contrario nao par ser mostrado nem no menu

### Dependências
- Etapa 3 concluída

### Entregas
- [x] Foto de perfil com opção de troca (câmera/galeria → upload para Supabase Storage)
- [x] Nome completo, e-mail, telefone
- [x] Data de ingresso e status de membresia
- [x] Lista de ministérios vinculados
- [x] Edição de nome, telefone e foto
- [x] Botão de logout
- [x] Link para política de privacidade
- [x] Opção "Exportar meus dados" (via Edge Function ou e-mail)
- [x] Opção "Solicitar exclusão de conta"
- [x] DrawerMenu dinâmico — só exibe módulos para admins do módulo

### Critérios de conclusão
- [x] Membro visualiza seus dados reais
- [x] Alteração de foto persiste no Storage e reflete na home
- [x] Logout redireciona para login

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

## Etapa 8 — Versionamento, Polimento, Testes e Build de Produção

**Objetivo:** App pronto para distribuição interna, com sistema de atualização forçada/sugerida já funcionando antes do primeiro deploy na Play Store.

---

### 8.1 — Estratégia de Atualização do App (versão via Supabase)

#### Por que Supabase e não variável de ambiente?

O projeto mensagem_transformadora usa uma variável de ambiente no Vercel (`APP_VERSION_CODE`) servida por uma API route Next.js. Para o SirvaOS App a abordagem é mais simples e mais integrada: **a versão requerida fica diretamente no Supabase**, na tabela `app_config`. Vantagens:

- Sem dependência de um módulo web rodando para o app funcionar
- Atualizável pelo painel do Supabase (SQL Editor) ou futuramente pelo Admin Global SirvaOS
- Lido com o mesmo cliente Supabase já usado pelo app — sem fetch extra para URL externa
- A regra de RLS pode controlar quem lê (anon pode ler, apenas admin pode escrever)

#### Estrutura da tabela

```sql
-- Migration: app_config
create table public.app_config (
  key   text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- RLS: leitura pública (anon), escrita apenas service_role/admin
alter table public.app_config enable row level security;

create policy "app_config leitura publica"
  on public.app_config for select
  using (true);

-- Dado inicial
insert into public.app_config (key, value) values
  ('android_required_version_code', '1'),
  ('android_play_store_url', 'https://play.google.com/store/apps/details?id=com.sirvaos.app');
```

#### Lógica de comparação no app

```typescript
// hooks/useAppUpdate.ts
import Constants from 'expo-constants'
import { Alert, Linking } from 'react-native'
import { supabase } from '@/lib/supabase'

export function useAppUpdate() {
  async function checkForUpdate() {
    const currentCode = Constants.expoConfig?.android?.versionCode
    if (!currentCode) return

    const { data } = await supabase
      .from('app_config')
      .select('key, value')
      .in('key', ['android_required_version_code', 'android_play_store_url'])

    if (!data) return

    const config = Object.fromEntries(data.map(r => [r.key, r.value]))
    const requiredCode = parseInt(config.android_required_version_code ?? '0', 10)
    const storeUrl = config.android_play_store_url

    if (requiredCode > currentCode) {
      Alert.alert(
        'Atualização disponível',
        'Uma nova versão do SirvaOS está disponível na Play Store. Atualize para continuar usando o app.',
        [
          { text: 'Agora não', style: 'cancel' },
          { text: 'Atualizar agora', onPress: () => Linking.openURL(storeUrl) },
        ],
        { cancelable: false }  // impede fechar pelo botão voltar se for atualização obrigatória
      )
    }
  }

  return { checkForUpdate }
}
```

#### Onde chamar o hook

No `app/_layout.tsx`, dentro do `RootLayoutNav`, logo após confirmar que há sessão ativa:

```typescript
const { checkForUpdate } = useAppUpdate()

useEffect(() => {
  if (!loading && session) {
    checkForUpdate()
  }
}, [session, loading])
```

#### Fluxo completo de uma nova versão

```
1. Dev incrementa versionCode no app.json (ex: 1 → 2)
2. Push para main → GitHub Actions compila o AAB automaticamente
3. Dev faz upload do AAB para o Google Play (trilha interna → produção)
4. Google Play aprova a versão
5. Dev atualiza o banco:
   UPDATE public.app_config
   SET value = '2', updated_at = now()
   WHERE key = 'android_required_version_code';
6. Na próxima abertura do app por qualquer usuário, o hook detecta
   requiredCode (2) > currentCode (1) e exibe o alerta
7. Usuário toca "Atualizar agora" → abre Play Store na página do app
```

#### Diferença entre atualização sugerida e obrigatória

Controlar via banco adicionando uma segunda chave:

| Chave | Valor | Comportamento |
|---|---|---|
| `android_required_version_code` | Código mínimo obrigatório | Modal sem botão "Agora não" (force update) |
| `android_recommended_version_code` | Código recomendado | Modal com botão "Agora não" (soft update) |

Implementar os dois: se `requiredCode > currentCode` → force; se apenas `recommendedCode > currentCode` → soft.

---

### 8.2 — Entregas de Polimento e Build

- [ ] Migration da tabela `app_config` com valores iniciais no Supabase
- [ ] Hook `useAppUpdate` implementado (`hooks/useAppUpdate.ts`)
- [ ] Hook chamado no `_layout.tsx` após sessão confirmada
- [ ] Suporte a force update (sem botão "Agora não") e soft update
- [ ] Testar fluxo: alterar `android_required_version_code` no banco e confirmar que alerta aparece
- [ ] Splash screen com logo SirvaOS e fundo `#0E6B68`
- [ ] Ícone do app (adaptive icon Android)
- [ ] Ícone de notificação
- [ ] Animações e transições suaves entre telas
- [ ] Verificação de acessibilidade (contraste, tamanho de toque mínimo 44px)
- [ ] Modo offline: dados em cache com feedback claro
- [ ] Testes manuais dos fluxos críticos (login, primeiro acesso, escala, confirmação, push, atualização)
- [ ] Build `preview` (APK) para testes internos via EAS
- [ ] Build `production` (AAB) via GitHub Actions
- [ ] Configurar secrets no GitHub (`EXPO_TOKEN`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
- [ ] Revisão de segurança: nenhuma chave sensível no bundle

### Critérios de conclusão
- APK instala e funciona em ao menos 3 dispositivos físicos diferentes
- Build AAB gerado via GitHub Actions sem erros
- Alerta de atualização aparece corretamente ao simular versão defasada
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
[1] Fundação                    ✅ CONCLUÍDA
[2] Autenticação                ✅ CONCLUÍDA
[3] Home / Dashboard            ✅ CONCLUÍDA
[4] Perfil
[5] Notificações Push
[6] Módulo Louvor               ← Primeiro módulo operacional completo
[7] Módulos Financeiro / Kids / EBD / Ação Social
[8] Versionamento + Polimento + Build de Produção
[9] Google Play — lançamento interno
```

---

## Regras de foco

- **Uma etapa por vez.** Não iniciar a etapa N+1 antes de todos os critérios da etapa N estarem marcados.
- **Sem funcionalidades extras.** Se surgir uma ideia durante o desenvolvimento, anotar aqui na seção "Backlog" — não implementar na mesma etapa.
- **Testar no dispositivo físico.** Não validar só no emulador.
- **Migrations do banco são coordenadas.** As tabelas de módulo (Etapas 6 e 7) devem ser criadas em sincronia com o módulo web para não divergir o schema.
- **Versionamento é um processo, não só código.** A cada nova versão: (1) incrementar `versionCode` no `app.json`, (2) gerar AAB via GitHub Actions, (3) subir para Play Store, (4) após aprovação atualizar `android_required_version_code` na tabela `app_config` do Supabase. Os 4 passos são obrigatórios — pular o 4 significa que usuários não serão notificados da atualização.

---

## Backlog (ideias para fases futuras)

- Modo escuro
- White-label por tenant (cores e logo carregados do banco)
- Check-in com QR Code
- Chat entre membros do mesmo ministério
- Relatórios visuais (gráfico de frequência)
- Suporte iOS
- Biblioteca de materiais
