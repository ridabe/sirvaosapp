// Stub for css-tree — only needed for react-native-svg CSS processing,
// which is unused in this app (we only use SVG for QR code rendering).
module.exports = {
  parse: () => ({}),
  walk: () => {},
  generate: () => '',
  find: () => null,
  findAll: () => [],
  clone: v => v,
  List: class List { constructor() { this.head = null; this.tail = null; } toArray() { return []; } },
};
