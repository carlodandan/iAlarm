package com.intervalalarm.alarm

import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.RingtoneManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat

class AlarmPlaybackService : Service() {

    companion object {
        private const val TAG = "AlarmPlaybackService"
        const val ACTION_START_ALARM = "com.intervalalarm.alarm.ACTION_START_ALARM"
        const val ACTION_STOP_ALARM = "com.intervalalarm.alarm.ACTION_STOP_ALARM"

        const val EXTRA_ALARM_ID = "extra_alarm_id"
        const val EXTRA_ALARM_NAME = "extra_alarm_name"
        const val EXTRA_OCCURRENCE_INDEX = "extra_occurrence_index"
        const val EXTRA_TOTAL_OCCURRENCES = "extra_total_occurrences"
        const val EXTRA_SOUND = "extra_sound"
        const val EXTRA_VIBRATION = "extra_vibration"
        const val EXTRA_SNOOZE_MINUTES = "extra_snooze_minutes"
        const val EXTRA_NOTIFICATION_ID = "extra_notification_id"

        private const val AUTO_SILENCE_TIMEOUT_MS = 10 * 60 * 1000L // 10 minutes

        fun start(
            context: Context,
            alarmId: String,
            alarmName: String,
            occurrenceIndex: Int,
            totalOccurrences: Int,
            sound: String?,
            vibration: Boolean,
            snoozeMinutes: Int,
            notificationId: Int
        ) {
            val intent = Intent(context, AlarmPlaybackService::class.java).apply {
                action = ACTION_START_ALARM
                putExtra(EXTRA_ALARM_ID, alarmId)
                putExtra(EXTRA_ALARM_NAME, alarmName)
                putExtra(EXTRA_OCCURRENCE_INDEX, occurrenceIndex)
                putExtra(EXTRA_TOTAL_OCCURRENCES, totalOccurrences)
                putExtra(EXTRA_SOUND, sound)
                putExtra(EXTRA_VIBRATION, vibration)
                putExtra(EXTRA_SNOOZE_MINUTES, snoozeMinutes)
                putExtra(EXTRA_NOTIFICATION_ID, notificationId)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, AlarmPlaybackService::class.java).apply {
                action = ACTION_STOP_ALARM
            }
            context.startService(intent)
        }
    }

    private var wakeLock: PowerManager.WakeLock? = null
    private val handler = Handler(Looper.getMainLooper())
    private var currentAlarmId: String? = null
    private var currentNotificationId: Int = 0

    private val autoSilenceRunnable = Runnable {
        Log.w(TAG, "Alarm timed out after 10 minutes without user dismissal. Auto-silencing and advancing sequence.")
        handleAutoSilence()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent == null) {
            stopSelf()
            return START_NOT_STICKY
        }

