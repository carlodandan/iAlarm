package com.intervalalarm.alarm

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

data class NativeAlarmSequence(
    val id: String,
    val name: String,
    val category: String = "general",
    val enabled: Boolean,
    val startTime: Long,
    val intervalValue: Long,
    val intervalUnit: String, // "minutes" or "hours"
    val totalOccurrences: Int,
    val repetitionMode: String, // "one_time", "daily", "weekdays", "continuous"
    val selectedWeekdays: List<Int>,
    val sound: String,
    val vibration: Boolean,
    val snoozeMinutes: Int,
    val snoozeMaxCount: Int,
    val gradualVolume: Boolean = true,
    val createdAt: Long = 0,
    val updatedAt: Long = 0,
    val currentOccurrenceIndex: Int,
    val state: String,
    val nextTriggerTime: Long?,
    val snoozedUntil: Long?,
    val snoozeCount: Int
) {
    fun intervalDurationMs(): Long {
        return if (intervalUnit == "minutes") {
            intervalValue * 60 * 1000L
        } else {
            intervalValue * 3600 * 1000L
        }
    }
}

object NativeStorage {
    private const val PREFS_NAME = "interval_alarm_native_store"
    private const val KEY_ALARMS = "persisted_alarms_json"

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun saveAlarms(context: Context, jsonString: String) {
        getPrefs(context).edit().putString(KEY_ALARMS, jsonString).apply()
    }

    fun getAllAlarms(context: Context): List<NativeAlarmSequence> {
        val raw = getPrefs(context).getString(KEY_ALARMS, null) ?: return emptyList()
        val list = mutableListOf<NativeAlarmSequence>()
        try {
            val array = JSONArray(raw)
            for (i in 0 until array.length()) {
                val obj = array.getJSONObject(i)
                val weekdaysJson = obj.optJSONArray("selected_weekdays")
                val weekdays = mutableListOf<Int>()
                if (weekdaysJson != null) {
                    for (j in 0 until weekdaysJson.length()) {
                        weekdays.add(weekdaysJson.getInt(j))
                    }
                }

                list.add(
                    NativeAlarmSequence(
                        id = obj.getString("id"),
                        name = obj.optString("name", "Interval Alarm"),
                        category = obj.optString("category", "general"),
                        enabled = obj.optBoolean("enabled", true),
                        startTime = obj.optLong("start_time", System.currentTimeMillis()),
                        intervalValue = obj.optLong("interval_value", 6),
                        intervalUnit = obj.optString("interval_unit", "hours"),
                        totalOccurrences = obj.optInt("total_occurrences", 4),
                        repetitionMode = obj.optString("repetition_mode", "one_time"),
                        selectedWeekdays = weekdays,
                        sound = obj.optString("sound", "best_android_rington"),
                        vibration = obj.optBoolean("vibration", true),
                        snoozeMinutes = obj.optInt("snooze_duration_minutes", 10),
                        snoozeMaxCount = obj.optInt("snooze_max_count", 3),
                        gradualVolume = obj.optBoolean("gradual_volume", true),
                        createdAt = obj.optLong("created_at", 0),
                        updatedAt = obj.optLong("updated_at", 0),
                        currentOccurrenceIndex = obj.optInt("current_occurrence_index", 0),
                        state = obj.optString("state", "scheduled"),
                        nextTriggerTime = if (obj.has("next_trigger_time") && !obj.isNull("next_trigger_time")) obj.getLong("next_trigger_time") else null,
                        snoozedUntil = if (obj.has("snoozed_until") && !obj.isNull("snoozed_until")) obj.getLong("snoozed_until") else null,
                        snoozeCount = obj.optInt("snooze_count", 0)
                    )
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return list
    }

    fun updateAlarm(context: Context, updated: NativeAlarmSequence) {
        val all = getAllAlarms(context).toMutableList()
        val idx = all.indexOfFirst { it.id == updated.id }
        if (idx >= 0) {
            all[idx] = updated
        } else {
            all.add(updated)
        }

        val array = JSONArray()
        for (a in all) {
            val obj = JSONObject()
            obj.put("id", a.id)
            obj.put("name", a.name)
            obj.put("category", a.category)
            obj.put("enabled", a.enabled)
            obj.put("start_time", a.startTime)
            obj.put("interval_value", a.intervalValue)
            obj.put("interval_unit", a.intervalUnit)
            obj.put("total_occurrences", a.totalOccurrences)
            obj.put("repetition_mode", a.repetitionMode)
            val weekdaysArr = JSONArray()
            a.selectedWeekdays.forEach { weekdaysArr.put(it) }
            obj.put("selected_weekdays", weekdaysArr)
            obj.put("sound", a.sound)
            obj.put("vibration", a.vibration)
            obj.put("snooze_duration_minutes", a.snoozeMinutes)
            obj.put("snooze_max_count", a.snoozeMaxCount)
            obj.put("gradual_volume", a.gradualVolume)
            obj.put("created_at", a.createdAt)
            obj.put("updated_at", a.updatedAt)
            obj.put("current_occurrence_index", a.currentOccurrenceIndex)
            obj.put("state", a.state)
            if (a.nextTriggerTime != null) obj.put("next_trigger_time", a.nextTriggerTime)
            if (a.snoozedUntil != null) obj.put("snoozed_until", a.snoozedUntil)
            obj.put("snooze_count", a.snoozeCount)
            array.put(obj)
        }

        saveAlarms(context, array.toString())
    }

    fun deleteAlarm(context: Context, id: String) {
        val all = getAllAlarms(context).filter { it.id != id }
        val array = JSONArray()
        for (a in all) {
            val obj = JSONObject()
            obj.put("id", a.id)
            obj.put("name", a.name)
            obj.put("category", a.category)
            obj.put("enabled", a.enabled)
            obj.put("start_time", a.startTime)
            obj.put("interval_value", a.intervalValue)
            obj.put("interval_unit", a.intervalUnit)
            obj.put("total_occurrences", a.totalOccurrences)
            obj.put("repetition_mode", a.repetitionMode)
            val weekdaysArr = JSONArray()
            a.selectedWeekdays.forEach { weekdaysArr.put(it) }
            obj.put("selected_weekdays", weekdaysArr)
            obj.put("sound", a.sound)
            obj.put("vibration", a.vibration)
            obj.put("snooze_duration_minutes", a.snoozeMinutes)
            obj.put("snooze_max_count", a.snoozeMaxCount)
            obj.put("gradual_volume", a.gradualVolume)
            obj.put("created_at", a.createdAt)
            obj.put("updated_at", a.updatedAt)
            obj.put("current_occurrence_index", a.currentOccurrenceIndex)
            obj.put("state", a.state)
            if (a.nextTriggerTime != null) obj.put("next_trigger_time", a.nextTriggerTime)
            if (a.snoozedUntil != null) obj.put("snoozed_until", a.snoozedUntil)
            obj.put("snooze_count", a.snoozeCount)
            array.put(obj)
        }
        saveAlarms(context, array.toString())
    }

    fun getAlarmById(context: Context, id: String): NativeAlarmSequence? {
        return getAllAlarms(context).find { it.id == id }
    }
}
