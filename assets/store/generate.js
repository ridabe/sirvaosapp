// Gerador de assets para o Google Play Store — identidade visual correta SirvaOS
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const OUT = path.join(__dirname)

// ─── Paleta SirvaOS ───────────────────────────────────────────────────────────
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
  neutral300:  '#B9C8C4',
  neutral500:  '#6B7774',
  neutral700:  '#3D4A47',
  neutral950:  '#17201F',
  dark:        '#162423',
  white:       '#FFFFFF',
  success:     '#2F8A5F',
  successSoft: '#E3F5EC',
  danger:      '#C94A4A',
}

// ─── Logo mark SVG (S-curve, identidade SirvaOS) ────────────────────────────
// Versão escalável do app-icon-sirvaos.svg
function logoMark(x, y, size = 120) {
  // O ícone original é 512×512, a path ocupa a área central
  const scale = size / 512
  return `<g transform="translate(${x},${y}) scale(${scale})">
    <rect width="512" height="512" rx="126" fill="${C.logoBg}"/>
    <path d="M352 135 C229 68 99 140 112 261 C124 360 261 352 256 256 C251 174 389 179 403 271 C415 396 274 470 143 398"
          fill="none" stroke="${C.logoStroke}" stroke-width="54" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="112" cy="261" r="32" fill="${C.accent}"/>
    <circle cx="403" cy="271" r="32" fill="${C.accent}"/>
  </g>`
}

// Wordmark "SirvaOS" com "OS" em accent
function wordmark(x, y, size = 80, darkBg = false) {
  const fill = darkBg ? C.white : C.dark
  return `<text x="${x}" y="${y}" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="${size}" font-weight="850" fill="${fill}" letter-spacing="-1">Sirva<tspan fill="${C.accent}">OS</tspan></text>`
}

function tagline(x, y, size = 26, darkBg = false) {
  const fill = darkBg ? C.accentSoft : C.logoStroke
  return `<text x="${x}" y="${y}" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="${size}" font-weight="600" fill="${fill}">organize para servir melhor</text>`
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rect(x, y, w, h, fill, rx = 0) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" rx="${rx}"/>`
}
function circle(cx, cy, r, fill, opacity = 1) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${opacity}"/>`
}
function statusBar(w) {
  return `<g>
    ${rect(0, 0, w, 56, C.primary)}
    <text x="56" y="40" font-family="Inter,sans-serif" font-size="28" font-weight="600" fill="${C.white}">9:41</text>
    <text x="${w-56}" y="40" font-family="Arial" font-size="26" fill="${C.white}" text-anchor="end">●●● 🔋</text>
  </g>`
}
function appHeader(w, title) {
  return `<g>
    ${rect(0, 56, w, 96, C.primary)}
    <text x="${w/2}" y="118" font-family="Inter,sans-serif" font-size="38" font-weight="600" fill="${C.white}" text-anchor="middle">${title}</text>
    <rect x="40" y="78" width="40" height="5" rx="2.5" fill="${C.white}"/>
    <rect x="40" y="96" width="30" height="5" rx="2.5" fill="${C.white}"/>
    <rect x="40" y="114" width="40" height="5" rx="2.5" fill="${C.white}"/>
    <text x="${w-64}" y="120" font-family="Arial" font-size="40" fill="${C.white}" text-anchor="middle">🔔</text>
  </g>`
}
function bottomNav(W, H, active = 0) {
  const tabs = ['Início','Módulos','Notificações','Perfil']
  const icons = ['🏠','⚙️','🔔','👤']
  return `<g>
    ${rect(0, H-100, W, 100, C.white)}
    <rect x="0" y="${H-100}" width="${W}" height="1" fill="${C.neutral200}"/>
    ${tabs.map((t,i) => `
      <text x="${W*(i*0.25+0.125)}" y="${H-40}" font-family="Arial" font-size="36" text-anchor="middle">${icons[i]}</text>
      <text x="${W*(i*0.25+0.125)}" y="${H-14}" font-family="Inter,sans-serif" font-size="22" font-weight="${i===active?'700':'400'}" fill="${i===active?C.primary:C.neutral500}" text-anchor="middle">${t}</text>
    `).join('')}
  </g>`
}

