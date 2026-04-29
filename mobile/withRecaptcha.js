const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withRecaptcha(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      if (!config.modResults.contents.includes('force "com.google.android.recaptcha:recaptcha:18.4.0"')) {
        config.modResults.contents += `
allprojects {
    configurations.all {
        resolutionStrategy {
            force "com.google.android.recaptcha:recaptcha:18.4.0"
        }
    }
}
`;
      }
    }
    return config;
  });
};
