// Gera os assets PNG oficiais do SirvaOS a partir das definições SVG.
// Uso: node scripts/generate-assets.js
const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const ASSETS = path.join(__dirname, '..', 'assets')

// ── SVGs inline ────────────────────────────────────────────────────────────

const APP_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#E0F6F4"/>
      <stop offset="1" stop-color="#DDF7FC"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="236" fill="url(#bg)"/>
  <path d="M704 270 C458 136 198 280 224 522 C248 720 522 704 512 512 C502 348 778 358 806 542 C830 792 548 940 286 796"
    fill="none" stroke="#087C7A" stroke-width="108" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="224" cy="522" r="64" fill="#00A7C4"/>
  <circle cx="806" cy="542" r="64" fill="#00A7C4"/>
</svg>`

// Splash: ícone em branco sobre fundo transparente (bg teal definido no app.json)
const SPLASH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <path d="M352 135 C229 68 99 140 112 261 C124 360 261 352 256 256 C251 174 389 179 403 271 C415 396 274 470 143 398"
    fill="none" stroke="#FFFFFF" stroke-width="54" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="112" cy="261" r="32" fill="#00A7C4"/>
  <circle cx="403" cy="271" r="32" fill="#00A7C4"/>
</svg>`

// Ícone monocromático para notificações Android (branco sobre transparente)
const MONO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <path d="M704 270 C458 136 198 280 224 522 C248 720 522 704 512 512 C502 348 778 358 806 542 C830 792 548 940 286 796"
    fill="none" stroke="#FFFFFF" stroke-width="108" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="224" cy="522" r="64" fill="#FFFFFF"/>
  <circle cx="806" cy="542" r="64" fill="#FFFFFF"/>
</svg>`

// ── Geração ────────────────────────────────────────────────────────────────

async function generate(label, svgBuffer, outFile, width, height) {
  try {
    await sharp(svgBuffer).resize(width, height).png().toFile(outFile)
    console.log(`✓ ${label}`)
  } catch (err) {
    console.error(`✗ ${label}: ${err.message}`)
  }
}

async function run() {
  console.log('Gerando assets oficiais SirvaOS...\n')

  await generate('icon.png (1024x1024)',
    Buffer.from(APP_ICON_SVG),
    path.join(ASSETS, 'icon.png'),
    1024, 1024)

  await generate('android-icon-foreground.png (1024x1024)',
    Buffer.from(APP_ICON_SVG),
    path.join(ASSETS, 'android-icon-foreground.png'),
    1024, 1024)

  await generate('android-icon-monochrome.png (1024x1024)',
    Buffer.from(MONO_SVG),
    path.join(ASSETS, 'android-icon-monochrome.png'),
    1024, 1024)

  await generate('splash-icon.png (512x512)',
    Buffer.from(SPLASH_SVG),
    path.join(ASSETS, 'splash-icon.png'),
    512, 512)

  await generate('favicon.png (64x64)',
    Buffer.from(APP_ICON_SVG),
    path.join(ASSETS, 'favicon.png'),
    64, 64)

  console.log('\nPronto. Reconstrua o app (eas build) para aplicar o ícone e o splash.')
}

run()
