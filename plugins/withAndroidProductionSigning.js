const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Production Android release builds use the Konnect EV upload keystore via
 * environment variables — never the debug keystore.
 *
 * Gradle reads at build time:
 * - ANDROID_UPLOAD_STORE_FILE
 * - ANDROID_UPLOAD_STORE_PASSWORD
 * - ANDROID_UPLOAD_KEY_ALIAS
 * - ANDROID_UPLOAD_KEY_PASSWORD
 */
function withAndroidProductionSigning(config, { enabled = false } = {}) {
  if (!enabled) {
    return config;
  }

  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    if (contents.includes('signingConfigs.release')) {
      return config;
    }

    const signingBlock = `
        release {
            def storeFileEnv = System.getenv("ANDROID_UPLOAD_STORE_FILE")
            if (!storeFileEnv) {
                throw new GradleException(
                    "Missing ANDROID_UPLOAD_STORE_FILE for production release signing. " +
                    "Export it in the shell before ./gradlew (see README)."
                )
            }
            def keystore = file(storeFileEnv)
            if (!keystore.isFile()) {
                throw new GradleException(
                    "Android upload keystore not found at " + storeFileEnv + "."
                )
            }
            def uploadStorePassword = System.getenv("ANDROID_UPLOAD_STORE_PASSWORD")
            def uploadKeyAlias = System.getenv("ANDROID_UPLOAD_KEY_ALIAS")
            def uploadKeyPassword = System.getenv("ANDROID_UPLOAD_KEY_PASSWORD")
            if (!uploadStorePassword || !uploadKeyAlias || !uploadKeyPassword) {
                throw new GradleException(
                    "Missing ANDROID_UPLOAD_STORE_PASSWORD, ANDROID_UPLOAD_KEY_ALIAS, or " +
                    "ANDROID_UPLOAD_KEY_PASSWORD for production release signing."
                )
            }
            storeFile keystore
            storePassword uploadStorePassword
            keyAlias uploadKeyAlias
            keyPassword uploadKeyPassword
        }`;

    if (!contents.includes('signingConfigs {')) {
      throw new Error(
        'withAndroidProductionSigning: expected signingConfigs block in android/app/build.gradle',
      );
    }

    contents = contents.replace(
      /(signingConfigs\s*\{\s*debug\s*\{[\s\S]*?\}\s*)/m,
      `$1${signingBlock}\n    `,
    );

    contents = contents.replace(
      /(buildTypes\s*\{[\s\S]*?\brelease\s*\{[\s\S]*?)(signingConfig\s+signingConfigs\.debug)/,
      '$1signingConfig signingConfigs.release',
    );

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withAndroidProductionSigning;