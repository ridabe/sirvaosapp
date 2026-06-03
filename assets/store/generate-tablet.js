// Gerador de screenshots para tablet 7" — SirvaOS
// Formato: 1280×800px landscape (16:10, dentro dos limites 16:9–9:16 do Play Store)
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const OUT = path.join(__dirname)

const C = {
  primary:     '#0E6B68',
  primaryDark: '#084C4A',
  primarySoft: '#DDF1EE',
  logoStroke:  '#087C7A',
  logoBg:      '#E0F6F4',
  accent:      '#00A7C4',
  accentSoft:  '#DDF7FC',
  neutral50:   '#F7FAF9',
  neutral100:  '#EEF5F3',
  neutral200:  '#D9E3E0',
  neutral500:  '#6B7774',
  neutral700:  '#3D4A47',
  neutral950:  '#17201F',
  dark:        '#162423',
  white:       '#FFFFFF',
  success:     '#2F8A5F',
  successSoft: '#E3F5EC',
  danger:      '#C94A4A',
}

function rect(x, y, w, h, fill, rx = 0) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" rx="${rx}"/>`
}
function circle(cx, cy, r, fill, opacity = 1) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${opacity}"/>`
}
function logoMark(x, y, size = 80) {
  const scale = size / 512
  return `<g transform="translate(${x},${y}) scale(${scale})">
    <rect width="512" height="512" rx="126" fill="${C.logoBg}"/>
    <path d="M352 135 C229 68 99 140 112 261 C124 360 261 352 256 256 C251 174 389 179 403 271 C415 396 274 470 143 398"
          fill="none" stroke="${C.logoStroke}" stroke-width="54" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="112" cy="261" r="32" fill="${C.accent}"/>
    <circle cx="403" cy="271" r="32" fill="${C.accent}"/>
  </g>`
}

