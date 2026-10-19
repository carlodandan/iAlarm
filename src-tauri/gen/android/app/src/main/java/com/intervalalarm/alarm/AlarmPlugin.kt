package com.intervalalarm.alarm

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin

@InvokeArg
class SyncAlarmsArgs {
    var alarmsJson: String = "[]"
}

@InvokeArg
class TestToneArgs {
    var tone: String = ""
    var vibration: Boolean = true
}

@InvokeArg
class OpenSettingsArgs {
    var type: String = "app_details"
}

@TauriPlugin
class AlarmPlugin(private val activity: Activity) : Plugin(activity) {

    @Command
    fun getAlarmPermissions(invoke: Invoke) {
        val result = JSObject()
        val context = activity.applicationContext

        val exactAlarm = AlarmScheduler.canScheduleExact(context)
        val notifications = NotificationManagerCompat.from(context).areNotificationsEnabled()

        var batteryUnrestricted = true
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
            batteryUnrestricted = pm.isIgnoringBatteryOptimizations(context.packageName)
        }

        result.put("exact_alarm_granted", exactAlarm)
        result.put("notifications_granted", notifications)
        result.put("full_screen_intent_allowed", true)
        result.put("battery_optimization_unrestricted", batteryUnrestricted)

        invoke.resolve(result)
    }

    @Command
    fun requestNotificationPermission(invoke: Invoke) {
        try {
            activity.runOnUiThread {
                MainActivity.instance?.requestAppPermissions()
            }
            invoke.resolve()
        } catch (e: Exception) {
            invoke.reject(e.message)
        }
    }

    @Command
    fun openExactAlarmSettings(invoke: Invoke) {
        openSettingsInternal("exact_alarm")
        invoke.resolve()
    }

    @Command
    fun openAppSettings(invoke: Invoke) {
        val args = try {
            invoke.parseArgs(OpenSettingsArgs::class.java)
        } catch (e: Exception) {
            OpenSettingsArgs()
        }
        openSettingsInternal(args.type)
        invoke.resolve()
    }

    private fun openSettingsInternal(type: String) {
        val packageName = activity.packageName
        try {
            val intent = when (type) {
                "exact_alarm" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                            data = Uri.parse("package:$packageName")
                        }
                    } else {
                        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                            data = Uri.parse("package:$packageName")
                        }
                    }
                }
                "notifications" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                            putExtra(Settings.EXTRA_APP_PACKAGE, packageName)
                        }
                    } else {
                        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                            data = Uri.parse("package:$packageName")
                        }
                    }
                }
                else -> {
                    Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                        data = Uri.parse("package:$packageName")
                    }
                }
            }
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            activity.startActivity(intent)
        } catch (e: Exception) {
            // Guaranteed fallback to general Application Details Settings
            try {
                val fallback = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.parse("package:$packageName")
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                activity.startActivity(fallback)
            } catch (ignored: Exception) {
            }
        }
    }

    @Command
    fun getDeviceRingtone(invoke: Invoke) {
        try {
            val context = activity.applicationContext
            val uri = RingtoneManager.getActualDefaultRingtoneUri(context, RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getActualDefaultRingtoneUri(context, RingtoneManager.TYPE_RINGTONE)
            val ringtone = RingtoneManager.getRingtone(context, uri)
            val title = ringtone?.getTitle(context) ?: "Device Alarm Ringtone"
            val res = JSObject()
            res.put("title", title)
            res.put("uri", uri?.toString() ?: "")
            invoke.resolve(res)
        } catch (e: Exception) {
            val res = JSObject()
            res.put("title", "Device Alarm Ringtone")
            res.put("uri", "")
            invoke.resolve(res)
        }
    }

    @Command
    fun syncAlarms(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(SyncAlarmsArgs::class.java)
            NativeStorage.saveAlarms(activity, args.alarmsJson)
            AlarmScheduler.rescheduleAll(activity)
            invoke.resolve()
        } catch (e: Exception) {
            invoke.reject(e.message)
        }
    }

    @Command
    fun testTone(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(TestToneArgs::class.java)
            RingtonePlayer.start(activity, args.tone, args.vibration)
            invoke.resolve()
        } catch (e: Exception) {
            invoke.reject(e.message)
        }
    }

    @Command
    fun stopTone(invoke: Invoke) {
        try {
            RingtonePlayer.stop()
            invoke.resolve()
        } catch (e: Exception) {
            invoke.reject(e.message)
        }
    }
}