// ─── 1. ICON 512×512 (a partir do SVG correto) ─────────────────────────────
async function makeIcon() {
  const iconSvg = fs.readFileSync(path.join(__dirname, '../../img/app-icon-sirvaos.svg'))
  await sharp(iconSvg)
    .resize(512, 512)
    .png()
    .toFile(path.join(OUT, 'icon-512.png'))
  console.log('✅ icon-512.png (SVG correto)')
}

// ─── 2. FEATURE GRAPHIC 1024×500 ─────────────────────────────────────────────
function featureGraphicSVG() {
  const W = 1024, H = 500
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${C.primaryDark}"/>
        <stop offset="100%" stop-color="#0A5A58"/>
      </linearGradient>
    </defs>
    ${rect(0, 0, W, H, 'url(#bg)')}
    ${circle(820, -50, 280, C.primary, 0.28)}
    ${circle(900, 480, 220, C.accent, 0.14)}
    <!-- Logo mark à esquerda -->
    ${logoMark(60, 130, 220)}
    <!-- Wordmark -->
    ${wordmark(316, 278, 112, true)}
    <!-- Tagline -->
    ${tagline(322, 330, 34, true)}
    <!-- Sub -->
    <text x="324" y="378" font-family="Inter,sans-serif" font-size="26" fill="rgba(255,255,255,0.6)">Portal do membro · Escalas · Ministérios · Notificações</text>
    <!-- Badges -->
    ${rect(324, 408, 160, 52, C.accent, 26)}
    <text x="404" y="441" font-family="Inter,sans-serif" font-size="24" font-weight="700" fill="${C.white}" text-anchor="middle">App Android</text>
    ${rect(502, 408, 140, 52, 'rgba(255,255,255,0.15)', 26)}
    <text x="572" y="441" font-family="Inter,sans-serif" font-size="24" font-weight="600" fill="${C.white}" text-anchor="middle">Gratuito</text>
  </svg>`
}

// ─── 3. SCREENSHOTS 1080×1920 ────────────────────────────────────────────────
function screenshot1() {
  const W = 1080, H = 1920, PAD = 48
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><filter id="s"><feDropShadow dx="0" dy="3" stdDeviation="8" flood-opacity="0.08"/></filter></defs>
    ${rect(0, 0, W, H, C.neutral50)}
    ${statusBar(W)}
    ${appHeader(W, 'Início')}
    <!-- Greeting -->
    ${rect(PAD, 188, W-PAD*2, 140, C.white, 20)}
    <rect x="${PAD}" y="188" width="${W-PAD*2}" height="140" fill="${C.white}" rx="20" filter="url(#s)"/>
    <text x="${PAD+40}" y="248" font-family="Inter,sans-serif" font-size="32" fill="${C.neutral500}">Bem-vindo de volta,</text>
    <text x="${PAD+40}" y="298" font-family="Inter,sans-serif" font-size="52" font-weight="700" fill="${C.neutral950}">Olá, João 👋</text>
    <!-- Próximos eventos -->
    <text x="${PAD}" y="390" font-family="Inter,sans-serif" font-size="36" font-weight="700" fill="${C.neutral950}">Próximos eventos</text>
    ${rect(PAD, 412, W-PAD*2, 130, C.white, 20)}
    <rect x="${PAD}" y="412" width="${W-PAD*2}" height="130" fill="${C.white}" rx="20" filter="url(#s)"/>
    ${rect(PAD, 412, 10, 130, C.primary, 5)}
    <text x="${PAD+50}" y="462" font-family="Inter,sans-serif" font-size="30" font-weight="600" fill="${C.neutral950}">Culto de domingo</text>
    <text x="${PAD+50}" y="500" font-family="Inter,sans-serif" font-size="26" fill="${C.neutral500}">Dom, 08 Jun · 09:00 · Guitarra</text>
    ${rect(W-PAD-180, 432, 140, 48, C.successSoft, 24)}
    <text x="${W-PAD-110}" y="464" font-family="Inter,sans-serif" font-size="22" font-weight="600" fill="${C.success}" text-anchor="middle">✓ Confirmado</text>
    ${rect(PAD, 562, W-PAD*2, 130, C.white, 20)}
    <rect x="${PAD}" y="562" width="${W-PAD*2}" height="130" fill="${C.white}" rx="20" filter="url(#s)"/>
    ${rect(PAD, 562, 10, 130, C.accent, 5)}
    <text x="${PAD+50}" y="612" font-family="Inter,sans-serif" font-size="30" font-weight="600" fill="${C.neutral950}">Ensaio semanal</text>
    <text x="${PAD+50}" y="650" font-family="Inter,sans-serif" font-size="26" fill="${C.neutral500}">Qua, 11 Jun · 19:30 · Louvor</text>
    ${rect(W-PAD-170, 582, 130, 48, '#FFF3D8', 24)}
    <text x="${W-PAD-105}" y="614" font-family="Inter,sans-serif" font-size="22" font-weight="600" fill="#C98A13" text-anchor="middle">Pendente</text>
    <!-- Ministérios -->
    <text x="${PAD}" y="758" font-family="Inter,sans-serif" font-size="36" font-weight="700" fill="${C.neutral950}">Meus ministérios</text>
    ${rect(PAD, 784, 460, 200, C.white, 24)}
    <rect x="${PAD}" y="784" width="460" height="200" fill="${C.white}" rx="24" filter="url(#s)"/>
    ${logoMark(PAD+30, 808, 56)}
    <text x="${PAD+110}" y="870" font-family="Inter,sans-serif" font-size="30" font-weight="600" fill="${C.neutral950}">Louvor</text>
    <text x="${PAD+110}" y="906" font-family="Inter,sans-serif" font-size="24" fill="${C.neutral500}">3 próximas escalas</text>
    ${rect(PAD+492, 784, 460, 200, C.white, 24)}
    <rect x="${PAD+492}" y="784" width="460" height="200" fill="${C.white}" rx="24" filter="url(#s)"/>
    <text x="${PAD+552}" y="864" font-family="Arial" font-size="56">💰</text>
    <text x="${PAD+532}" y="928" font-family="Inter,sans-serif" font-size="30" font-weight="600" fill="${C.neutral950}">Financeiro</text>
    <text x="${PAD+532}" y="960" font-family="Inter,sans-serif" font-size="24" fill="${C.neutral500}">R$ 480 este mês</text>
    ${rect(PAD, 1004, 460, 200, C.white, 24)}
    <rect x="${PAD}" y="1004" width="460" height="200" fill="${C.white}" rx="24" filter="url(#s)"/>
    <text x="${PAD+62}" y="1084" font-family="Arial" font-size="56">🧒</text>
    <text x="${PAD+40}" y="1148" font-family="Inter,sans-serif" font-size="30" font-weight="600" fill="${C.neutral950}">Kids</text>
    <text x="${PAD+40}" y="1180" font-family="Inter,sans-serif" font-size="24" fill="${C.neutral500}">2 crianças</text>
    ${rect(PAD+492, 1004, 460, 200, C.white, 24)}
    <rect x="${PAD+492}" y="1004" width="460" height="200" fill="${C.white}" rx="24" filter="url(#s)"/>
    <text x="${PAD+552}" y="1084" font-family="Arial" font-size="56">📖</text>
    <text x="${PAD+532}" y="1148" font-family="Inter,sans-serif" font-size="30" font-weight="600" fill="${C.neutral950}">Escola Bíblica</text>
    <text x="${PAD+532}" y="1180" font-family="Inter,sans-serif" font-size="24" fill="${C.neutral500}">Turma Adultos</text>
    <!-- Comunicados -->
    <text x="${PAD}" y="1282" font-family="Inter,sans-serif" font-size="36" font-weight="700" fill="${C.neutral950}">Comunicados</text>
    ${rect(PAD, 1308, W-PAD*2, 120, C.white, 20)}
    <rect x="${PAD}" y="1308" width="${W-PAD*2}" height="120" fill="${C.white}" rx="20" filter="url(#s)"/>
    <text x="${PAD+40}" y="1356" font-family="Inter,sans-serif" font-size="28" font-weight="600" fill="${C.neutral950}">Reunião de líderes — 15 Jun</text>
    <text x="${PAD+40}" y="1392" font-family="Inter,sans-serif" font-size="24" fill="${C.neutral500}">Presença obrigatória para todos os líderes de ministério.</text>
    ${bottomNav(W, H, 0)}
  </svg>`
}