// ─── Tablet 1 — Home / Dashboard (landscape 1280×800) ─────────────────────────
function tabletHome() {
  const W = 1280, H = 800
  const SIDEBAR = 240   // largura da sidebar lateral (simulando drawer fixo)
  const CONTENT = W - SIDEBAR
  const PAD = 28

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><filter id="s"><feDropShadow dx="0" dy="2" stdDeviation="6" flood-opacity="0.08"/></filter></defs>

    <!-- Fundo -->
    ${rect(0, 0, W, H, C.neutral50)}

    <!-- ─── Sidebar ─────────────────────────────────────────────────────── -->
    ${rect(0, 0, SIDEBAR, H, C.white)}
    <rect x="${SIDEBAR}" y="0" width="1" height="${H}" fill="${C.neutral200}"/>

    <!-- Logo na sidebar -->
    ${logoMark(16, 16, 44)}
    <text x="72" y="44" font-family="Inter,sans-serif" font-size="22" font-weight="850" fill="${C.dark}">Sirva<tspan fill="${C.accent}">OS</tspan></text>

    <!-- Divider -->
    <rect x="12" y="72" width="${SIDEBAR-24}" height="1" fill="${C.neutral100}"/>

    <!-- Avatar + nome -->
    <circle cx="36" cy="108" r="22" fill="${C.primarySoft}"/>
    <text x="36" y="114" font-family="Inter,sans-serif" font-size="18" font-weight="700" fill="${C.primary}" text-anchor="middle">JC</text>
    <text x="68" y="104" font-family="Inter,sans-serif" font-size="14" font-weight="600" fill="${C.neutral950}">João Carlos</text>
    <text x="68" y="120" font-family="Inter,sans-serif" font-size="12" fill="${C.neutral500}">Membro Ativo</text>

    <rect x="12" y="140" width="${SIDEBAR-24}" height="1" fill="${C.neutral100}"/>

    <!-- Nav items -->
    ${[
      { icon: '🏠', label: 'Início', active: true, y: 158 },
      { icon: '🎵', label: 'Louvor', active: false, y: 196 },
      { icon: '💰', label: 'Financeiro', active: false, y: 234 },
      { icon: '🧒', label: 'Kids', active: false, y: 272 },
      { icon: '📖', label: 'Escola Bíblica', active: false, y: 310 },
      { icon: '🙏', label: 'Intercessão', active: false, y: 348 },
    ].map(item => `
      ${item.active ? rect(8, item.y-2, SIDEBAR-16, 34, C.primarySoft, 8) : ''}
      <text x="24" y="${item.y+20}" font-family="Arial" font-size="18">${item.icon}</text>
      <text x="50" y="${item.y+20}" font-family="Inter,sans-serif" font-size="14" font-weight="${item.active?'600':'400'}" fill="${item.active?C.primary:C.neutral700}">${item.label}</text>
    `).join('')}

    <rect x="12" y="400" width="${SIDEBAR-24}" height="1" fill="${C.neutral100}"/>
    <text x="24" y="432" font-family="Arial" font-size="18">👤</text>
    <text x="50" y="432" font-family="Inter,sans-serif" font-size="14" fill="${C.neutral700}">Meu Perfil</text>
    <text x="24" y="466" font-family="Arial" font-size="18">🔔</text>
    <text x="50" y="466" font-family="Inter,sans-serif" font-size="14" fill="${C.neutral700}">Notificações</text>

    <!-- ─── Header área principal ────────────────────────────────────────── -->
    ${rect(SIDEBAR, 0, CONTENT, 56, C.primary)}
    <text x="${SIDEBAR + 24}" y="34" font-family="Inter,sans-serif" font-size="20" font-weight="600" fill="${C.white}">Início</text>
    <text x="${W-24}" y="34" font-family="Arial" font-size="22" fill="${C.white}" text-anchor="end">🔔</text>

    <!-- ─── Conteúdo em duas colunas ──────────────────────────────────────── -->
    <!-- Coluna esquerda: saudação + próximos eventos -->
    <!-- Saudação -->
    ${rect(SIDEBAR+PAD, 72, 460, 70, C.white, 14)}
    <rect x="${SIDEBAR+PAD}" y="72" width="460" height="70" fill="${C.white}" rx="14" filter="url(#s)"/>
    <text x="${SIDEBAR+PAD+16}" y="102" font-family="Inter,sans-serif" font-size="14" fill="${C.neutral500}">Bem-vindo de volta,</text>
    <text x="${SIDEBAR+PAD+16}" y="126" font-family="Inter,sans-serif" font-size="22" font-weight="700" fill="${C.neutral950}">Olá, João 👋</text>

    <!-- Próximos eventos -->
    <text x="${SIDEBAR+PAD}" y="166" font-family="Inter,sans-serif" font-size="16" font-weight="700" fill="${C.neutral950}">Próximos eventos</text>
    ${[
      { title:'Culto de Domingo', sub:'Dom, 08 Jun · 09:00 · Guitarra', status:'✓ Confirmado', sbg: C.successSoft, sc: C.success, bar: C.primary, y: 178 },
      { title:'Ensaio Semanal', sub:'Qua, 11 Jun · 19:30 · Louvor', status:'Pendente', sbg:'#FFF3D8', sc:'#C98A13', bar: C.accent, y: 240 },
      { title:'Culto Noturno', sub:'Dom, 15 Jun · 18:30 · Guitarra', status:'Aguardando', sbg: C.neutral100, sc: C.neutral500, bar: C.neutral300, y: 302 },
    ].map(e => `
      ${rect(SIDEBAR+PAD, e.y, 460, 56, C.white, 12)}
      <rect x="${SIDEBAR+PAD}" y="${e.y}" width="460" height="56" fill="${C.white}" rx="12" filter="url(#s)"/>
      ${rect(SIDEBAR+PAD, e.y, 5, 56, e.bar, 3)}
      <text x="${SIDEBAR+PAD+18}" y="${e.y+22}" font-family="Inter,sans-serif" font-size="14" font-weight="600" fill="${C.neutral950}">${e.title}</text>
      <text x="${SIDEBAR+PAD+18}" y="${e.y+40}" font-family="Inter,sans-serif" font-size="12" fill="${C.neutral500}">${e.sub}</text>
      ${rect(SIDEBAR+PAD+460-120, e.y+10, 110, 28, e.sbg, 14)}
      <text x="${SIDEBAR+PAD+460-65}" y="${e.y+29}" font-family="Inter,sans-serif" font-size="11" font-weight="600" fill="${e.sc}" text-anchor="middle">${e.status}</text>
    `).join('')}

    <!-- Coluna direita: módulos grid -->
    <text x="${SIDEBAR+PAD+492}" y="82" font-family="Inter,sans-serif" font-size="16" font-weight="700" fill="${C.neutral950}">Meus ministérios</text>
    ${[
      { icon:'🎵', label:'Louvor', sub:'3 escalas', x:0, y:0 },
      { icon:'💰', label:'Financeiro', sub:'R$ 480', x:1, y:0 },
      { icon:'🧒', label:'Kids', sub:'2 crianças', x:0, y:1 },
      { icon:'📖', label:'Escola Bíblica', sub:'Adultos', x:1, y:1 },
      { icon:'🙏', label:'Intercessão', sub:'2 torres', x:0, y:2 },
      { icon:'🤝', label:'Ação Social', sub:'1 escala', x:1, y:2 },
    ].map(m => {
      const mx = SIDEBAR + PAD + 492 + m.x * 260
      const my = 96 + m.y * 120
      return `
        ${rect(mx, my, 240, 104, C.white, 14)}
        <rect x="${mx}" y="${my}" width="240" height="104" fill="${C.white}" rx="14" filter="url(#s)"/>
        ${logoMark(mx+10, my+12, 36)}
        <text x="${mx+60}" y="${my+36}" font-family="Arial" font-size="28">${m.icon}</text>
        <text x="${mx+16}" y="${my+72}" font-family="Inter,sans-serif" font-size="16" font-weight="600" fill="${C.neutral950}">${m.label}</text>
        <text x="${mx+16}" y="${my+90}" font-family="Inter,sans-serif" font-size="12" fill="${C.neutral500}">${m.sub}</text>
      `
    }).join('')}

    <!-- Comunicados no rodapé -->
    ${rect(SIDEBAR+PAD, 380, 460, 48, C.white, 12)}
    <rect x="${SIDEBAR+PAD}" y="380" width="460" height="48" fill="${C.white}" rx="12" filter="url(#s)"/>
    <text x="${SIDEBAR+PAD+16}" y="400" font-family="Inter,sans-serif" font-size="13" fill="${C.neutral500}">COMUNICADO</text>
    <text x="${SIDEBAR+PAD+16}" y="419" font-family="Inter,sans-serif" font-size="14" font-weight="600" fill="${C.neutral950}">Reunião de líderes — 15 Jun · Presença obrigatória</text>

    <!-- Status bar / borda superior tablet -->
    ${rect(0, 0, W, 0, C.primary)}
  </svg>`
}

// ─── Tablet 2 — Módulo Louvor (landscape 1280×800) ───────────────────────────
function tabletLouvor() {
  const W = 1280, H = 800
  const SIDEBAR = 240
  const CONTENT = W - SIDEBAR
  const PAD = 28

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><filter id="s"><feDropShadow dx="0" dy="2" stdDeviation="6" flood-opacity="0.08"/></filter></defs>

    ${rect(0, 0, W, H, C.neutral50)}

    <!-- Sidebar -->
    ${rect(0, 0, SIDEBAR, H, C.white)}
    <rect x="${SIDEBAR}" y="0" width="1" height="${H}" fill="${C.neutral200}"/>
    ${logoMark(16, 16, 44)}
    <text x="72" y="44" font-family="Inter,sans-serif" font-size="22" font-weight="850" fill="${C.dark}">Sirva<tspan fill="${C.accent}">OS</tspan></text>
    <rect x="12" y="72" width="${SIDEBAR-24}" height="1" fill="${C.neutral100}"/>
    <circle cx="36" cy="108" r="22" fill="${C.primarySoft}"/>
    <text x="36" y="114" font-family="Inter,sans-serif" font-size="18" font-weight="700" fill="${C.primary}" text-anchor="middle">JC</text>
    <text x="68" y="104" font-family="Inter,sans-serif" font-size="14" font-weight="600" fill="${C.neutral950}">João Carlos</text>
    <text x="68" y="120" font-family="Inter,sans-serif" font-size="12" fill="${C.neutral500}">Membro Ativo</text>
    <rect x="12" y="140" width="${SIDEBAR-24}" height="1" fill="${C.neutral100}"/>
    ${[
      { icon: '🏠', label: 'Início', active: false, y: 158 },
      { icon: '🎵', label: 'Louvor', active: true, y: 196 },
      { icon: '💰', label: 'Financeiro', active: false, y: 234 },
      { icon: '🧒', label: 'Kids', active: false, y: 272 },
      { icon: '📖', label: 'Escola Bíblica', active: false, y: 310 },
      { icon: '🙏', label: 'Intercessão', active: false, y: 348 },
    ].map(item => `
      ${item.active ? rect(8, item.y-2, SIDEBAR-16, 34, C.primarySoft, 8) : ''}
      <text x="24" y="${item.y+20}" font-family="Arial" font-size="18">${item.icon}</text>
      <text x="50" y="${item.y+20}" font-family="Inter,sans-serif" font-size="14" font-weight="${item.active?'600':'400'}" fill="${item.active?C.primary:C.neutral700}">${item.label}</text>
    `).join('')}

    <!-- Header -->
    ${rect(SIDEBAR, 0, CONTENT, 56, C.primary)}
    ${logoMark(SIDEBAR+16, 8, 38)}
    <text x="${SIDEBAR+68}" y="22" font-family="Inter,sans-serif" font-size="20" font-weight="700" fill="${C.white}">Louvor</text>
    <text x="${SIDEBAR+68}" y="40" font-family="Inter,sans-serif" font-size="13" fill="rgba(255,255,255,0.8)">Ministério de Louvor · 12 membros</text>

    <!-- Tabs -->
    ${rect(SIDEBAR+PAD, 68, 148, 36, C.primarySoft, 18)}
    <text x="${SIDEBAR+PAD+74}" y="92" font-family="Inter,sans-serif" font-size="14" font-weight="700" fill="${C.primary}" text-anchor="middle">Escalas</text>
    <text x="${SIDEBAR+PAD+220}" y="92" font-family="Inter,sans-serif" font-size="14" fill="${C.neutral500}" text-anchor="middle">Histórico</text>
    <text x="${SIDEBAR+PAD+370}" y="92" font-family="Inter,sans-serif" font-size="14" fill="${C.neutral500}" text-anchor="middle">Comunicados</text>

    <!-- Escalas - 2 colunas -->
    <text x="${SIDEBAR+PAD}" y="126" font-family="Inter,sans-serif" font-size="13" font-weight="600" fill="${C.neutral500}">JUNHO 2025</text>
    ${[
      { title:'Culto de Domingo — Manhã', sub:'Dom, 08 Jun · 08:30 · Guitarra base', status:'✓ Confirmado', sbg:C.successSoft, sc:C.success, bar:C.primary, col:0, row:0 },
      { title:'Ensaio — Quarta-feira', sub:'Qua, 11 Jun · 19:30 · Guitarra base', status:'Pendente', sbg:'#FFF3D8', sc:'#C98A13', bar:C.accent, col:1, row:0 },
      { title:'Culto de Domingo — Manhã', sub:'Dom, 15 Jun · 08:30 · Guitarra base', status:'Aguardando', sbg:C.neutral100, sc:C.neutral500, bar:C.primary, col:0, row:1 },
      { title:'Culto de Domingo — Noite', sub:'Dom, 15 Jun · 18:30 · Guitarra solo', status:'Aguardando', sbg:C.neutral100, sc:C.neutral500, bar:C.primary, col:1, row:1 },
      { title:'Culto de Domingo — Manhã', sub:'Dom, 22 Jun · 08:30 · Guitarra base', status:'Aguardando', sbg:C.neutral100, sc:C.neutral500, bar:C.primary, col:0, row:2 },
      { title:'Ensaio — Quarta-feira', sub:'Qua, 25 Jun · 19:30 · Guitarra base', status:'Aguardando', sbg:C.neutral100, sc:C.neutral500, bar:C.neutral300, col:1, row:2 },
    ].map(e => {
      const ex = SIDEBAR + PAD + e.col * (490 + PAD)
      const ey = 138 + e.row * 82
      return `
        ${rect(ex, ey, 490, 70, C.white, 12)}
        <rect x="${ex}" y="${ey}" width="490" height="70" fill="${C.white}" rx="12" filter="url(#s)"/>
        ${rect(ex, ey, 5, 70, e.bar, 3)}
        <text x="${ex+18}" y="${ey+24}" font-family="Inter,sans-serif" font-size="14" font-weight="600" fill="${C.neutral950}">${e.title}</text>
        <text x="${ex+18}" y="${ey+44}" font-family="Inter,sans-serif" font-size="12" fill="${C.neutral500}">${e.sub}</text>
        ${rect(ex+490-115, ey+10, 105, 26, e.sbg, 13)}
        <text x="${ex+490-62}" y="${ey+28}" font-family="Inter,sans-serif" font-size="11" font-weight="600" fill="${e.sc}" text-anchor="middle">${e.status}</text>
      `
    }).join('')}
  </svg>`
}

