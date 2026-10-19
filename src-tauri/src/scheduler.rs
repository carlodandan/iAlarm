use chrono::{Datelike, Local, TimeZone};
use crate::models::{AlarmSequence, AlarmState, IntervalUnit, Occurrence, RepetitionMode, SchedulePreviewItem};

pub struct Scheduler;

impl Scheduler {
    pub fn to_local_datetime(ms: i64) -> chrono::DateTime<Local> {
        match Local.timestamp_millis_opt(ms) {
            chrono::LocalResult::Single(dt) => dt,
            chrono::LocalResult::Ambiguous(dt1, _) => dt1,
            chrono::LocalResult::None => Local::now(),
        }
    }

    /// Calculate the scheduled time for occurrence index n of a sequence base start time
    pub fn calculate_occurrence_time(start_time_ms: i64, interval_ms: i64, n: u32) -> i64 {
        start_time_ms + (n as i64 * interval_ms)
    }

    /// Generate human-readable preview items for the occurrences of a sequence
    pub fn generate_preview(
        start_time_ms: i64,
        interval_value: u32,
        interval_unit: &IntervalUnit,
        total_occurrences: u32,
        time_format_24h: bool,
    ) -> Vec<SchedulePreviewItem> {
        let interval_ms = match interval_unit {
            IntervalUnit::Minutes => (interval_value as i64) * 60 * 1000,
            IntervalUnit::Hours => (interval_value as i64) * 3600 * 1000,
        };

        let mut items = Vec::new();
        let start_dt = Self::to_local_datetime(start_time_ms);

        for i in 0..total_occurrences {
            let trigger_ms = Self::calculate_occurrence_time(start_time_ms, interval_ms, i);
            let trigger_dt = Self::to_local_datetime(trigger_ms);


            let formatted_time = if time_format_24h {
                trigger_dt.format("%H:%M").to_string()
            } else {
                trigger_dt.format("%I:%M %p").to_string()
            };

            let day_diff = trigger_dt.date_naive().signed_duration_since(start_dt.date_naive()).num_days();
            let hours_offset = (i as i64 * interval_ms) / (3600 * 1000);

            let day_offset_label = if i == 0 {
                "Genesis".to_string()
            } else if day_diff > 0 {
                format!("+{}d (+{}h)", day_diff, hours_offset)
            } else {
                format!("+{}h", hours_offset)
            };

            let label = if i == 0 {
                "Initial Start".to_string()
            } else if i == total_occurrences - 1 {
                "Final Sequence Marker".to_string()
            } else {
                format!("Cadence step {}", i + 1)
            };

            items.push(SchedulePreviewItem {
                occurrence_index: i,
                trigger_time: trigger_ms,
                formatted_time,
                day_offset_label,
                label,
            });
        }

        items
    }

