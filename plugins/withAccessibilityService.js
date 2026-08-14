// plugins/withAccessibilityService.js
//
// Expo config plugin. Runs during `expo prebuild` (which EAS Build triggers
// automatically in the cloud). Only handles two things now:
//   1. Injects the <service> declaration for AutomationAccessibilityService
//      into AndroidManifest.xml.
//   2. Copies accessibility_service_config.xml + strings.xml into the
//      generated android/app/src/main/res/ folder.
// The native module itself (AutomationModule.kt) is now an Expo Module
// under modules/automation/ — Expo's autolinking discovers and links it
// automatically via expo-module.config.json, so no manual Gradle or
// MainApplication.kt editing is needed here anymore.

const { withAndroidManifest, withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

function withAccessibilityServiceManifest(config) {
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

function withAccessibilityServiceResources(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;

      const srcXml = path.join(
        projectRoot,
        "modules/automation/android/src/main/res/xml/accessibility_service_config.xml"
      );
      const destXmlDir = path.join(platformRoot, "app/src/main/res/xml");
      fs.mkdirSync(destXmlDir, { recursive: true });
      fs.copyFileSync(srcXml, path.join(destXmlDir, "accessibility_service_config.xml"));

      const srcStrings = path.join(
        projectRoot,
        "modules/automation/android/src/main/res/values/strings.xml"
      );
      const destValuesDir = path.join(platformRoot, "app/src/main/res/values");
      fs.mkdirSync(destValuesDir, { recursive: true });
      fs.copyFileSync(srcStrings, path.join(destValuesDir, "automation_strings.xml"));

      return config;
    },
  ]);
}

function withAccessibilityService(config) {
  config = withAccessibilityServiceManifest(config);
  config = withAccessibilityServiceResources(config);
  return config;
}

module.exports = withAccessibilityService;