// plugins/withAccessibilityService.js
//
// Expo config plugin. Runs during `expo prebuild` (which EAS Build triggers
// automatically in the cloud) and wires the AutomationAccessibilityService
// native module into the generated Android project:
//   1. Injects the <service> declaration into AndroidManifest.xml
//   2. Copies accessibility_service_config.xml + strings.xml into the
//      generated android/app/src/main/res/ folder
//   3. Includes modules/automation/android as a Gradle project (settings.gradle)
//   4. Adds it as a dependency of the app module (app/build.gradle)
//   5. Registers AutomationPackage in MainApplication.kt's getPackages()
// Without steps 3-5, the Kotlin module compiles nowhere and JS-side
// NativeModules.AutomationModule is undefined — which crashes the app
// the moment HomeScreen calls NativeAutomation.isServiceEnabled().

const {
  withAndroidManifest,
  withDangerousMod,
  withSettingsGradle,
  withAppBuildGradle,
  withMainApplication,
} = require("@expo/config-plugins");
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

// Adds `include ':automation'` + project dir mapping to settings.gradle so
// Gradle knows modules/automation/android is a buildable project.
function withAutomationSettingsGradle(config) {
  return withSettingsGradle(config, (config) => {
    let contents = config.modResults.contents;
    if (!contents.includes(":automation")) {
      contents += `
include ':automation'
project(':automation').projectDir = new File(rootProject.projectDir, '../modules/automation/android')
`;
    }
    config.modResults.contents = contents;
    return config;
  });
}

// Adds `implementation project(':automation')` to the app module's dependencies
// so the compiled AutomationModule/AutomationPackage classes end up in the APK.
function withAutomationAppBuildGradle(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;
    if (!contents.includes("project(':automation')")) {
      contents = contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n    implementation project(':automation')`
      );
    }
    config.modResults.contents = contents;
    return config;
  });
}

// Registers AutomationPackage inside MainApplication.kt's getPackages() list.
// Without this, React Native never instantiates AutomationModule, even
// though it's compiled into the APK — NativeModules.AutomationModule would
// still be undefined on the JS side.
function withAutomationMainApplication(config) {
  return withMainApplication(config, (config) => {
    let contents = config.modResults.contents;

    if (!contents.includes("import com.agenticvnus.automation.AutomationPackage")) {
      contents = contents.replace(
        /^(package .+)$/m,
        `$1\n\nimport com.agenticvnus.automation.AutomationPackage`
      );
    }

    if (!contents.includes("AutomationPackage()")) {
      contents = contents.replace(
        /return packages/,
        `packages.add(AutomationPackage())\n          return packages`
      );
    }

    config.modResults.contents = contents;
    return config;
  });
}

function withAccessibilityService(config) {
  config = withAccessibilityServiceManifest(config);
  config = withAccessibilityServiceResources(config);
  config = withAutomationSettingsGradle(config);
  config = withAutomationAppBuildGradle(config);
  config = withAutomationMainApplication(config);
  return config;
}

module.exports = withAccessibilityService;