// ─── Tablet 3 — Intercessão + Perfil split view ──────────────────────────────
function tabletIntercession() {
  const W = 1280, H = 800
  const SIDEBAR = 240
  const CONTENT = W - SIDEBAR
  const PAD = 28
  const COL_W = (CONTENT - PAD * 3) / 2

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><filter id="s"><feDropShadow dx="0" dy="2" stdDeviation="6" flood-opacity="0.08"/></filter></defs>

    ${rect(0, 0, W, H, C.neutral50)}

    <!-- Sidebar -->
    ${rect(0, 0, SIDEBAR, H, C.white)}
    <rect x="${SIDEBAR}" y="0" width="1" height="${H}" fill="${C.neutral200}"/>
    ${logoMark(16, 16, 44)}
    <text x="72" y="44" font-family="Inter,sans-serif" font-size="22" font-weight="850" fill="${C.dark}">Sirva<tspan fill="${C.accent}">OS</tspan></text>
    <rect x="12" y="72" width="${SIDEBAR-24}" height="1" fill="${C.neutral100}"/>
    <circle cx="36" cy="108" r="22" fill="${C.primarySoft}"/>
    <text x="36" y="114" font-family="Inter,sans-serif" font-size="18" font-weight="700" fill="${C.primary}" text-anchor="middle">JC</text>
    <text x="68" y="104" font-family="Inter,sans-serif" font-size="14" font-weight="600" fill="${C.neutral950}">João Carlos</text>
    <text x="68" y="120" font-family="Inter,sans-serif" font-size="12" fill="${C.neutral500}">Membro Ativo</text>
    <rect x="12" y="140" width="${SIDEBAR-24}" height="1" fill="${C.neutral100}"/>
    ${[
      { icon: '🏠', label: 'Início', active: false, y: 158 },
      { icon: '🎵', label: 'Louvor', active: false, y: 196 },
      { icon: '💰', label: 'Financeiro', active: false, y: 234 },
      { icon: '🧒', label: 'Kids', active: false, y: 272 },
      { icon: '📖', label: 'Escola Bíblica', active: false, y: 310 },
      { icon: '🙏', label: 'Intercessão', active: true, y: 348 },
    ].map(item => `
      ${item.active ? rect(8, item.y-2, SIDEBAR-16, 34, C.primarySoft, 8) : ''}
      <text x="24" y="${item.y+20}" font-family="Arial" font-size="18">${item.icon}</text>
      <text x="50" y="${item.y+20}" font-family="Inter,sans-serif" font-size="14" font-weight="${item.active?'600':'400'}" fill="${item.active?C.primary:C.neutral700}">${item.label}</text>
    `).join('')}

    <!-- Header -->
    ${rect(SIDEBAR, 0, CONTENT, 56, C.primary)}
    <text x="${SIDEBAR+24}" y="34" font-family="Inter,sans-serif" font-size="20" font-weight="600" fill="${C.white}">Intercessão</text>

    <!-- Coluna esquerda: Torres -->
    <text x="${SIDEBAR+PAD}" y="80" font-family="Inter,sans-serif" font-size="15" font-weight="700" fill="${C.neutral950}">Minhas Torres</text>
    ${[
      { title:'Torre da Manhã', sub:'Seg, 09 Jun · 06:00–08:00 · Sala de Oração', status:'✓ Confirmado', sbg:C.successSoft, sc:C.success, bar:C.accent, y:0 },
      { title:'Torre da Noite', sub:'Qua, 11 Jun · 22:00–00:00 · Sala de Oração', status:'Confirmar', sbg:C.primary, sc:C.white, bar:C.primary, y:1, btn:true },
      { title:'Torre da Tarde', sub:'Sex, 13 Jun · 14:00–16:00 · Sala de Oração', status:'Aguardando', sbg:C.neutral100, sc:C.neutral500, bar:C.neutral300, y:2 },
      { title:'Torre da Manhã', sub:'Seg, 16 Jun · 06:00–08:00 · Sala de Oração', status:'Aguardando', sbg:C.neutral100, sc:C.neutral500, bar:C.neutral300, y:3 },
    ].map(e => {
      const ey = 92 + e.y * 86
      return `
        ${rect(SIDEBAR+PAD, ey, COL_W, 74, C.white, 12)}
        <rect x="${SIDEBAR+PAD}" y="${ey}" width="${COL_W}" height="74" fill="${C.white}" rx="12" filter="url(#s)"/>
        ${rect(SIDEBAR+PAD, ey, 5, 74, e.bar, 3)}
        <text x="${SIDEBAR+PAD+18}" y="${ey+24}" font-family="Inter,sans-serif" font-size="14" font-weight="600" fill="${C.neutral950}">${e.title}</text>
        <text x="${SIDEBAR+PAD+18}" y="${ey+44}" font-family="Inter,sans-serif" font-size="12" fill="${C.neutral500}">${e.sub}</text>
        ${rect(SIDEBAR+PAD+COL_W-120, ey+12, 110, 28, e.sbg, 14)}
        <text x="${SIDEBAR+PAD+COL_W-65}" y="${ey+31}" font-family="Inter,sans-serif" font-size="11" font-weight="600" fill="${e.sc}" text-anchor="middle">${e.status}</text>
      `
    }).join('')}

    <!-- Coluna direita: Pedidos -->
    <text x="${SIDEBAR+PAD+COL_W+PAD}" y="80" font-family="Inter,sans-serif" font-size="15" font-weight="700" fill="${C.neutral950}">Pedidos de Oração</text>
    ${[
      { title:'Cura para minha família', sub:'Enviado em 02 Jun', status:'Aprovado', sbg:C.successSoft, sc:C.success, y:0 },
      { title:'Direção para decisão', sub:'Enviado em 05 Jun', status:'Pendente', sbg:'#FFF3D8', sc:'#C98A13', y:1 },
    ].map(e => {
      const ex = SIDEBAR + PAD + COL_W + PAD
      const ey = 92 + e.y * 86
      return `
        ${rect(ex, ey, COL_W, 74, C.white, 12)}
        <rect x="${ex}" y="${ey}" width="${COL_W}" height="74" fill="${C.white}" rx="12" filter="url(#s)"/>
        <text x="${ex+16}" y="${ey+24}" font-family="Inter,sans-serif" font-size="14" font-weight="600" fill="${C.neutral950}">${e.title}</text>
        <text x="${ex+16}" y="${ey+44}" font-family="Inter,sans-serif" font-size="12" fill="${C.neutral500}">${e.sub}</text>
        ${rect(ex+16, ey+50, 90, 18, e.sbg, 9)}
        <text x="${ex+61}" y="${ey+63}" font-family="Inter,sans-serif" font-size="11" font-weight="600" fill="${e.sc}" text-anchor="middle">${e.status}</text>
      `
    }).join('')}

    <!-- Botão enviar pedido -->
    ${rect(SIDEBAR+PAD+COL_W+PAD, 268, COL_W, 52, C.primary, 12)}
    <text x="${SIDEBAR+PAD+COL_W+PAD+COL_W/2}" y="300" font-family="Inter,sans-serif" font-size="15" font-weight="600" fill="${C.white}" text-anchor="middle">🙏  Enviar pedido de oração</text>
  </svg>`
}

async function main() {
  const toPNG = (svgStr, outFile) =>
    sharp(Buffer.from(svgStr)).png().toFile(path.join(OUT, outFile))

  await toPNG(tabletHome(), 'tablet-7-1.png')
  console.log('✅ tablet-7-1.png (Home)')
  await toPNG(tabletLouvor(), 'tablet-7-2.png')
  console.log('✅ tablet-7-2.png (Louvor)')
  await toPNG(tabletIntercession(), 'tablet-7-3.png')
  console.log('✅ tablet-7-3.png (Intercessão)')
  console.log('\n🎉 Tablets 7" gerados em assets/store/')
}

main().catch(console.error)