    /// Determines the next future occurrence for a sequence starting from `now_ms`.
    /// Handles skipping past/missed occurrences gracefully without shifting the grid.
    pub fn compute_next_occurrence(sequence: &AlarmSequence, now_ms: i64) -> (AlarmSequence, Option<Occurrence>) {
        let mut updated = sequence.clone();

        if !updated.enabled {
            updated.state = AlarmState::Disabled;
            updated.next_trigger_time = None;
            updated.snoozed_until = None;
            return (updated, None);
        }

        // If currently snoozed and snooze time is in future:
        if let Some(snooze_ms) = updated.snoozed_until {
            if snooze_ms > now_ms {
                updated.state = AlarmState::Snoozed;
                updated.next_trigger_time = Some(snooze_ms);
                return (
                    updated.clone(),
                    Some(Occurrence {
                        occurrence_index: updated.current_occurrence_index,
                        total_occurrences: updated.total_occurrences,
                        trigger_time: snooze_ms,
                        is_snooze: true,
                        label: format!("Snoozed alarm (step {} of {})", updated.current_occurrence_index + 1, updated.total_occurrences),
                    }),
                );
            } else {
                // Snooze expired
                updated.snoozed_until = None;
            }
        }

        let interval_ms = updated.interval_duration_ms();

        // Check if current sequence has future occurrences
        while updated.current_occurrence_index < updated.total_occurrences {
            let occ_time = Self::calculate_occurrence_time(updated.start_time, interval_ms, updated.current_occurrence_index);
            if occ_time > now_ms {
                updated.state = AlarmState::Scheduled;
                updated.next_trigger_time = Some(occ_time);
                return (
                    updated.clone(),
                    Some(Occurrence {
                        occurrence_index: updated.current_occurrence_index,
                        total_occurrences: updated.total_occurrences,
                        trigger_time: occ_time,
                        is_snooze: false,
                        label: format!("Alarm {} of {}", updated.current_occurrence_index + 1, updated.total_occurrences),
                    }),
                );
            }
            // Skip past occurrence
            updated.current_occurrence_index += 1;
        }

        // All occurrences of current cycle are in the past
        match updated.repetition_mode {
            RepetitionMode::OneTime => {
                updated.state = AlarmState::Completed;
                updated.enabled = false;
                updated.next_trigger_time = None;
                (updated, None)
            }
            RepetitionMode::Daily => {
                // Advance start_time to next day at same time-of-day
                let next_start = Self::next_daily_start(updated.start_time, now_ms);
                updated.start_time = next_start;
                updated.current_occurrence_index = 0;
                updated.state = AlarmState::Scheduled;
                let first_occ = Self::calculate_occurrence_time(next_start, interval_ms, 0);
                updated.next_trigger_time = Some(first_occ);
                (
                    updated.clone(),
                    Some(Occurrence {
                        occurrence_index: 0,
                        total_occurrences: updated.total_occurrences,
                        trigger_time: first_occ,
                        is_snooze: false,
                        label: format!("Alarm 1 of {}", updated.total_occurrences),
                    }),
                )
            }
            RepetitionMode::Weekdays => {
                let next_start = Self::next_weekday_start(updated.start_time, &updated.selected_weekdays, now_ms);
                updated.start_time = next_start;
                updated.current_occurrence_index = 0;
                updated.state = AlarmState::Scheduled;
                let first_occ = Self::calculate_occurrence_time(next_start, interval_ms, 0);
                updated.next_trigger_time = Some(first_occ);
                (
                    updated.clone(),
                    Some(Occurrence {
                        occurrence_index: 0,
                        total_occurrences: updated.total_occurrences,
                        trigger_time: first_occ,
                        is_snooze: false,
                        label: format!("Alarm 1 of {}", updated.total_occurrences),
                    }),
                )
            }
            RepetitionMode::Continuous => {
                // Continuous: start_time rolls forward by total sequence duration until first occurrence is > now_ms
                let total_duration = interval_ms * (updated.total_occurrences as i64);
                let mut new_start = updated.start_time;
                while new_start + (updated.total_occurrences as i64 - 1) * interval_ms <= now_ms {
                    new_start += total_duration;
                }
                updated.start_time = new_start;
                updated.current_occurrence_index = 0;
                while updated.current_occurrence_index < updated.total_occurrences {
                    let occ_time = Self::calculate_occurrence_time(new_start, interval_ms, updated.current_occurrence_index);
                    if occ_time > now_ms {
                        break;
                    }
                    updated.current_occurrence_index += 1;
                }
                let next_occ_time = Self::calculate_occurrence_time(new_start, interval_ms, updated.current_occurrence_index);
                updated.state = AlarmState::Scheduled;
                updated.next_trigger_time = Some(next_occ_time);
                (
                    updated.clone(),
                    Some(Occurrence {
                        occurrence_index: updated.current_occurrence_index,
                        total_occurrences: updated.total_occurrences,
                        trigger_time: next_occ_time,
                        is_snooze: false,
                        label: format!("Alarm {} of {}", updated.current_occurrence_index + 1, updated.total_occurrences),
                    }),
                )
            }
        }
    }

    /// Advance sequence upon occurrence dismissal
    pub fn advance_on_dismiss(sequence: &AlarmSequence, now_ms: i64) -> (AlarmSequence, Option<Occurrence>) {
        let mut updated = sequence.clone();
        updated.snoozed_until = None;
        updated.snooze_count = 0;
        updated.current_occurrence_index += 1;
        Self::compute_next_occurrence(&updated, now_ms)
    }

