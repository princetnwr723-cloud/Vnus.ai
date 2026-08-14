// plugins/withAccessibilityService.js
//
// Expo config plugin. Runs during `expo prebuild` (which EAS Build triggers
// automatically in the cloud) and:
//   1. Injects the <service> declaration for AutomationAccessibilityService
//      into the generated AndroidManifest.xml.
//   2. Copies the accessibility service's required resource files
//      (xml/accessibility_service_config.xml, values/strings.xml) from
//      modules/automation/android/... into the freshly-generated
//      android/app/src/main/res/ folder — since the android/ folder is
//      regenerated from scratch on every cloud build, these files must be
//      placed here at prebuild time, not just referenced.
// This is what lets a managed-workflow-style project ship custom native
// Android code without you ever opening Android Studio.

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

// Copies the xml/ and values/ resource files that the manifest above
// references, from modules/automation/android/src/main/res/ into the
// generated android/app/src/main/res/ folder. Without this, AAPT fails
// with "resource xml/accessibility_service_config not found" because the
// android/ folder is regenerated fresh each build and never sees these files.
function withAccessibilityServiceResources(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot; // .../android

      // 1. xml/accessibility_service_config.xml
      const srcXml = path.join(
        projectRoot,
        "modules/automation/android/src/main/res/xml/accessibility_service_config.xml"
      );
      const destXmlDir = path.join(platformRoot, "app/src/main/res/xml");
      fs.mkdirSync(destXmlDir, { recursive: true });
      fs.copyFileSync(srcXml, path.join(destXmlDir, "accessibility_service_config.xml"));

      // 2. values/strings.xml — copied under a distinct filename so it merges
      //    alongside (not overwrites) the app's own generated strings.xml.
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