package com.agenticvnus.automation

import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.*

/**
 * JS-facing bridge. Everything here is thin — the real logic lives in
 * AutomationAccessibilityService.kt. This module just marshals data between
 * JS and the native service instance.
 */
class AutomationModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "AutomationModule"

    @ReactMethod
    fun isServiceEnabled(promise: Promise) {
        promise.resolve(AutomationAccessibilityService.instance != null)
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun dumpScreenText(promise: Promise) {
        val service = AutomationAccessibilityService.instance
        if (service == null) {
            promise.reject("NOT_ENABLED", "Accessibility service is not running. Call openAccessibilitySettings() first.")
            return
        }
        val nodes = service.dumpScreenText()
        val array = Arguments.createArray()
        for (n in nodes) {
            val map = Arguments.createMap()
            map.putString("text", n["text"] as String)
            map.putBoolean("clickable", n["clickable"] as Boolean)
            array.pushMap(map)
        }
        promise.resolve(array)
    }

    @ReactMethod
    fun clickByText(target: String, promise: Promise) {
        val service = AutomationAccessibilityService.instance
        if (service == null) {
            promise.reject("NOT_ENABLED", "Accessibility service is not running.")
            return
        }
        promise.resolve(service.clickByText(target))
    }

    @ReactMethod
    fun typeIntoFocused(text: String, promise: Promise) {
        val service = AutomationAccessibilityService.instance
        if (service == null) {
            promise.reject("NOT_ENABLED", "Accessibility service is not running.")
            return
        }
        promise.resolve(service.typeIntoFocused(text))
    }

    @ReactMethod
    fun goBack(promise: Promise) {
        promise.resolve(AutomationAccessibilityService.instance?.goBack() ?: false)
    }

    @ReactMethod
    fun goHome(promise: Promise) {
        promise.resolve(AutomationAccessibilityService.instance?.goHome() ?: false)
    }
}