    /// Snooze the current occurrence
    pub fn apply_snooze(sequence: &AlarmSequence, now_ms: i64) -> Result<(AlarmSequence, Occurrence), String> {
        if sequence.snooze_count >= sequence.snooze_max_count {
            return Err(format!("Maximum snooze limit ({}) reached", sequence.snooze_max_count));
        }

        let snooze_duration_ms = (sequence.snooze_duration_minutes as i64) * 60 * 1000;
        let snooze_trigger_ms = now_ms + snooze_duration_ms;

        let mut updated = sequence.clone();
        updated.state = AlarmState::Snoozed;
        updated.snooze_count += 1;
        updated.snoozed_until = Some(snooze_trigger_ms);
        updated.next_trigger_time = Some(snooze_trigger_ms);

        let occ = Occurrence {
            occurrence_index: updated.current_occurrence_index,
            total_occurrences: updated.total_occurrences,
            trigger_time: snooze_trigger_ms,
            is_snooze: true,
            label: format!("Snoozed: Alarm {} of {}", updated.current_occurrence_index + 1, updated.total_occurrences),
        };

        Ok((updated, occ))
    }

    /// Skip next upcoming occurrence
    pub fn skip_next_occurrence(sequence: &AlarmSequence, now_ms: i64) -> (AlarmSequence, Option<Occurrence>) {
        let mut updated = sequence.clone();
        updated.snoozed_until = None;
        updated.snooze_count = 0;
        updated.current_occurrence_index += 1;
        Self::compute_next_occurrence(&updated, now_ms)
    }

    fn next_daily_start(orig_start_ms: i64, now_ms: i64) -> i64 {
        let orig_dt = Self::to_local_datetime(orig_start_ms);
        let now_dt = Self::to_local_datetime(now_ms);

        // Target time of day
        let target_time = orig_dt.time();
        let mut candidate = now_dt.date_naive().and_time(target_time);

        let cand_ms = candidate.and_local_timezone(Local).earliest().unwrap_or_else(|| Local::now()).timestamp_millis();
        if cand_ms <= now_ms {
            candidate = (now_dt.date_naive() + chrono::Duration::days(1)).and_time(target_time);
        }

        candidate.and_local_timezone(Local).earliest().unwrap_or_else(|| Local::now()).timestamp_millis()
    }

