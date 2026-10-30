package com.intervalalarm.alarm

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.Calendar

class AlarmSchedulerTest {

    @Test
    fun testFixedIntervalSequenceOccurrences() {
        // Start: 6:00 AM
        val cal = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 6)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val startTime = cal.timeInMillis
        val intervalHours = 6L
        val intervalMs = intervalHours * 3600 * 1000L

        val seq = NativeAlarmSequence(
            id = "test-seq-1",
            name = "Test Sequence",
            enabled = true,
            startTime = startTime,
            intervalValue = intervalHours,
            intervalUnit = "hours",
            totalOccurrences = 4,
            repetitionMode = "one_time",
            selectedWeekdays = emptyList(),
            sound = "Default",
            vibration = true,
            snoozeMinutes = 10,
            snoozeMaxCount = 3,
            currentOccurrenceIndex = 0,
            state = "scheduled",
            nextTriggerTime = null,
            snoozedUntil = null,
            snoozeCount = 0
        )

        // At 5:00 AM (before start), next should be occurrence 0 at 6:00 AM
        val beforeStart = startTime - (3600 * 1000L)
        val res0 = AlarmScheduler.computeNextOccurrence(seq, beforeStart)
        assertNotNull(res0.targetTimeMs)
        assertEquals(startTime, res0.targetTimeMs)
        assertEquals(0, res0.occurrenceIndex)

        // At 7:00 AM (after occ 0, before occ 1), next should be occurrence 1 at 12:00 PM
        val afterOcc0 = startTime + (3600 * 1000L)
        val res1 = AlarmScheduler.computeNextOccurrence(seq, afterOcc0)
        assertNotNull(res1.targetTimeMs)
        assertEquals(startTime + intervalMs, res1.targetTimeMs)
        assertEquals(1, res1.occurrenceIndex)

        // At 6:30 PM (after occ 2), next should be occurrence 3 at 12:00 AM next day
        val afterOcc2 = startTime + (2 * intervalMs) + (1800 * 1000L)
        val res3 = AlarmScheduler.computeNextOccurrence(seq, afterOcc2)
        assertNotNull(res3.targetTimeMs)
        assertEquals(startTime + (3 * intervalMs), res3.targetTimeMs)
        assertEquals(3, res3.occurrenceIndex)