function screenshot2() {
  const W = 1080, H = 1920, PAD = 48
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><filter id="s"><feDropShadow dx="0" dy="3" stdDeviation="8" flood-opacity="0.08"/></filter></defs>
    ${rect(0, 0, W, H, C.neutral50)}
    ${statusBar(W)}
    ${appHeader(W, 'Louvor')}
    <!-- Hero -->
    ${rect(0, 152, W, 200, C.primary)}
    <rect x="0" y="290" width="${W}" height="80" rx="32" fill="${C.neutral50}"/>
    ${logoMark(PAD, 168, 110)}
    <text x="${PAD+140}" y="236" font-family="Inter,sans-serif" font-size="44" font-weight="700" fill="${C.white}">Louvor</text>
    <text x="${PAD+140}" y="276" font-family="Inter,sans-serif" font-size="28" fill="rgba(255,255,255,0.75)">Ministério de Louvor · 12 membros</text>
    <!-- Tabs -->
    ${rect(PAD, 356, 260, 58, C.primarySoft, 29)}
    <text x="${PAD+130}" y="394" font-family="Inter,sans-serif" font-size="28" font-weight="700" fill="${C.primary}" text-anchor="middle">Escalas</text>
    <text x="${PAD+380}" y="394" font-family="Inter,sans-serif" font-size="28" fill="${C.neutral500}" text-anchor="middle">Histórico</text>
    <text x="${PAD+600}" y="394" font-family="Inter,sans-serif" font-size="28" fill="${C.neutral500}" text-anchor="middle">Comunicados</text>
    <text x="${PAD}" y="460" font-family="Inter,sans-serif" font-size="28" font-weight="600" fill="${C.neutral500}">JUNHO 2025</text>
    <!-- Escalas -->
    ${[
      { title: 'Culto de Domingo — Manhã', sub: 'Dom, 08 Jun · 08:30  ·  Guitarra base', status: '✓ Confirmado', statusBg: C.successSoft, statusColor: C.success, barColor: C.primary, y: 484 },
      { title: 'Ensaio — Quarta-feira', sub: 'Qua, 11 Jun · 19:30  ·  Guitarra base', status: 'Pendente', statusBg: '#FFF3D8', statusColor: '#C98A13', barColor: C.accent, y: 672 },
      { title: 'Culto de Domingo — Manhã', sub: 'Dom, 15 Jun · 08:30  ·  Guitarra base', status: 'Aguardando', statusBg: C.neutral100, statusColor: C.neutral500, barColor: C.primary, y: 860 },
      { title: 'Culto de Domingo — Noite', sub: 'Dom, 15 Jun · 18:30  ·  Guitarra solo', status: 'Aguardando', statusBg: C.neutral100, statusColor: C.neutral500, barColor: C.primary, y: 1048 },
    ].map(e => `
      ${rect(PAD, e.y, W-PAD*2, 160, C.white, 20)}
      <rect x="${PAD}" y="${e.y}" width="${W-PAD*2}" height="160" fill="${C.white}" rx="20" filter="url(#s)"/>
      ${rect(PAD, e.y, 10, 160, e.barColor, 5)}
      <text x="${PAD+50}" y="${e.y+52}" font-family="Inter,sans-serif" font-size="28" font-weight="600" fill="${C.neutral950}">${e.title}</text>
      <text x="${PAD+50}" y="${e.y+90}" font-family="Inter,sans-serif" font-size="24" fill="${C.neutral500}">${e.sub}</text>
      ${rect(W-PAD-190, e.y+18, 150, 48, e.statusBg, 24)}
      <text x="${W-PAD-115}" y="${e.y+50}" font-family="Inter,sans-serif" font-size="22" font-weight="600" fill="${e.statusColor}" text-anchor="middle">${e.status}</text>
    `).join('')}
    ${bottomNav(W, H, 1)}
  </svg>`
}

function screenshot3() {
  const W = 1080, H = 1920, PAD = 48
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><filter id="s"><feDropShadow dx="0" dy="3" stdDeviation="8" flood-opacity="0.08"/></filter></defs>
    ${rect(0, 0, W, H, C.neutral50)}
    ${statusBar(W)}
    ${appHeader(W, 'Intercessão')}
    ${rect(0, 152, W, 200, C.primary)}
    <rect x="0" y="290" width="${W}" height="80" rx="32" fill="${C.neutral50}"/>
    ${logoMark(PAD, 168, 110)}
    <text x="${PAD+140}" y="236" font-family="Inter,sans-serif" font-size="44" font-weight="700" fill="${C.white}">Intercessão</text>
    <text x="${PAD+140}" y="276" font-family="Inter,sans-serif" font-size="28" fill="rgba(255,255,255,0.75)">Ministério de Intercessão</text>
    ${rect(PAD, 356, 240, 58, C.primarySoft, 29)}
    <text x="${PAD+120}" y="394" font-family="Inter,sans-serif" font-size="28" font-weight="700" fill="${C.primary}" text-anchor="middle">Torres</text>
    <text x="${PAD+360}" y="394" font-family="Inter,sans-serif" font-size="28" fill="${C.neutral500}" text-anchor="middle">Pedidos</text>
    <text x="${PAD+580}" y="394" font-family="Inter,sans-serif" font-size="28" fill="${C.neutral500}" text-anchor="middle">Histórico</text>
    <text x="${PAD}" y="460" font-family="Inter,sans-serif" font-size="28" font-weight="600" fill="${C.neutral500}">PRÓXIMAS TORRES</text>
    ${rect(PAD, 484, W-PAD*2, 180, C.white, 20)}
    <rect x="${PAD}" y="484" width="${W-PAD*2}" height="180" fill="${C.white}" rx="20" filter="url(#s)"/>
    ${rect(PAD, 484, 10, 180, C.accent, 5)}
    <text x="${PAD+50}" y="536" font-family="Inter,sans-serif" font-size="30" font-weight="700" fill="${C.neutral950}">Torre da Manhã</text>
    <text x="${PAD+50}" y="574" font-family="Inter,sans-serif" font-size="24" fill="${C.neutral500}">Seg, 09 Jun · 06:00–08:00</text>
    <text x="${PAD+50}" y="610" font-family="Inter,sans-serif" font-size="24" fill="${C.neutral500}">Sala de Oração — Templo</text>
    ${rect(W-PAD-200, 504, 160, 48, C.successSoft, 24)}
    <text x="${W-PAD-120}" y="536" font-family="Inter,sans-serif" font-size="22" font-weight="600" fill="${C.success}" text-anchor="middle">✓ Confirmado</text>
    ${rect(PAD, 688, W-PAD*2, 180, C.white, 20)}
    <rect x="${PAD}" y="688" width="${W-PAD*2}" height="180" fill="${C.white}" rx="20" filter="url(#s)"/>
    ${rect(PAD, 688, 10, 180, C.primary, 5)}
    <text x="${PAD+50}" y="740" font-family="Inter,sans-serif" font-size="30" font-weight="700" fill="${C.neutral950}">Torre da Noite</text>
    <text x="${PAD+50}" y="778" font-family="Inter,sans-serif" font-size="24" fill="${C.neutral500}">Qua, 11 Jun · 22:00–00:00</text>
    <text x="${PAD+50}" y="814" font-family="Inter,sans-serif" font-size="24" fill="${C.neutral500}">Sala de Oração — Templo</text>
    ${rect(W-PAD-220, 806, 180, 52, C.primary, 26)}
    <text x="${W-PAD-130}" y="840" font-family="Inter,sans-serif" font-size="24" font-weight="600" fill="${C.white}" text-anchor="middle">Confirmar</text>
    <text x="${PAD}" y="932" font-family="Inter,sans-serif" font-size="28" font-weight="600" fill="${C.neutral500}">MEUS PEDIDOS</text>
    ${rect(PAD, 956, W-PAD*2, 140, C.white, 20)}
    <rect x="${PAD}" y="956" width="${W-PAD*2}" height="140" fill="${C.white}" rx="20" filter="url(#s)"/>
    <text x="${PAD+40}" y="1002" font-family="Inter,sans-serif" font-size="28" font-weight="600" fill="${C.neutral950}">Cura para minha família</text>
    <text x="${PAD+40}" y="1040" font-family="Inter,sans-serif" font-size="24" fill="${C.neutral500}">Enviado em 02 Jun</text>
    ${rect(PAD+40, 1058, 120, 40, C.successSoft, 20)}
    <text x="${PAD+100}" y="1084" font-family="Inter,sans-serif" font-size="22" font-weight="600" fill="${C.success}" text-anchor="middle">Aprovado</text>
    ${rect(PAD, 1116, W-PAD*2, 140, C.white, 20)}
    <rect x="${PAD}" y="1116" width="${W-PAD*2}" height="140" fill="${C.white}" rx="20" filter="url(#s)"/>
    <text x="${PAD+40}" y="1162" font-family="Inter,sans-serif" font-size="28" font-weight="600" fill="${C.neutral950}">Direção para decisão importante</text>
    <text x="${PAD+40}" y="1200" font-family="Inter,sans-serif" font-size="24" fill="${C.neutral500}">Enviado em 05 Jun</text>
    ${rect(PAD+40, 1218, 120, 40, '#FFF3D8', 20)}
    <text x="${PAD+100}" y="1244" font-family="Inter,sans-serif" font-size="22" font-weight="600" fill="#C98A13" text-anchor="middle">Pendente</text>
    <!-- FAB -->
    <circle cx="${W-100}" cy="${H-180}" r="72" fill="${C.primary}"/>
    <text x="${W-100}" y="${H-155}" font-family="Arial" font-size="48" fill="${C.white}" text-anchor="middle">🙏</text>
    ${bottomNav(W, H, 1)}
  </svg>`
}

