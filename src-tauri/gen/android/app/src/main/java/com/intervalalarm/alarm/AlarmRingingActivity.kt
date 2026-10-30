package com.intervalalarm.alarm

import android.app.Activity
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class AlarmRingingActivity : Activity() {
    private var alarmId: String? = null
    private var notificationId: Int = 0
    private var snoozeMinutes: Int = 10

    private var titleView: TextView? = null
    private var occurrenceView: TextView? = null
    private var clockView: TextView? = null
    private var dateView: TextView? = null
    private var snoozeBtn: Button? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Show over lockscreen and turn screen on
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
            val km = getSystemService(Context.KEYGUARD_SERVICE) as? android.app.KeyguardManager
            km?.requestDismissKeyguard(this, null)
        }
        @Suppress("DEPRECATION")
        window.addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        )

        // Build premium native dark view matching Stitch design
        val rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#121316"))
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(48, 80, 48, 80)
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }

        // Subtitle pill
        val subtitleView = TextView(this).apply {
            text = "IALARM · INTERVAL ALARM"
            setTextColor(Color.parseColor("#C8BFFF"))
            textSize = 12f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 16)
        }
        rootLayout.addView(subtitleView)

        // Alarm Title
        titleView = TextView(this).apply {
            setTextColor(Color.WHITE)
            textSize = 26f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 12)
        }
        rootLayout.addView(titleView)

        // Occurrence pill
        occurrenceView = TextView(this).apply {
            setTextColor(Color.parseColor("#40E17E"))
            textSize = 14f
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 60)
        }
        rootLayout.addView(occurrenceView)

        // Digital Clock Time
        clockView = TextView(this).apply {
            setTextColor(Color.WHITE)
            textSize = 54f
            typeface = Typeface.create("sans-serif-light", Typeface.NORMAL)
            gravity = Gravity.CENTER
            setPadding(0, 40, 0, 10)
        }
        rootLayout.addView(clockView)

        dateView = TextView(this).apply {
            setTextColor(Color.parseColor("#928F9D"))
            textSize = 14f
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 100)
        }
        rootLayout.addView(dateView)

        // Spacer
        val spacer = LinearLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                0,
                1.0f
            )
        }
        rootLayout.addView(spacer)

        // Dismiss Button
        val dismissBtn = Button(this).apply {
            text = "Dismiss Occurrence"
            setTextColor(Color.parseColor("#121316"))
            setBackgroundColor(Color.parseColor("#C8BFFF"))
            textSize = 16f
            typeface = Typeface.DEFAULT_BOLD
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                160
            ).apply {
                setMargins(0, 0, 0, 24)
            }
            setOnClickListener {
                dismissAlarm()
            }
        }
        rootLayout.addView(dismissBtn)

        // Snooze Button
        snoozeBtn = Button(this).apply {
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.parseColor("#292A2D"))
            textSize = 15f
            typeface = Typeface.DEFAULT_BOLD
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                140
            )
            setOnClickListener {
                snoozeAlarm()
            }
        }
        rootLayout.addView(snoozeBtn)

        setContentView(rootLayout)

        renderAlarm(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        renderAlarm(intent)
    }

    private fun renderAlarm(intent: Intent?) {
        if (intent == null) return
        alarmId = intent.getStringExtra(AlarmReceiver.EXTRA_ALARM_ID)
        val alarmName = intent.getStringExtra(AlarmReceiver.EXTRA_ALARM_NAME) ?: "Interval Alarm"
        val occurrenceIndex = intent.getIntExtra(AlarmReceiver.EXTRA_OCCURRENCE_INDEX, 0)
        val totalOccurrences = intent.getIntExtra(AlarmReceiver.EXTRA_TOTAL_OCCURRENCES, 1)
        snoozeMinutes = intent.getIntExtra(AlarmReceiver.EXTRA_SNOOZE_MINUTES, 10)
        notificationId = intent.getIntExtra("notification_id", 0)

        titleView?.text = alarmName
        occurrenceView?.text = "Occurrence ${occurrenceIndex + 1} of $totalOccurrences"

        val timeFormat = SimpleDateFormat("hh:mm a", Locale.getDefault())
        clockView?.text = timeFormat.format(Date())

        val dateFormat = SimpleDateFormat("EEEE, MMMM d", Locale.getDefault())
        dateView?.text = dateFormat.format(Date())

        snoozeBtn?.text = "Snooze (${snoozeMinutes}m)"
    }

    private fun dismissAlarm() {
        AlarmPlaybackService.stop(this)
        RingtonePlayer.stop()
        clearNotification()

        alarmId?.let { id ->
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
            }
        }

        finishAndRemoveTask()
    }

    private fun snoozeAlarm() {
        AlarmPlaybackService.stop(this)
        RingtonePlayer.stop()
        clearNotification()

        alarmId?.let { id ->
            val seq = NativeStorage.getAlarmById(this, id)
            if (seq != null) {
                val snoozeTime = System.currentTimeMillis() + (snoozeMinutes * 60 * 1000L)
                val updated = seq.copy(
                    snoozedUntil = snoozeTime,
                    snoozeCount = seq.snoozeCount + 1,
                    state = "snoozed"
                )
                NativeStorage.updateAlarm(this, updated)
                AlarmScheduler.scheduleSequence(this, updated)
            }
        }

        finishAndRemoveTask()
    }

    private fun clearNotification() {
        if (notificationId != 0) {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.cancel(notificationId)
        }
    }

    override fun onDestroy() {
        if (isFinishing) {
            AlarmPlaybackService.stop(this)
            RingtonePlayer.stop()
        }
        super.onDestroy()
    }
}

