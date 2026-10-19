package com.intervalalarm.alarm

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat

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

        const val CHANNEL_ID = "interval_alarm_high_channel"
        const val NOTIFICATION_ID_BASE = 9000
    }

    override fun onReceive(context: Context, intent: Intent) {
        val alarmId = intent.getStringExtra(EXTRA_ALARM_ID) ?: return
        val alarmName = intent.getStringExtra(EXTRA_ALARM_NAME) ?: "Interval Alarm"
        val occurrenceIndex = intent.getIntExtra(EXTRA_OCCURRENCE_INDEX, 0)
        val totalOccurrences = intent.getIntExtra(EXTRA_TOTAL_OCCURRENCES, 1)
        val sound = intent.getStringExtra(EXTRA_SOUND)
        val vibration = intent.getBooleanExtra(EXTRA_VIBRATION, true)
        val snoozeMinutes = intent.getIntExtra(EXTRA_SNOOZE_MINUTES, 10)

        Log.d(TAG, "Alarm triggered: $alarmName (Occurrence ${occurrenceIndex + 1} of $totalOccurrences)")

        // Wake and turn screen ON using SCREEN_BRIGHT_WAKE_LOCK and ACQUIRE_CAUSES_WAKEUP
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        @Suppress("DEPRECATION")
        val wakeLock = powerManager.newWakeLock(
            PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
            "IntervalAlarm:AlarmReceiverWakeLock"
        )
        wakeLock.acquire(3 * 60 * 1000L) // 3 minutes

        // Ensure Notification Channel exists
        createNotificationChannel(context)

        val notificationId = NOTIFICATION_ID_BASE + (alarmId.hashCode() % 1000)

        // Full-screen Activity Intent
        val activityIntent = Intent(context, AlarmRingingActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP or
                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            putExtra(EXTRA_ALARM_ID, alarmId)
            putExtra(EXTRA_ALARM_NAME, alarmName)
            putExtra(EXTRA_OCCURRENCE_INDEX, occurrenceIndex)
            putExtra(EXTRA_TOTAL_OCCURRENCES, totalOccurrences)
            putExtra(EXTRA_SNOOZE_MINUTES, snoozeMinutes)
            putExtra("notification_id", notificationId)
        }

        val fullScreenPendingIntent = PendingIntent.getActivity(
            context,
            notificationId,
            activityIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action: Dismiss
        val dismissIntent = Intent(context, AlarmActionReceiver::class.java).apply {
            action = AlarmActionReceiver.ACTION_DISMISS
            putExtra(EXTRA_ALARM_ID, alarmId)
            putExtra("notification_id", notificationId)
        }
        val dismissPendingIntent = PendingIntent.getBroadcast(
            context,
            notificationId + 1,
            dismissIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action: Snooze
        val snoozeIntent = Intent(context, AlarmActionReceiver::class.java).apply {
            action = AlarmActionReceiver.ACTION_SNOOZE
            putExtra(EXTRA_ALARM_ID, alarmId)
            putExtra(EXTRA_SNOOZE_MINUTES, snoozeMinutes)
            putExtra("notification_id", notificationId)
        }
        val snoozePendingIntent = PendingIntent.getBroadcast(
            context,
            notificationId + 2,
            snoozeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val alarmSoundUri = RingtoneManager.getActualDefaultRingtoneUri(context, RingtoneManager.TYPE_ALARM)
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(alarmName)
            .setContentText("Occurrence ${occurrenceIndex + 1} of $totalOccurrences is ringing")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(false)
            .setOngoing(true)
            .setSound(alarmSoundUri)
            .setContentIntent(fullScreenPendingIntent)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Dismiss", dismissPendingIntent)
            .addAction(android.R.drawable.ic_popup_sync, "Snooze (${snoozeMinutes}m)", snoozePendingIntent)

        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(notificationId, builder.build())

        // Start ringtone and vibration immediately
        RingtonePlayer.start(context, sound, vibration)

        // Also launch activity directly
        try {
            context.startActivity(activityIntent)
        } catch (e: Exception) {
            Log.e(TAG, "Direct activity launch fell back to fullScreenIntent: ${e.message}")
        }
    }

    private fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val existing = notificationManager.getNotificationChannel(CHANNEL_ID)
            if (existing == null) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    "Interval Alarm Alerts",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Urgent alerts and lock-screen alarms for scheduled intervals"
                    setBypassDnd(true)
                    enableVibration(true)
                    val alarmUri = RingtoneManager.getActualDefaultRingtoneUri(context, RingtoneManager.TYPE_ALARM)
                        ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                    setSound(
                        alarmUri,
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .setFlags(AudioAttributes.FLAG_AUDIBILITY_ENFORCED)
                            .build()
                    )
                    lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
                }
                notificationManager.createNotificationChannel(channel)
            }
        }
    }
}
