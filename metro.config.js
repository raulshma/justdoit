const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Remove console logs in production for smaller bundle size
config.transformer.minifierConfig = {
  compress: {
    drop_console: true,
  },
};

module.exports = config;
