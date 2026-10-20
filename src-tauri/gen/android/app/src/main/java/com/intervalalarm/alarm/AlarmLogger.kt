package com.intervalalarm.alarm

import android.content.Context
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object AlarmLogger {
    private const val TAG = "AlarmLogger"
    private const val PREFS_NAME = "interval_alarm_diagnostics"
    private const val KEY_LOGS = "diagnostic_event_logs"
    private const val MAX_LOGS = 100

    private val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.US)

    @Synchronized
    fun log(context: Context, event: String, alarmId: String? = null, details: String? = null) {
        val timestamp = dateFormat.format(Date())
        Log.i(TAG, "[$event] alarmId=$alarmId details=$details")

        try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val raw = prefs.getString(KEY_LOGS, "[]")
            val array = JSONArray(raw)

            val logEntry = JSONObject().apply {
                put("timestamp", timestamp)
                put("event", event)
                if (alarmId != null) put("alarm_id", alarmId)
                if (details != null) put("details", details)
            }

            // Keep only latest MAX_LOGS
            if (array.length() >= MAX_LOGS) {
                val newArray = JSONArray()
                val startIdx = array.length() - MAX_LOGS + 1
                for (i in startIdx until array.length()) {
                    newArray.put(array.get(i))
                }
                newArray.put(logEntry)
                prefs.edit().putString(KEY_LOGS, newArray.toString()).apply()
            } else {
                array.put(logEntry)
                prefs.edit().putString(KEY_LOGS, array.toString()).apply()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error writing diagnostic log: ${e.message}")
        }
    }

    @Synchronized
    fun getRecentLogs(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_LOGS, "[]") ?: "[]"
    }

    @Synchronized
    fun clearLogs(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().remove(KEY_LOGS).apply()
    }
}

