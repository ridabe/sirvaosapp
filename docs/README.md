# Documentação — SirvaOS App

> **Projeto:** SirvaOS App — Portal do Membro Mobile  
> **Plataforma:** Android (Expo / React Native)  
> **Última atualização:** Junho de 2026

---

## Sobre o Projeto

O SirvaOS App é o aplicativo mobile do Portal do Membro do SirvaOS. Ele é a versão nativa Android (e futuramente iOS) do portal do membro disponível na plataforma web, consumindo o mesmo backend Supabase.

O app permite que membros da igreja acompanhem escalas, eventos, comunicados e informações dos ministérios dos quais participam — diretamente pelo celular, com notificações push.

---

## Documentação do Projeto

| Documento | Descrição |
|---|---|
| [PRD do App](./prd-app.md) | Requisitos de produto, funcionalidades, métricas e roadmap |
| [SPEC Técnico](./spec-app.md) | Arquitetura, stack, estrutura de pastas, autenticação, build e decisões técnicas |
| [Identidade Visual](./identidade-visual.md) | Paleta de cores, tokens e direção visual do SirvaOS |
| [Catálogo de Módulos](./modulos.md) | Lista de todos os módulos previstos por fase |
| [Supabase](./supabase.md) | Backend compartilhado: banco, migrations, RLS e Edge Functions |

---

## Backend

O app usa o mesmo Supabase do módulo web. As credenciais estão em `.env.local` (não commitado).

Variáveis necessárias no app:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://...supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Nunca incluir no app: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASS` ou qualquer chave privada.

---

## Começar

```bash
npm install
npx expo start
```

Para build Android (AAB de produção), ver [SPEC Técnico — seção 10](./spec-app.md).
