// plugins/withAccessibilityService.js
//
// Expo config plugin. Runs during `expo prebuild` (which EAS Build triggers
// automatically in the cloud) and injects the <service> declaration for
// AutomationAccessibilityService into the generated AndroidManifest.xml.
// This is what lets a managed-workflow-style project ship custom native
// Android code without you ever opening Android Studio.

const { withAndroidManifest } = require("@expo/config-plugins");

function withAccessibilityService(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application[0];

    const serviceEntry = {
      $: {
        "android:name": "com.agenticvnus.automation.AutomationAccessibilityService",
        "android:label": "Agentic Vnus Automation",
        "android:permission": "android.permission.BIND_ACCESSIBILITY_SERVICE",
        "android:exported": "false",
      },
      "intent-filter": [
        {
          action: [
            { $: { "android:name": "android.accessibilityservice.AccessibilityService" } },
          ],
        },
      ],
      "meta-data": [
        {
          $: {
            "android:name": "android.accessibilityservice",
            "android:resource": "@xml/accessibility_service_config",
          },
        },
      ],
    };

    if (!application.service) application.service = [];
    application.service.push(serviceEntry);

    return config;
  });
}
