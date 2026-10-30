package com.intervalalarm.alarm

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.os.PowerManager
import android.util.Log

class AlarmReceiver : BroadcastReceiver() {
    companion object {
        const val TAG = "AlarmReceiver"
        const val ACTION_TRIGGER_ALARM = "com.intervalalarm.alarm.ACTION_TRIGGER_ALARM"

        const val EXTRA_ALARM_ID = "extra_alarm_id"
        const val EXTRA_ALARM_NAME = "extra_alarm_name"
        const val EXTRA_OCCURRENCE_INDEX = "extra_occurrence_index"
        const val EXTRA_TOTAL_OCCURRENCES = "extra_total_occurrences"
        const val EXTRA_SOUND = "extra_sound"
        const val EXTRA_VIBRATION = "extra_vibration"
        const val EXTRA_SNOOZE_MINUTES = "extra_snooze_minutes"
        const val EXTRA_TARGET_TIME = "extra_target_time"

        const val CHANNEL_ID = "interval_alarm_alerts_v2"
        const val NOTIFICATION_ID_BASE = 9000
    }

    override fun onReceive(context: Context, intent: Intent) {
        val alarmId = intent.getStringExtra(EXTRA_ALARM_ID) ?: return

        // Verify alarm exists and is currently enabled before ringing
        val seq = NativeStorage.getAlarmById(context, alarmId)
        if (seq == null || !seq.enabled || seq.state == "disabled" || seq.state == "completed") {
            Log.w(TAG, "Alarm $alarmId triggered but is disabled, completed, or deleted. Canceling and ignoring.")
            AlarmScheduler.cancelAlarm(context, alarmId)
            AlarmLogger.log(context, "ALARM_TRIGGER_IGNORED_DISABLED", alarmId, "State: ${seq?.state}, Enabled: ${seq?.enabled}")
            return
        }

        val alarmName = intent.getStringExtra(EXTRA_ALARM_NAME) ?: seq.name
        val occurrenceIndex = intent.getIntExtra(EXTRA_OCCURRENCE_INDEX, seq.currentOccurrenceIndex)
        val totalOccurrences = intent.getIntExtra(EXTRA_TOTAL_OCCURRENCES, seq.totalOccurrences)
        val sound = intent.getStringExtra(EXTRA_SOUND) ?: seq.sound
        val vibration = intent.getBooleanExtra(EXTRA_VIBRATION, seq.vibration)
        val snoozeMinutes = intent.getIntExtra(EXTRA_SNOOZE_MINUTES, seq.snoozeMinutes)

        Log.d(TAG, "Alarm triggered: $alarmName (Occurrence ${occurrenceIndex + 1} of $totalOccurrences)")
        AlarmLogger.log(context, "ALARM_DELIVERED", alarmId, "Name: $alarmName, Occ: ${occurrenceIndex + 1}/$totalOccurrences")

        // Wake screen ON using SCREEN_BRIGHT_WAKE_LOCK and ACQUIRE_CAUSES_WAKEUP
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        @Suppress("DEPRECATION")
        val wakeLock = powerManager.newWakeLock(
            PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
            "IntervalAlarm:AlarmReceiverWakeLock"
        )
        wakeLock.acquire(60 * 1000L) // 60 seconds hand-off to Foreground Service

        // Ensure Notification Channel exists
        createNotificationChannel(context)

        val notificationId = NOTIFICATION_ID_BASE + (alarmId.hashCode() % 1000)

        // Mark alarm state as ringing in persistent storage
        try {
            NativeStorage.updateAlarm(context, seq.copy(state = "ringing"))
        } catch (e: Exception) {
            Log.e(TAG, "Error updating alarm state to ringing: ${e.message}")
        }

        // Delegate continuous ringing and audio focus to Foreground Service
        AlarmPlaybackService.start(
            context = context,
            alarmId = alarmId,
            alarmName = alarmName,
            occurrenceIndex = occurrenceIndex,
            totalOccurrences = totalOccurrences,
            sound = sound,
            vibration = vibration,
            snoozeMinutes = snoozeMinutes,
            notificationId = notificationId
        )

        // Launch full-screen ringing activity
        val activityIntent = Intent(context, AlarmRingingActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra(EXTRA_ALARM_ID, alarmId)
            putExtra(EXTRA_ALARM_NAME, alarmName)
            putExtra(EXTRA_OCCURRENCE_INDEX, occurrenceIndex)
            putExtra(EXTRA_TOTAL_OCCURRENCES, totalOccurrences)
            putExtra(EXTRA_SNOOZE_MINUTES, snoozeMinutes)
            putExtra("notification_id", notificationId)
        }

        val mainAct = MainActivity.instance
        if (mainAct != null && !mainAct.isFinishing && !mainAct.isDestroyed) {
            mainAct.runOnUiThread {
                try {
                    mainAct.startActivity(activityIntent)
                } catch (e: Exception) {
                    Log.e(TAG, "Failed launching AlarmRingingActivity from MainActivity: ${e.message}")
                    try { context.startActivity(activityIntent) } catch (ignored: Exception) {}
                }
            }
        } else {
            try {
                context.startActivity(activityIntent)
            } catch (e: Exception) {
                Log.e(TAG, "Direct activity launch fell back to fullScreenIntent: ${e.message}")
            }
        }
    }

    private fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            try {
                notificationManager.deleteNotificationChannel("interval_alarm_high_channel")
            } catch (ignored: Exception) {}

            val existing = notificationManager.getNotificationChannel(CHANNEL_ID)
            if (existing == null) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    "Interval Alarm Alerts",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Urgent alerts and lock-screen alarms for scheduled intervals"
                    setBypassDnd(true)
                    enableVibration(false)
                    setSound(null, null)
                    lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
                }
                notificationManager.createNotificationChannel(channel)
            }
        }
    }
}
