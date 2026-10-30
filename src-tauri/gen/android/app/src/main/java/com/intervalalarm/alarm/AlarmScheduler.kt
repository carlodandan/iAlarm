package com.intervalalarm.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import java.util.Calendar

data class NextOccurrenceResult(
    val targetTimeMs: Long?,
    val occurrenceIndex: Int,
    val isCompleted: Boolean,
    val newStartTimeMs: Long?,
    val newState: String
)

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

    fun computeNextOccurrence(sequence: NativeAlarmSequence, now: Long): NextOccurrenceResult {
        if (!sequence.enabled || sequence.state == "completed") {
            return NextOccurrenceResult(
                targetTimeMs = null,
                occurrenceIndex = sequence.currentOccurrenceIndex,
                isCompleted = true,
                newStartTimeMs = null,
                newState = "completed"
            )
        }

        val currentIdx = sequence.currentOccurrenceIndex
        val snoozeTime = sequence.snoozedUntil

        // If snoozed and snooze time is in the future, return snooze target
        if (snoozeTime != null && snoozeTime > now) {
            return NextOccurrenceResult(
                targetTimeMs = snoozeTime,
                occurrenceIndex = currentIdx,
                isCompleted = false,
                newStartTimeMs = null,
                newState = "snoozed"
            )
        }

        val intervalMs = sequence.intervalDurationMs()

        // Find next future occurrence in current sequence
        var candidateIdx = currentIdx
        var foundTime: Long? = null
        while (candidateIdx < sequence.totalOccurrences) {
            val occTime = sequence.startTime + (candidateIdx * intervalMs)
            if (occTime > now) {
                foundTime = occTime
                break
            }
            candidateIdx++
        }

        if (foundTime != null) {
            return NextOccurrenceResult(
                targetTimeMs = foundTime,
                occurrenceIndex = candidateIdx,
                isCompleted = false,
                newStartTimeMs = null,
                newState = "scheduled"
            )
        }

        // If all occurrences are in the past, handle repetition modes
        return when (sequence.repetitionMode) {
            "one_time" -> {
                NextOccurrenceResult(
                    targetTimeMs = null,
                    occurrenceIndex = sequence.totalOccurrences,
                    isCompleted = true,
                    newStartTimeMs = null,
                    newState = "completed"
                )
            }
            "daily" -> {
                val nextDayStart = calculateNextDailyStart(sequence.startTime, now)
                NextOccurrenceResult(
                    targetTimeMs = nextDayStart,
                    occurrenceIndex = 0,
                    isCompleted = false,
                    newStartTimeMs = nextDayStart,
                    newState = "scheduled"
                )
            }
            "weekdays" -> {
                val nextWeekdayStart = calculateNextWeekdayStart(sequence.startTime, sequence.selectedWeekdays, now)
                NextOccurrenceResult(
                    targetTimeMs = nextWeekdayStart,
                    occurrenceIndex = 0,
                    isCompleted = false,
                    newStartTimeMs = nextWeekdayStart,
                    newState = "scheduled"
                )
            }
            "continuous" -> {
                val totalDuration = intervalMs * sequence.totalOccurrences
                var newStart = sequence.startTime
                while (newStart + (sequence.totalOccurrences - 1) * intervalMs <= now) {
                    newStart += totalDuration
                }
                var contIdx = 0
                var contTarget: Long? = null
                while (contIdx < sequence.totalOccurrences) {
                    val occ = newStart + (contIdx * intervalMs)
                    if (occ > now) {
                        contTarget = occ
                        break
                    }
                    contIdx++
                }
                NextOccurrenceResult(
                    targetTimeMs = contTarget,
                    occurrenceIndex = contIdx,
                    isCompleted = false,
                    newStartTimeMs = newStart,
                    newState = "scheduled"
                )
            }
            else -> {
                NextOccurrenceResult(
                    targetTimeMs = null,
                    occurrenceIndex = sequence.totalOccurrences,
                    isCompleted = true,
                    newStartTimeMs = null,
                    newState = "completed"
                )
            }
        }
    }

    fun scheduleSequence(context: Context, sequence: NativeAlarmSequence) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val requestCode = sequence.id.hashCode()

        val now = System.currentTimeMillis()
        val calc = computeNextOccurrence(sequence, now)

        if (calc.isCompleted || calc.targetTimeMs == null) {
            NativeStorage.updateAlarm(
                context,
                sequence.copy(
                    enabled = false,
                    state = "completed",
                    nextTriggerTime = null
                )
            )
            cancelAlarm(context, sequence.id)
            AlarmLogger.log(context, "ALARM_SEQUENCE_COMPLETED", sequence.id, "Occurrences finished")
            Log.d(TAG, "Sequence ${sequence.name} finished or disabled, canceling schedule")
            return
        }

        val targetTime = calc.targetTimeMs
        val updatedSeq = sequence.copy(
            startTime = calc.newStartTimeMs ?: sequence.startTime,
            currentOccurrenceIndex = calc.occurrenceIndex,
            nextTriggerTime = targetTime,
            state = calc.newState
        )

        // Persist computed target time and occurrence index
        NativeStorage.updateAlarm(context, updatedSeq)

        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = AlarmReceiver.ACTION_TRIGGER_ALARM
            putExtra(AlarmReceiver.EXTRA_ALARM_ID, sequence.id)
            putExtra(AlarmReceiver.EXTRA_ALARM_NAME, sequence.name)
            putExtra(AlarmReceiver.EXTRA_OCCURRENCE_INDEX, calc.occurrenceIndex)
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
            val exactGranted = canScheduleExact(context)
            if (exactGranted) {
                // setAlarmClock provides maximum reliability and displays standard system clock icon
                alarmManager.setAlarmClock(
                    AlarmManager.AlarmClockInfo(targetTime, showPendingIntent),
                    pendingIntent
                )
                AlarmLogger.log(context, "ALARM_SCHEDULED_EXACT_CLOCK", sequence.id, "Target: $targetTime, Occ: ${calc.occurrenceIndex + 1}/${sequence.totalOccurrences}")
                Log.d(TAG, "Scheduled alarm clock for ${sequence.name} (occurrence ${calc.occurrenceIndex + 1} of ${sequence.totalOccurrences}) at $targetTime")
            } else {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    targetTime,
                    pendingIntent
                )
                AlarmLogger.log(context, "ALARM_SCHEDULED_WHILE_IDLE", sequence.id, "Target: $targetTime")
                Log.d(TAG, "Scheduled setExactAndAllowWhileIdle for ${sequence.name} at $targetTime")
            }
        } catch (e: SecurityException) {
            AlarmLogger.log(context, "ALARM_SCHEDULE_INEXACT_FALLBACK", sequence.id, e.message)
            Log.e(TAG, "SecurityException scheduling exact alarm: ${e.message}")
            alarmManager.set(AlarmManager.RTC_WAKEUP, targetTime, pendingIntent)
        }
    }

    fun cancelAlarm(context: Context, alarmId: String) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val requestCode = alarmId.hashCode()

        // 1. Cancel trigger broadcast PendingIntent
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

        // 2. Cancel AlarmClockInfo show PendingIntent
        val showIntent = Intent(context, MainActivity::class.java)
        val showPendingIntent = PendingIntent.getActivity(
            context,
            requestCode + 1,
            showIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        showPendingIntent.cancel()

        // 3. Stop playback service if actively ringing
        try {
            AlarmPlaybackService.stop(context)
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping playback service on cancel: ${e.message}")
        }

        // 4. Cancel active notification
        try {
            val notificationId = AlarmReceiver.NOTIFICATION_ID_BASE + (alarmId.hashCode() % 1000)
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
            nm.cancel(notificationId)
        } catch (e: Exception) {
            Log.e(TAG, "Error canceling notification on cancel: ${e.message}")
        }

        AlarmLogger.log(context, "ALARM_CANCELED", alarmId)
        Log.d(TAG, "Canceled alarm $alarmId and cleaned up pending intents/notifications")
    }

    fun rescheduleAll(context: Context) {
        val all = NativeStorage.getAllAlarms(context)
        AlarmLogger.log(context, "ALARMS_RESCHEDULED_ALL", null, "Count: ${all.size}")
        Log.d(TAG, "Rescheduling ${all.size} alarm sequences")
        for (alarm in all) {
            if (alarm.enabled && alarm.state != "completed" && alarm.state != "disabled") {
                scheduleSequence(context, alarm)
            } else {
                cancelAlarm(context, alarm.id)
            }
        }
    }

    fun calculateNextDailyStart(origStartMs: Long, nowMs: Long): Long {
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

    fun calculateNextWeekdayStart(origStartMs: Long, selectedWeekdays: List<Int>, nowMs: Long): Long {
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