    fn next_weekday_start(orig_start_ms: i64, selected_weekdays: &[u8], now_ms: i64) -> i64 {
        let orig_dt = Self::to_local_datetime(orig_start_ms);
        let now_dt = Self::to_local_datetime(now_ms);
        let target_time = orig_dt.time();

        for day_offset in 0..14 {
            let candidate_date = now_dt.date_naive() + chrono::Duration::days(day_offset);
            let iso_weekday = candidate_date.weekday().number_from_monday() as u8;

            if selected_weekdays.contains(&iso_weekday) {
                let candidate_dt = candidate_date.and_time(target_time);
                let candidate_ms = candidate_dt.and_local_timezone(Local).earliest().unwrap_or_else(|| Local::now()).timestamp_millis();
                if candidate_ms > now_ms {
                    return candidate_ms;
                }
            }
        }

        // Fallback
        orig_start_ms + 86400 * 1000
    }

}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{AlarmSequence, AlarmState, IntervalUnit, RepetitionMode};

    fn make_test_sequence(start_ms: i64, interval_hrs: u32, total: u32, mode: RepetitionMode) -> AlarmSequence {
        AlarmSequence {
            id: "test-seq-1".to_string(),
            name: "Test Interval".to_string(),
            category: "medication".to_string(),
            enabled: true,
            start_time: start_ms,
            interval_value: interval_hrs,
            interval_unit: IntervalUnit::Hours,
            total_occurrences: total,
            repetition_mode: mode,
            selected_weekdays: vec![1, 2, 3, 4, 5],
            sound: "Aura Dawn".to_string(),
            vibration: true,
            snooze_duration_minutes: 10,
            snooze_max_count: 3,
            gradual_volume: true,
            created_at: 1000,
            updated_at: 1000,
            current_occurrence_index: 0,
            state: AlarmState::Scheduled,
            next_trigger_time: None,
            snoozed_until: None,
            snooze_count: 0,
        }
    }

    #[test]
    fn test_fixed_interval_formula() {
        // Start: 6:00 AM (e.g. 0 ms)
        // Interval: 6 hours (6 * 3600 * 1000 = 21,600,000 ms)
        // 4 occurrences: 0, 21.6m, 43.2m, 64.8m
        let interval_ms = 6 * 3600 * 1000;
        let start_ms = 1_000_000;

        assert_eq!(Scheduler::calculate_occurrence_time(start_ms, interval_ms, 0), start_ms);
        assert_eq!(Scheduler::calculate_occurrence_time(start_ms, interval_ms, 1), start_ms + interval_ms);
        assert_eq!(Scheduler::calculate_occurrence_time(start_ms, interval_ms, 2), start_ms + 2 * interval_ms);
        assert_eq!(Scheduler::calculate_occurrence_time(start_ms, interval_ms, 3), start_ms + 3 * interval_ms);
    }

    #[test]
    fn test_schedule_preview_crossing_midnight() {
        // 6:00 AM start, 6 hour interval, 4 occurrences
        // 6:00 AM, 12:00 PM, 6:00 PM, 12:00 AM (next day)
        let now = Local::now();
        let start = now.date_naive().and_hms_opt(6, 0, 0).unwrap().and_local_timezone(Local).unwrap().timestamp_millis();
        let previews = Scheduler::generate_preview(start, 6, &IntervalUnit::Hours, 4, false);

        assert_eq!(previews.len(), 4);
        assert_eq!(previews[0].occurrence_index, 0);
        assert_eq!(previews[0].day_offset_label, "Genesis");
        assert_eq!(previews[1].day_offset_label, "+6h");
        assert_eq!(previews[2].day_offset_label, "+12h");
        assert!(previews[3].day_offset_label.contains("+1d") || previews[3].day_offset_label.contains("+18h"));
    }

    #[test]
    fn test_advance_and_completion_one_time() {
        let base_now = 1_000_000;
        let interval_hrs = 2;
        let seq = make_test_sequence(base_now + 1000, interval_hrs, 2, RepetitionMode::OneTime);

        // Occurrence 0
        let (seq_next, occ) = Scheduler::compute_next_occurrence(&seq, base_now);
        assert_eq!(seq_next.current_occurrence_index, 0);
        assert!(occ.is_some());
        assert_eq!(occ.unwrap().occurrence_index, 0);

        // Advance past occurrence 0
        let (seq_2, occ_2) = Scheduler::advance_on_dismiss(&seq_next, base_now + 2000);
        assert_eq!(seq_2.current_occurrence_index, 1);
        assert!(occ_2.is_some());

        // Advance past occurrence 1 -> sequence completed
        let (seq_3, occ_3) = Scheduler::advance_on_dismiss(&seq_2, base_now + 10_000_000);
        assert_eq!(seq_3.state, AlarmState::Completed);
        assert!(!seq_3.enabled);
        assert!(occ_3.is_none());
    }

    #[test]
    fn test_snooze_isolation() {
        let base_now = 5_000_000;
        let seq = make_test_sequence(base_now + 1000, 4, 3, RepetitionMode::OneTime);

        // Apply snooze
        let (snoozed_seq, occ) = Scheduler::apply_snooze(&seq, base_now).unwrap();
        assert_eq!(snoozed_seq.state, AlarmState::Snoozed);
        assert_eq!(snoozed_seq.snooze_count, 1);
        assert_eq!(snoozed_seq.snoozed_until.unwrap(), base_now + 10 * 60 * 1000);
        assert_eq!(occ.trigger_time, base_now + 10 * 60 * 1000);
        assert!(occ.is_snooze);

        // Original start_time and current_occurrence_index must remain intact!
        assert_eq!(snoozed_seq.start_time, seq.start_time);
        assert_eq!(snoozed_seq.current_occurrence_index, 0);
    }

    #[test]
    fn test_skip_past_occurrences_after_downtime() {
        let _interval_ms = 3600 * 1000; // 1 hour
        let start_ms = 1_000_000;
        // Total 4: 1m, 4.6m, 8.2m, 11.8m
        let seq = make_test_sequence(start_ms, 1, 4, RepetitionMode::OneTime);


        // Device boots at start_ms + 2.5 hours -> occurrences 0 and 1 are in past
        let current_time = start_ms + (2 * 3600 * 1000) + 1000;
        let (updated, occ) = Scheduler::compute_next_occurrence(&seq, current_time);

        assert_eq!(updated.current_occurrence_index, 3); // occurrence 2 is at +2h which is also past current_time (+2h1s), so occurrence 3
        assert!(occ.is_some());
        assert_eq!(occ.unwrap().occurrence_index, 3);
    }
}

