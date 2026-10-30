package com.intervalalarm.alarm

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
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
    private var audioManager: AudioManager? = null
    private var focusRequest: AudioFocusRequest? = null
    private var isPlaying = false
    private var isPausedForFocus = false

    private val audioFocusChangeListener = AudioManager.OnAudioFocusChangeListener { focusChange ->
        Log.d(TAG, "Audio focus changed: $focusChange")
        when (focusChange) {
            AudioManager.AUDIOFOCUS_LOSS -> {
                Log.d(TAG, "Audio focus lost permanently (e.g. phone call). Pausing alarm tone.")
                pausePlayback()
            }
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
                Log.d(TAG, "Audio focus lost transiently. Pausing alarm tone.")
                pausePlayback()
            }
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
                Log.d(TAG, "Audio focus ducking requested.")
                try {
                    mediaPlayer?.setVolume(0.2f, 0.2f)
                } catch (e: Exception) {
                    Log.e(TAG, "Error ducking volume: ${e.message}")
                }
            }
            AudioManager.AUDIOFOCUS_GAIN -> {
                Log.d(TAG, "Audio focus regained. Resuming alarm tone at full volume.")
                try {
                    mediaPlayer?.setVolume(1.0f, 1.0f)
                } catch (ignored: Exception) {}
                resumePlayback()
            }
        }
    }

    private fun pausePlayback() {
        if (!isPlaying || isPausedForFocus) return
        try {
            if (mediaPlayer?.isPlaying == true) {
                mediaPlayer?.pause()
                isPausedForFocus = true
            }
            fallbackRingtone?.stop()
        } catch (e: Exception) {
            Log.e(TAG, "Error pausing playback: ${e.message}")
        }
    }

    private fun resumePlayback() {
        if (!isPlaying || !isPausedForFocus) return
        try {
            mediaPlayer?.start()
            isPausedForFocus = false
        } catch (e: Exception) {
            Log.e(TAG, "Error resuming playback: ${e.message}")
        }
    }

    @Synchronized
    fun start(context: Context, soundNameOrUri: String?, enableVibration: Boolean) {
        if (isPlaying) {
            Log.d(TAG, "Ringtone is already actively ringing")
            return
        }
        isPlaying = true
        isPausedForFocus = false

        try {
            val am = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            audioManager = am

            // Ensure alarm audio stream is audible (prevent silent/low alarm bug)
            val maxVol = am.getStreamMaxVolume(AudioManager.STREAM_ALARM)
            val currentVol = am.getStreamVolume(AudioManager.STREAM_ALARM)
            if (currentVol < (maxVol * 0.7).toInt()) {
                am.setStreamVolume(
                    AudioManager.STREAM_ALARM,
                    (maxVol * 0.85).toInt(),
                    0
                )
            }

            // Request Audio Focus
            val audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setFlags(AudioAttributes.FLAG_AUDIBILITY_ENFORCED)
                .build()

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val req = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
                    .setAudioAttributes(audioAttributes)
                    .setOnAudioFocusChangeListener(audioFocusChangeListener)
                    .build()
                focusRequest = req
                am.requestAudioFocus(req)
            } else {
                @Suppress("DEPRECATION")
                am.requestAudioFocus(
                    audioFocusChangeListener,
                    AudioManager.STREAM_ALARM,
                    AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE
                )
            }

            var played = false

            // 1. Check if sound matches a bundled raw resource ringtone
            val cleanSound = soundNameOrUri?.trim()?.lowercase()
                ?.removePrefix("custom:")
                ?.replace(" ", "_")
                ?.replace("-", "_")

            val rawResId = if (!cleanSound.isNullOrEmpty()) {
                context.resources.getIdentifier(cleanSound, "raw", context.packageName)
            } else 0

            if (rawResId != 0) {
                try {
                    val afd = context.resources.openRawResourceFd(rawResId)
                    mediaPlayer = MediaPlayer().apply {
                        setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
                        afd.close()
                        setAudioAttributes(audioAttributes)
                        setVolume(1.0f, 1.0f)
                        isLooping = true
                        prepare()
                        start()
                    }
                    played = true
                    Log.d(TAG, "Started MediaPlayer with custom raw ringtone: $cleanSound (ID: $rawResId)")
                } catch (e: Exception) {
                    Log.e(TAG, "Failed playing raw ringtone $cleanSound: ${e.message}, falling back to system URI")
                }
            }

            // 2. Fall back to URI or Device Default Ringtone if raw resource was not played
            if (!played) {
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
                    setAudioAttributes(audioAttributes)
                    setVolume(1.0f, 1.0f)
                    isLooping = true
                    prepare()
                    start()
                }
                Log.d(TAG, "Started MediaPlayer with URI: $alarmUri")
            }
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
        isPausedForFocus = false

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

        // Abandon audio focus
        try {
            audioManager?.let { am ->
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    focusRequest?.let { am.abandonAudioFocusRequest(it) }
                } else {
                    @Suppress("DEPRECATION")
                    am.abandonAudioFocus(audioFocusChangeListener)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error abandoning audio focus: ${e.message}")
        }
        focusRequest = null
        audioManager = null

        Log.d(TAG, "Ringtone, vibration, and audio focus stopped")
    }
}