function screenshot4() {
  const W = 1080, H = 1920, PAD = 48
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><filter id="s"><feDropShadow dx="0" dy="3" stdDeviation="8" flood-opacity="0.08"/></filter></defs>
    ${rect(0, 0, W, H, C.neutral50)}
    ${statusBar(W)}
    ${rect(0, 56, W, 460, C.primary)}
    <rect x="0" y="420" width="${W}" height="100" rx="40" fill="${C.neutral50}"/>
    <text x="${W/2}" y="118" font-family="Inter,sans-serif" font-size="38" font-weight="600" fill="${C.white}" text-anchor="middle">Meu Perfil</text>
    <!-- Avatar com logo mark -->
    <circle cx="540" cy="310" r="116" fill="rgba(255,255,255,0.2)"/>
    ${logoMark(480, 250, 120)}
    <!-- Nome -->
    <text x="${W/2}" y="520" font-family="Inter,sans-serif" font-size="52" font-weight="700" fill="${C.neutral950}" text-anchor="middle">João Carlos Silva</text>
    ${rect(W/2-90, 538, 180, 48, C.successSoft, 24)}
    <text x="${W/2}" y="570" font-family="Inter,sans-serif" font-size="26" font-weight="600" fill="${C.success}" text-anchor="middle">✓ Membro Ativo</text>
    <!-- Stats -->
    ${rect(PAD, 616, W-PAD*2, 140, C.white, 20)}
    <rect x="${PAD}" y="616" width="${W-PAD*2}" height="140" fill="${C.white}" rx="20" filter="url(#s)"/>
    <text x="${W*0.2}" y="674" font-family="Inter,sans-serif" font-size="52" font-weight="700" fill="${C.primary}" text-anchor="middle">3</text>
    <text x="${W*0.2}" y="718" font-family="Inter,sans-serif" font-size="24" fill="${C.neutral500}" text-anchor="middle">Ministérios</text>
    <rect x="${W*0.33}" y="636" width="2" height="100" fill="${C.neutral200}"/>
    <text x="${W*0.55}" y="674" font-family="Inter,sans-serif" font-size="52" font-weight="700" fill="${C.primary}" text-anchor="middle">5</text>
    <text x="${W*0.55}" y="718" font-family="Inter,sans-serif" font-size="24" fill="${C.neutral500}" text-anchor="middle">Anos de membro</text>
    <rect x="${W*0.77}" y="636" width="2" height="100" fill="${C.neutral200}"/>
    <text x="${W*0.88}" y="674" font-family="Inter,sans-serif" font-size="52" font-weight="700" fill="${C.primary}" text-anchor="middle">24</text>
    <text x="${W*0.88}" y="718" font-family="Inter,sans-serif" font-size="24" fill="${C.neutral500}" text-anchor="middle">Escalas</text>
    <!-- Informações -->
    <text x="${PAD}" y="820" font-family="Inter,sans-serif" font-size="28" font-weight="600" fill="${C.neutral500}">INFORMAÇÕES</text>
    ${rect(PAD, 844, W-PAD*2, 380, C.white, 20)}
    <rect x="${PAD}" y="844" width="${W-PAD*2}" height="380" fill="${C.white}" rx="20" filter="url(#s)"/>
    <text x="${PAD+40}" y="898" font-family="Inter,sans-serif" font-size="26" fill="${C.neutral500}">E-mail</text>
    <text x="${PAD+40}" y="934" font-family="Inter,sans-serif" font-size="30" font-weight="500" fill="${C.neutral950}">joao.carlos@email.com</text>
    <rect x="${PAD+40}" y="956" width="${W-PAD*2-80}" height="1" fill="${C.neutral100}"/>
    <text x="${PAD+40}" y="998" font-family="Inter,sans-serif" font-size="26" fill="${C.neutral500}">Telefone</text>
    <text x="${PAD+40}" y="1034" font-family="Inter,sans-serif" font-size="30" font-weight="500" fill="${C.neutral950}">(11) 9 9999-8888</text>
    <rect x="${PAD+40}" y="1056" width="${W-PAD*2-80}" height="1" fill="${C.neutral100}"/>
    <text x="${PAD+40}" y="1098" font-family="Inter,sans-serif" font-size="26" fill="${C.neutral500}">Membro desde</text>
    <text x="${PAD+40}" y="1134" font-family="Inter,sans-serif" font-size="30" font-weight="500" fill="${C.neutral950}">15 de março de 2020</text>
    <rect x="${PAD+40}" y="1156" width="${W-PAD*2-80}" height="1" fill="${C.neutral100}"/>
    <text x="${PAD+40}" y="1198" font-family="Inter,sans-serif" font-size="26" fill="${C.neutral500}">Ministérios</text>
    <text x="${PAD+40}" y="1234" font-family="Inter,sans-serif" font-size="30" font-weight="500" fill="${C.neutral950}">Louvor · Intercessão · Escola Bíblica</text>
    ${rect(PAD, 1264, W-PAD*2, 80, C.white, 20)}
    <rect x="${PAD}" y="1264" width="${W-PAD*2}" height="80" fill="${C.white}" rx="20" filter="url(#s)"/>
    <text x="${W/2}" y="1314" font-family="Inter,sans-serif" font-size="30" font-weight="600" fill="${C.primary}" text-anchor="middle">✏️  Editar dados pessoais</text>
    ${rect(PAD, 1364, W-PAD*2, 80, '#FBE4E4', 20)}
    <text x="${W/2}" y="1414" font-family="Inter,sans-serif" font-size="30" font-weight="600" fill="${C.danger}" text-anchor="middle">↩  Sair da conta</text>
    ${bottomNav(W, H, 3)}
  </svg>`
}

async function main() {
  const toPNG = (svgStr, outFile) =>
    sharp(Buffer.from(svgStr)).png().toFile(path.join(OUT, outFile))

  await makeIcon()
  await toPNG(featureGraphicSVG(), 'feature-graphic.png')
  console.log('✅ feature-graphic.png')
  await toPNG(screenshot1(), 'screenshot-1.png')
  console.log('✅ screenshot-1.png')
  await toPNG(screenshot2(), 'screenshot-2.png')
  console.log('✅ screenshot-2.png')
  await toPNG(screenshot3(), 'screenshot-3.png')
  console.log('✅ screenshot-3.png')
  await toPNG(screenshot4(), 'screenshot-4.png')
  console.log('✅ screenshot-4.png')
  console.log('\n🎉 Todos os assets gerados com identidade visual correta!')
}

main().catch(console.error)
