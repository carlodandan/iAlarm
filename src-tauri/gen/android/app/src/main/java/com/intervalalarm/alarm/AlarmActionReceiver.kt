package com.intervalalarm.alarm

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class AlarmActionReceiver : BroadcastReceiver() {
    companion object {
        const val TAG = "AlarmActionReceiver"
        const val ACTION_DISMISS = "com.intervalalarm.alarm.ACTION_DISMISS"
        const val ACTION_SNOOZE = "com.intervalalarm.alarm.ACTION_SNOOZE"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val alarmId = intent.getStringExtra(AlarmReceiver.EXTRA_ALARM_ID) ?: return
        val notificationId = intent.getIntExtra("notification_id", 0)

        Log.d(TAG, "Received action ${intent.action} for alarm $alarmId")

        // Stop ringtone immediately
        RingtonePlayer.stop()

        // Clear notification
        if (notificationId != 0) {
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.cancel(notificationId)
        }

        val seq = NativeStorage.getAlarmById(context, alarmId) ?: return

        when (intent.action) {
            ACTION_DISMISS -> {
                val nextIdx = seq.currentOccurrenceIndex + 1
                val updated = seq.copy(
                    currentOccurrenceIndex = nextIdx,
                    snoozedUntil = null,
                    snoozeCount = 0
                )
                NativeStorage.updateAlarm(context, updated)
                AlarmScheduler.scheduleSequence(context, updated)
            }
            ACTION_SNOOZE -> {
                val snoozeMinutes = intent.getIntExtra(AlarmReceiver.EXTRA_SNOOZE_MINUTES, 10)
                val snoozeTime = System.currentTimeMillis() + (snoozeMinutes * 60 * 1000L)
                val updated = seq.copy(
                    snoozedUntil = snoozeTime,
                    snoozeCount = seq.snoozeCount + 1,
                    state = "snoozed"
                )
                NativeStorage.updateAlarm(context, updated)
                AlarmScheduler.scheduleSequence(context, updated)
            }
        }
    }
}

