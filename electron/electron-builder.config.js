module.exports = {
  appId: 'com.glowdeck.app',
  productName: 'GlowDeck',
  copyright: 'Copyright (c) GlowDeck',

  directories: {
    output: 'dist-electron',
    buildResources: 'public/icons',
  },

  files: [
    'out/**/*',
    'electron/**/*.js',
    'public/icons/**/*',
  ],

  // Windows
  win: {
    target: 'nsis',
    artifactName: 'GlowDeck-Setup-${version}.exe',
    icon: 'public/icons/icon-512.png',
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
  },

  // macOS
  mac: {
    target: 'dmg',
    artifactName: 'GlowDeck-${version}.dmg',
    icon: 'public/icons/icon-512.png',
    category: 'public.app-category.utilities',
  },
  dmg: {
    contents: [
      { x: 130, y: 220 },
      { x: 410, y: 220, type: 'link', path: '/Applications' },
    ],
  },

  // Auto-updates via GitHub Releases
  publish: {
    provider: 'github',
    releaseType: 'release',
  },
};