        when (intent.action) {
            ACTION_START_ALARM -> {
                val alarmId = intent.getStringExtra(EXTRA_ALARM_ID) ?: return START_NOT_STICKY
                val alarmName = intent.getStringExtra(EXTRA_ALARM_NAME) ?: "Interval Alarm"
                val occurrenceIndex = intent.getIntExtra(EXTRA_OCCURRENCE_INDEX, 0)
                val totalOccurrences = intent.getIntExtra(EXTRA_TOTAL_OCCURRENCES, 1)
                val sound = intent.getStringExtra(EXTRA_SOUND)
                val vibration = intent.getBooleanExtra(EXTRA_VIBRATION, true)
                val snoozeMinutes = intent.getIntExtra(EXTRA_SNOOZE_MINUTES, 10)
                val notificationId = intent.getIntExtra(EXTRA_NOTIFICATION_ID, 9001)

                currentAlarmId = alarmId
                currentNotificationId = notificationId

                // Acquire CPU wake lock for sustained ringing
                acquireWakeLock()

                // Build foreground notification
                val notification = buildAlarmNotification(
                    alarmId = alarmId,
                    alarmName = alarmName,
                    occurrenceIndex = occurrenceIndex,
                    totalOccurrences = totalOccurrences,
                    snoozeMinutes = snoozeMinutes,
                    notificationId = notificationId
                )

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                        startForeground(notificationId, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
                    } else {
                        startForeground(notificationId, notification)
                    }
                } else {
                    startForeground(notificationId, notification)
                }

                // Start audio playback with audibility enforcement and audio focus
                RingtonePlayer.start(this, sound, vibration)

                // Schedule 10-minute auto-silence watchdog
                handler.removeCallbacks(autoSilenceRunnable)
                handler.postDelayed(autoSilenceRunnable, AUTO_SILENCE_TIMEOUT_MS)

                AlarmLogger.log(this, "PLAYBACK_SERVICE_STARTED", alarmId, "Foreground elevated with notification $notificationId")
                Log.d(TAG, "AlarmPlaybackService running in foreground for $alarmName")
            }
            ACTION_STOP_ALARM -> {
                shutdownPlayback()
            }
        }

        return START_STICKY
    }

    private fun acquireWakeLock() {
        if (wakeLock == null) {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "IntervalAlarm:PlaybackServiceWakeLock").apply {
                setReferenceCounted(false)
                acquire(12 * 60 * 1000L) // Safety cap of 12 minutes
            }
        }
    }

    private fun releaseWakeLock() {
        try {
            if (wakeLock?.isHeld == true) {
                wakeLock?.release()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error releasing wake lock: ${e.message}")
        }
        wakeLock = null
    }

    private fun buildAlarmNotification(
        alarmId: String,
        alarmName: String,
        occurrenceIndex: Int,
        totalOccurrences: Int,
        snoozeMinutes: Int,
        notificationId: Int
    ): android.app.Notification {
        val activityIntent = Intent(this, AlarmRingingActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP or
                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            putExtra(AlarmReceiver.EXTRA_ALARM_ID, alarmId)
            putExtra(AlarmReceiver.EXTRA_ALARM_NAME, alarmName)
            putExtra(AlarmReceiver.EXTRA_OCCURRENCE_INDEX, occurrenceIndex)
            putExtra(AlarmReceiver.EXTRA_TOTAL_OCCURRENCES, totalOccurrences)
            putExtra(AlarmReceiver.EXTRA_SNOOZE_MINUTES, snoozeMinutes)
            putExtra("notification_id", notificationId)
        }

        val fullScreenPendingIntent = PendingIntent.getActivity(
            this,
            notificationId,
            activityIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action: Dismiss
        val dismissIntent = Intent(this, AlarmActionReceiver::class.java).apply {
            action = AlarmActionReceiver.ACTION_DISMISS
            putExtra(AlarmReceiver.EXTRA_ALARM_ID, alarmId)
            putExtra("notification_id", notificationId)
        }
        val dismissPendingIntent = PendingIntent.getBroadcast(
            this,
            notificationId + 1,
            dismissIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action: Snooze
        val snoozeIntent = Intent(this, AlarmActionReceiver::class.java).apply {
            action = AlarmActionReceiver.ACTION_SNOOZE
            putExtra(AlarmReceiver.EXTRA_ALARM_ID, alarmId)
            putExtra(AlarmReceiver.EXTRA_SNOOZE_MINUTES, snoozeMinutes)
            putExtra("notification_id", notificationId)
        }
        val snoozePendingIntent = PendingIntent.getBroadcast(
            this,
            notificationId + 2,
            snoozeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, AlarmReceiver.CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(alarmName)
            .setContentText("Occurrence ${occurrenceIndex + 1} of $totalOccurrences is ringing")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(false)
            .setOngoing(true)
            .setSound(null)
            .setContentIntent(fullScreenPendingIntent)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Dismiss", dismissPendingIntent)
            .addAction(android.R.drawable.ic_popup_sync, "Snooze (${snoozeMinutes}m)", snoozePendingIntent)
            .setDeleteIntent(dismissPendingIntent)
            .build()
    }

    private fun handleAutoSilence() {
        val id = currentAlarmId
        AlarmLogger.log(this, "PLAYBACK_AUTO_SILENCE_TIMEOUT", id, "Silenced after 10m unattended")
        shutdownPlayback()

        if (id != null) {
            val seq = NativeStorage.getAlarmById(this, id)
            if (seq != null) {
                val nextIdx = seq.currentOccurrenceIndex + 1
                val updated = seq.copy(
                    currentOccurrenceIndex = nextIdx,
                    snoozedUntil = null,
                    snoozeCount = 0
                )
                NativeStorage.updateAlarm(this, updated)
                AlarmScheduler.scheduleSequence(this, updated)
                Log.d(TAG, "Advanced sequence $id after 10m auto-silence to next occurrence index $nextIdx")
            }
        }
    }

    private fun shutdownPlayback() {
        AlarmLogger.log(this, "PLAYBACK_SERVICE_STOPPED", currentAlarmId)
        handler.removeCallbacks(autoSilenceRunnable)
        RingtonePlayer.stop()
        releaseWakeLock()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
        stopSelf()
    }

    override fun onDestroy() {
        shutdownPlayback()
        super.onDestroy()
    }
}
