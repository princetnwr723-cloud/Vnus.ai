package expo.modules.automation

import android.content.Intent
import android.provider.Settings
import com.agenticvnus.automation.AutomationAccessibilityService
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Expo Modules API version of the JS-facing bridge — replaces the old
 * ReactPackage/ReactMethod style module. Expo's autolinking discovers this
 * automatically via expo-module.config.json, so no manual settings.gradle /
 * app build.gradle / MainApplication.kt edits are needed.
 */
class AutomationModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AutomationModule")

    Function("isServiceEnabled") {
      AutomationAccessibilityService.instance != null
    }

    Function("openAccessibilitySettings") {
      val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      appContext.reactContext?.startActivity(intent)
    }

    AsyncFunction("dumpScreenText") { promise: Promise ->
      val service = AutomationAccessibilityService.instance
      if (service == null) {
        promise.reject("NOT_ENABLED", "Accessibility service is not running. Call openAccessibilitySettings() first.", null)
        return@AsyncFunction
      }
      promise.resolve(service.dumpScreenText())
    }

    AsyncFunction("clickByText") { target: String, promise: Promise ->
      val service = AutomationAccessibilityService.instance
      if (service == null) {
        promise.reject("NOT_ENABLED", "Accessibility service is not running.", null)
        return@AsyncFunction
      }
      promise.resolve(service.clickByText(target))
    }

    AsyncFunction("typeIntoFocused") { text: String, promise: Promise ->
      val service = AutomationAccessibilityService.instance
      if (service == null) {
        promise.reject("NOT_ENABLED", "Accessibility service is not running.", null)
        return@AsyncFunction
      }
      promise.resolve(service.typeIntoFocused(text))
    }

    AsyncFunction("goBack") { promise: Promise ->
      promise.resolve(AutomationAccessibilityService.instance?.goBack() ?: false)
    }

    AsyncFunction("goHome") { promise: Promise ->
      promise.resolve(AutomationAccessibilityService.instance?.goHome() ?: false)
    }
  }
}