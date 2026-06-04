const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

// css-tree é puxado por react-native-svg para processar CSS em SVG.
// Não usamos essa funcionalidade — substituímos por stub para evitar
// problema de resolução de módulo no Metro/Windows.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'css-tree': path.resolve(__dirname, 'src/mocks/css-tree-stub.js'),
}

module.exports = config
