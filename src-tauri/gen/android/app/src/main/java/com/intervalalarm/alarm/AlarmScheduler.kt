package com.intervalalarm.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import java.util.Calendar

object AlarmScheduler {
    private const val TAG = "AlarmScheduler"

    fun canScheduleExact(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            alarmManager.canScheduleExactAlarms()
        } else {
            true
        }
    }

    fun scheduleSequence(context: Context, sequence: NativeAlarmSequence) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val requestCode = sequence.id.hashCode()

        if (!sequence.enabled || sequence.state == "completed") {
            cancelAlarm(context, sequence.id)
            return
        }

        val now = System.currentTimeMillis()
        var currentIdx = sequence.currentOccurrenceIndex
        var targetTime = sequence.snoozedUntil

        if (targetTime == null || targetTime <= now) {
            val intervalMs = sequence.intervalDurationMs()

            // Find next future occurrence in current sequence
            while (currentIdx < sequence.totalOccurrences) {
                val occTime = sequence.startTime + (currentIdx * intervalMs)
                if (occTime > now) {
                    targetTime = occTime
                    break
                }
                currentIdx++
            }

            // If all occurrences are in the past, handle repetition
            if (targetTime == null || targetTime <= now) {
                when (sequence.repetitionMode) {
                    "one_time" -> {
                        NativeStorage.updateAlarm(
                            context,
                            sequence.copy(
                                enabled = false,
                                state = "completed",
                                nextTriggerTime = null
                            )
                        )
                        cancelAlarm(context, sequence.id)
                        return
                    }
                    "daily" -> {
                        val nextDayStart = calculateNextDailyStart(sequence.startTime, now)
                        targetTime = nextDayStart
                        currentIdx = 0
                        NativeStorage.updateAlarm(
                            context,
                            sequence.copy(
                                startTime = nextDayStart,
                                currentOccurrenceIndex = 0,
                                nextTriggerTime = targetTime
                            )
                        )
                    }
                    "weekdays" -> {
                        val nextWeekdayStart = calculateNextWeekdayStart(sequence.startTime, sequence.selectedWeekdays, now)
                        targetTime = nextWeekdayStart
                        currentIdx = 0
                        NativeStorage.updateAlarm(
                            context,
                            sequence.copy(
                                startTime = nextWeekdayStart,
                                currentOccurrenceIndex = 0,
                                nextTriggerTime = targetTime
                            )
                        )
                    }
                    "continuous" -> {
                        val totalDuration = intervalMs * sequence.totalOccurrences
                        var newStart = sequence.startTime
                        while (newStart + (sequence.totalOccurrences - 1) * intervalMs <= now) {
                            newStart += totalDuration
                        }
                        currentIdx = 0
                        while (currentIdx < sequence.totalOccurrences) {
                            val occ = newStart + (currentIdx * intervalMs)
                            if (occ > now) {
                                targetTime = occ
                                break
                            }
                            currentIdx++
                        }
                        NativeStorage.updateAlarm(
                            context,
                            sequence.copy(
                                startTime = newStart,
                                currentOccurrenceIndex = currentIdx,
                                nextTriggerTime = targetTime
                            )
                        )
                    }
                }
            }
        }

        if (targetTime == null || targetTime <= now) {
            return
        }

        // Persist computed target time and occurrence index
        NativeStorage.updateAlarm(
            context,
            sequence.copy(
                currentOccurrenceIndex = currentIdx,
                nextTriggerTime = targetTime,
                state = "scheduled"
            )
        )

        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = AlarmReceiver.ACTION_TRIGGER_ALARM
            putExtra(AlarmReceiver.EXTRA_ALARM_ID, sequence.id)
            putExtra(AlarmReceiver.EXTRA_ALARM_NAME, sequence.name)
            putExtra(AlarmReceiver.EXTRA_OCCURRENCE_INDEX, currentIdx)
            putExtra(AlarmReceiver.EXTRA_TOTAL_OCCURRENCES, sequence.totalOccurrences)
            putExtra(AlarmReceiver.EXTRA_SOUND, sequence.sound)
            putExtra(AlarmReceiver.EXTRA_VIBRATION, sequence.vibration)
            putExtra(AlarmReceiver.EXTRA_SNOOZE_MINUTES, sequence.snoozeMinutes)
            putExtra(AlarmReceiver.EXTRA_TARGET_TIME, targetTime)
        }

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Show intent for AlarmClockInfo
        val showIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val showPendingIntent = PendingIntent.getActivity(
            context,
            requestCode + 1,
            showIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        try {
            if (canScheduleExact(context)) {
                // setAlarmClock provides maximum reliability and displays standard system clock icon
                alarmManager.setAlarmClock(
                    AlarmManager.AlarmClockInfo(targetTime, showPendingIntent),
                    pendingIntent
                )
                Log.d(TAG, "Scheduled alarm clock for ${sequence.name} (step ${currentIdx + 1}) at $targetTime")
            } else {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    targetTime,
                    pendingIntent
                )
                Log.d(TAG, "Scheduled setExactAndAllowWhileIdle for ${sequence.name} at $targetTime")
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "SecurityException scheduling exact alarm: ${e.message}")
            alarmManager.set(AlarmManager.RTC_WAKEUP, targetTime, pendingIntent)
        }
    }

    fun cancelAlarm(context: Context, alarmId: String) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val requestCode = alarmId.hashCode()

        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = AlarmReceiver.ACTION_TRIGGER_ALARM
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        alarmManager.cancel(pendingIntent)
        pendingIntent.cancel()
        Log.d(TAG, "Canceled alarm $alarmId")
    }

    fun rescheduleAll(context: Context) {
        val all = NativeStorage.getAllAlarms(context)
        Log.d(TAG, "Rescheduling ${all.size} alarm sequences")
        for (alarm in all) {
            if (alarm.enabled && alarm.state != "completed") {
                scheduleSequence(context, alarm)
            }
        }
    }

    private fun calculateNextDailyStart(origStartMs: Long, nowMs: Long): Long {
        val origCal = Calendar.getInstance().apply { timeInMillis = origStartMs }
        val targetHour = origCal.get(Calendar.HOUR_OF_DAY)
        val targetMinute = origCal.get(Calendar.MINUTE)

        val candidate = Calendar.getInstance().apply {
            timeInMillis = nowMs
            set(Calendar.HOUR_OF_DAY, targetHour)
            set(Calendar.MINUTE, targetMinute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }

        if (candidate.timeInMillis <= nowMs) {
            candidate.add(Calendar.DAY_OF_YEAR, 1)
        }
        return candidate.timeInMillis
    }

    private fun calculateNextWeekdayStart(origStartMs: Long, selectedWeekdays: List<Int>, nowMs: Long): Long {
        val origCal = Calendar.getInstance().apply { timeInMillis = origStartMs }
        val targetHour = origCal.get(Calendar.HOUR_OF_DAY)
        val targetMinute = origCal.get(Calendar.MINUTE)

        for (dayOffset in 0..14) {
            val candidate = Calendar.getInstance().apply {
                timeInMillis = nowMs
                add(Calendar.DAY_OF_YEAR, dayOffset)
                set(Calendar.HOUR_OF_DAY, targetHour)
                set(Calendar.MINUTE, targetMinute)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }

            // In Calendar: Sunday = 1, Monday = 2 .. Saturday = 7
            // Convert to ISO weekday (1 = Monday .. 7 = Sunday)
            val calDay = candidate.get(Calendar.DAY_OF_WEEK)
            val isoDay = if (calDay == Calendar.SUNDAY) 7 else calDay - 1

            if (selectedWeekdays.contains(isoDay) && candidate.timeInMillis > nowMs) {
                return candidate.timeInMillis
            }
        }

        return origStartMs + 86400 * 1000L
    }
}

