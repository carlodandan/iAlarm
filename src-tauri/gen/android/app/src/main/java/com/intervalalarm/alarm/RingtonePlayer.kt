package com.intervalalarm.alarm

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.Ringtone
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log

object RingtonePlayer {
    private const val TAG = "RingtonePlayer"
    private var mediaPlayer: MediaPlayer? = null
    private var fallbackRingtone: Ringtone? = null
    private var vibrator: Vibrator? = null
    private var isPlaying = false

    @Synchronized
    fun start(context: Context, soundNameOrUri: String?, enableVibration: Boolean) {
        if (isPlaying) {
            Log.d(TAG, "Ringtone is already actively ringing")
            return
        }
        isPlaying = true

        try {
            val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

            // Ensure alarm audio stream is audible (prevent silent/low alarm bug)
            val maxVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM)
            val currentVol = audioManager.getStreamVolume(AudioManager.STREAM_ALARM)
            if (currentVol < (maxVol * 0.7).toInt()) {
                audioManager.setStreamVolume(
                    AudioManager.STREAM_ALARM,
                    (maxVol * 0.85).toInt(),
                    0
                )
            }

            // Resolve ringtone URI: check if specific URI was provided, otherwise use device default alarm ringtone
            var alarmUri: Uri? = null
            if (!soundNameOrUri.isNullOrEmpty() && (soundNameOrUri.startsWith("content://") || soundNameOrUri.startsWith("android.resource://"))) {
                try {
                    alarmUri = Uri.parse(soundNameOrUri)
                } catch (e: Exception) {
                    alarmUri = null
                }
            }

            if (alarmUri == null) {
                alarmUri = RingtoneManager.getActualDefaultRingtoneUri(context, RingtoneManager.TYPE_ALARM)
                    ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                    ?: RingtoneManager.getActualDefaultRingtoneUri(context, RingtoneManager.TYPE_RINGTONE)
                    ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            }

            mediaPlayer = MediaPlayer().apply {
                if (alarmUri != null) {
                    setDataSource(context, alarmUri)
                }
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setFlags(AudioAttributes.FLAG_AUDIBILITY_ENFORCED)
                        .build()
                )
                setVolume(1.0f, 1.0f)
                isLooping = true
                prepare()
                start()
            }
            Log.d(TAG, "Started MediaPlayer with URI: $alarmUri")
        } catch (e: Exception) {
            Log.e(TAG, "MediaPlayer failed: ${e.message}, falling back to system Ringtone")
            try {
                val fallbackUri = RingtoneManager.getActualDefaultRingtoneUri(context, RingtoneManager.TYPE_ALARM)
                    ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                fallbackRingtone = RingtoneManager.getRingtone(context, fallbackUri)?.apply {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        audioAttributes = AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .setFlags(AudioAttributes.FLAG_AUDIBILITY_ENFORCED)
                            .build()
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                        isLooping = true
                    }
                    play()
                }
            } catch (e2: Exception) {
                Log.e(TAG, "Fallback system ringtone failed: ${e2.message}")
            }
        }

        if (enableVibration) {
            try {
                vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                    vm.defaultVibrator
                } else {
                    @Suppress("DEPRECATION")
                    context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                }

                val pattern = longArrayOf(0, 1000, 600, 1000, 600)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator?.vibrate(pattern, 0)
                }
                Log.d(TAG, "Started vibration pattern")
            } catch (e: Exception) {
                Log.e(TAG, "Error starting vibration: ${e.message}")
            }
        }
    }

    @Synchronized
    fun stop() {
        if (!isPlaying) return
        isPlaying = false

        try {
            mediaPlayer?.stop()
            mediaPlayer?.release()
            mediaPlayer = null
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping media player: ${e.message}")
        }

        try {
            fallbackRingtone?.stop()
            fallbackRingtone = null
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping fallback ringtone: ${e.message}")
        }

        try {
            vibrator?.cancel()
            vibrator = null
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping vibrator: ${e.message}")
        }

        Log.d(TAG, "Ringtone and vibration stopped")
    }
}
