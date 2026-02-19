const { withAndroidManifest } = require("@expo/config-plugins");

const withSpeechRecognition = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    // Add RECORD_AUDIO permission
    if (!androidManifest["uses-permission"]) {
      androidManifest["uses-permission"] = [];
    }

    const permissions = [
      "android.permission.RECORD_AUDIO",
      "android.permission.INTERNET", // For online fallback
    ];

    permissions.forEach((permission) => {
      if (
        !androidManifest["uses-permission"].find(
          (item) => item.$["android:name"] === permission,
        )
      ) {
        androidManifest["uses-permission"].push({
          $: { "android:name": permission },
        });
      }
    });

    return config;
  });
};

module.exports = withSpeechRecognition;
