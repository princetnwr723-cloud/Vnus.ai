package com.agenticvnus.automation

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * Core automation engine.
 *
 * This is what actually lets the agent "see" what's on screen and act on it.
 * It does NOT decide what to do — that reasoning happens in JS (the LLM call).
 * This service is the hands: read the screen, find a node, click it, type into it.
 *
 * SECURITY NOTE: this service can read text from every screen the user has
 * open, including passwords fields in some cases and other apps' content.
 * That's exactly why Google Play reviews apps requesting this permission so
 * strictly — see the README for the distribution strategy around this.
 */
class AutomationAccessibilityService : AccessibilityService() {

    companion object {
        // The bridge module (AutomationModule.kt) reads/writes through this
        // singleton reference rather than binding to the service directly,
        // since AccessibilityService instances are managed by the OS.
        var instance: AutomationAccessibilityService? = null
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Intentionally minimal — we pull screen state on-demand (dumpScreenText)
        // rather than reacting to every event, to avoid burning battery and
        // avoid triggering "always listening" review flags unnecessarily.
    }

    override fun onInterrupt() {}

    /** Walks the current window's node tree and collects visible text + bounds. */
    fun dumpScreenText(): List<Map<String, Any>> {
        val root = rootInActiveWindow ?: return emptyList()
        val results = mutableListOf<Map<String, Any>>()
        collectNodes(root, results)
        return results
    }

    private fun collectNodes(node: AccessibilityNodeInfo, out: MutableList<Map<String, Any>>) {
        val text = node.text?.toString()
        val desc = node.contentDescription?.toString()
        if (!text.isNullOrBlank() || !desc.isNullOrBlank()) {
            val bounds = android.graphics.Rect()
            node.getBoundsInScreen(bounds)
            out.add(
                mapOf(
                    "text" to (text ?: desc ?: ""),
                    "clickable" to node.isClickable,
                    "bounds" to mapOf(
                        "left" to bounds.left, "top" to bounds.top,
                        "right" to bounds.right, "bottom" to bounds.bottom
                    )
                )
            )
        }
        for (i in 0 until node.childCount) {
            node.getChild(i)?.let { collectNodes(it, out) }
        }
    }

    /** Finds the first clickable node whose text/description contains [target] and clicks it. */
    fun clickByText(target: String): Boolean {
        val root = rootInActiveWindow ?: return false
        val node = findNodeByText(root, target) ?: return false
        return node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
    }

    private fun findNodeByText(node: AccessibilityNodeInfo, target: String): AccessibilityNodeInfo? {
        val text = (node.text?.toString() ?: node.contentDescription?.toString())
        if (text != null && text.contains(target, ignoreCase = true)) {
            // Walk up to the nearest clickable ancestor if this exact node isn't clickable
            var candidate: AccessibilityNodeInfo? = node
            while (candidate != null && !candidate.isClickable) {
                candidate = candidate.parent
            }
            if (candidate != null) return candidate
        }
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val found = findNodeByText(child, target)
            if (found != null) return found
        }
        return null
    }

    /** Types text into the currently focused editable field, if any. */
    fun typeIntoFocused(text: String): Boolean {
        val root = rootInActiveWindow ?: return false
        val focused = root.findFocus(AccessibilityNodeInfo.FOCUS_INPUT) ?: return false
        val args = android.os.Bundle()
        args.putCharSequence(
            AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text
        )
        return focused.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)
    }

    fun goBack(): Boolean = performGlobalAction(GLOBAL_ACTION_BACK)
    fun goHome(): Boolean = performGlobalAction(GLOBAL_ACTION_HOME)
}