        // After all 4 occurrences have passed
        val afterAll = startTime + (4 * intervalMs) + 1000L
        val resEnd = AlarmScheduler.computeNextOccurrence(seq, afterAll)
        assertTrue(resEnd.isCompleted)
        assertNull(resEnd.targetTimeMs)
    }

    @Test
    fun testMidnightCrossingIntervals() {
        // Start: 10:00 PM (22:00) with 4-hour interval
        val cal = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 22)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val startTime = cal.timeInMillis
        val intervalMs = 4 * 3600 * 1000L

        val seq = NativeAlarmSequence(
            id = "test-midnight",
            name = "Midnight Crossing",
            enabled = true,
            startTime = startTime,
            intervalValue = 4,
            intervalUnit = "hours",
            totalOccurrences = 3, // 10 PM, 2 AM next day, 6 AM next day
            repetitionMode = "one_time",
            selectedWeekdays = emptyList(),
            sound = "Default",
            vibration = true,
            snoozeMinutes = 10,
            snoozeMaxCount = 3,
            currentOccurrenceIndex = 0,
            state = "scheduled",
            nextTriggerTime = null,
            snoozedUntil = null,
            snoozeCount = 0
        )

        // Check occurrence 1 is 2:00 AM next day
        val after10pm = startTime + (3600 * 1000L) // 11:00 PM
        val res1 = AlarmScheduler.computeNextOccurrence(seq, after10pm)
        assertEquals(startTime + intervalMs, res1.targetTimeMs)
        assertEquals(1, res1.occurrenceIndex)

        // Check occurrence 2 is 6:00 AM next day
        val at3am = startTime + intervalMs + (3600 * 1000L) // 3:00 AM
        val res2 = AlarmScheduler.computeNextOccurrence(seq, at3am)
        assertEquals(startTime + (2 * intervalMs), res2.targetTimeMs)
        assertEquals(2, res2.occurrenceIndex)
    }

    @Test
    fun testSnoozePreservesInterval() {
        val now = System.currentTimeMillis()
        val snoozeTime = now + (10 * 60 * 1000L)

        val seq = NativeAlarmSequence(
            id = "test-seq-snooze",
            name = "Snooze Test",
            enabled = true,
            startTime = now - (60 * 1000L),
            intervalValue = 2,
            intervalUnit = "hours",
            totalOccurrences = 3,
            repetitionMode = "one_time",
            selectedWeekdays = emptyList(),
            sound = "Default",
            vibration = true,
            snoozeMinutes = 10,
            snoozeMaxCount = 3,
            currentOccurrenceIndex = 0,
            state = "snoozed",
            nextTriggerTime = null,
            snoozedUntil = snoozeTime,
            snoozeCount = 1
        )

        val res = AlarmScheduler.computeNextOccurrence(seq, now)
        assertEquals(snoozeTime, res.targetTimeMs)
        assertEquals(0, res.occurrenceIndex)
        assertEquals("snoozed", res.newState)
    }

    @Test
    fun testDailyRepetitionAdvancesToNextDay() {
        val cal = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 8)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val origStart = cal.timeInMillis

        // If today at 9:00 AM, next daily start should be tomorrow at 8:00 AM
        val now = origStart + (3600 * 1000L) // 9:00 AM today
        val nextStart = AlarmScheduler.calculateNextDailyStart(origStart, now)

        val expectedCal = Calendar.getInstance().apply {
            timeInMillis = origStart
            add(Calendar.DAY_OF_YEAR, 1)
        }
        assertEquals(expectedCal.timeInMillis, nextStart)
    }

    @Test
    fun testWeekdayRepetitionSelection() {
        // Set Monday 9:00 AM as reference
        val cal = Calendar.getInstance().apply {
            set(Calendar.DAY_OF_WEEK, Calendar.MONDAY)
            set(Calendar.HOUR_OF_DAY, 9)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val origStart = cal.timeInMillis

        // Selected weekdays: Wednesday (3) and Friday (5)
        val selected = listOf(3, 5)

        // If currently Monday 10:00 AM, next should be Wednesday 9:00 AM
        val nowMonday = origStart + (3600 * 1000L)
        val nextWk = AlarmScheduler.calculateNextWeekdayStart(origStart, selected, nowMonday)

        val expectedWednesday = Calendar.getInstance().apply {
            timeInMillis = origStart
            add(Calendar.DAY_OF_YEAR, 2) // Monday + 2 = Wednesday
        }
        assertEquals(expectedWednesday.timeInMillis, nextWk)
    }

    @Test
    fun testDisabledAlarmReturnsNullTargetTime() {
        val now = System.currentTimeMillis()
        val seq = NativeAlarmSequence(
            id = "test-disabled",
            name = "Disabled Alarm",
            enabled = false,
            startTime = now + 10000L,
            intervalValue = 1,
            intervalUnit = "hours",
            totalOccurrences = 3,
            repetitionMode = "one_time",
            selectedWeekdays = emptyList(),
            sound = "Default",
            vibration = true,
            snoozeMinutes = 10,
            snoozeMaxCount = 3,
            currentOccurrenceIndex = 0,
            state = "disabled",
            nextTriggerTime = null,
            snoozedUntil = null,
            snoozeCount = 0
        )

        val res = AlarmScheduler.computeNextOccurrence(seq, now)
        assertTrue(res.isCompleted)
        assertNull(res.targetTimeMs)
        assertEquals("completed", res.newState)
    }
}
