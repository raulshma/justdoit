const { withGradleProperties } = require('@expo/config-plugins');

/**
 * Config plugin to optimize Android release builds for smaller APK size.
 * Enables R8 minification and resource shrinking.
 * 
 * @param {import('@expo/config-plugins').ExpoConfig} config
 * @returns {import('@expo/config-plugins').ExpoConfig}
 */
const withAndroidBuildOptimizations = (config) => {
  return withGradleProperties(config, (config) => {
    // Keys to add/update for build optimization
    const optimizationProps = [
      {
        type: 'property',
        key: 'android.enableMinifyInReleaseBuilds',
        value: 'true',
      },
      {
        type: 'property',
        key: 'android.enableShrinkResourcesInReleaseBuilds',
        value: 'true',
      },
    ];

    // Remove existing entries if present (to avoid duplicates)
    const keysToModify = optimizationProps.map((prop) => prop.key);
    config.modResults = config.modResults.filter(
      (item) => !keysToModify.includes(item.key)
    );

    // Add optimization properties
    config.modResults.push(...optimizationProps);

    return config;
  });
};

module.exports = withAndroidBuildOptimizations;
