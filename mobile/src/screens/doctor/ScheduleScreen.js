import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Modal,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import { doctorService } from '../../services/api';
import { Card, Button, Badge } from '../../components/UI';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';
import { format, addDays } from 'date-fns';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_OPTIONS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export default function ScheduleScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('weekly');
  const [schedule, setSchedule] = useState(null);
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDates, setSelectedDates] = useState({});

  // Weekly schedule state
  // Weekly schedule state with shifts
  const [weeklySchedule, setWeeklySchedule] = useState(
    DAYS.map((day, index) => ({
      day_of_week: index + 1, // 1-7 for Mon-Sun as expected by backends usually, or check logic
      day_name: day,
      is_active: index < 5,
      shifts: [{ start: '09:00', end: '17:00' }],
    }))
  );

  const [timePicker, setTimePicker] = useState({
    visible: false,
    dayIndex: null,
    shiftIndex: null,
    field: null,
    currentValue: '',
  });

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const response = await doctorService.getMySchedule();
      if (response.data.schedule) {
        setSchedule(response.data.schedule);
        // Update weekly schedule from server
        if (response.data.schedule.weekly_schedule) {
          const updatedSchedule = weeklySchedule.map(day => {
            const serverDay = response.data.schedule.weekly_schedule.find(
              s => (s.day_of_week === day.day_of_week) || (s.day_name === day.day_name)
            );
            // Convert legacy start_time/end_time to shifts if shifts is missing
            let shifts = serverDay?.shifts || [];
            if (shifts.length === 0 && serverDay?.start_time) {
              shifts = [{ start: serverDay.start_time, end: serverDay.end_time }];
            }
            if (shifts.length === 0) shifts = [{ start: '09:00', end: '17:00' }];
            
            return { 
              ...day, 
              ...serverDay, 
              shifts, 
              is_active: serverDay ? serverDay.is_active : false,
              day_name: day.day_name 
            };
          });
          setWeeklySchedule(updatedSchedule);
        }
      }
      if (response.data.blocked_dates) {
        setBlockedDates(response.data.blocked_dates);
        // Mark blocked dates for calendar
        const marked = {};
        response.data.blocked_dates.forEach(block => {
          marked[block.date] = {
            marked: true,
            dotColor: COLORS.error,
            selected: true,
            selectedColor: COLORS.error + '30',
          };
        });
        setSelectedDates(marked);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      const payload = {
        weekly_schedule: weeklySchedule.map(d => ({
          day_of_week: DAYS.indexOf(d.day_name),
          day_name: d.day_name,
          is_active: d.is_active,
          start_time: d.shifts && d.shifts.length > 0 ? d.shifts[0].start : "09:00",
          end_time: d.shifts && d.shifts.length > 0 ? d.shifts[0].end : "17:00",
          slot_duration: 30,
          shifts: d.is_active ? d.shifts : []
        })),
        break_times: [],
      };
      await doctorService.setSchedule(payload);
      Alert.alert('Success', 'Schedule saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleBlockDates = async () => {
    const datesToBlock = Object.keys(selectedDates).filter(
      date => selectedDates[date].selected && !blockedDates.find(b => b.date === date)
    );
    
    if (datesToBlock.length === 0) {
      Alert.alert('Info', 'Select dates on the calendar to block');
      return;
    }

    setSaving(true);
    try {
      await doctorService.blockDates(datesToBlock);
      Alert.alert('Success', `Blocked ${datesToBlock.length} dates`);
      fetchSchedule();
    } catch (error) {
      Alert.alert('Error', 'Failed to block dates');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (dayIndex) => {
    setWeeklySchedule(prev => prev.map((day, i) => 
      i === dayIndex ? { ...day, is_active: !day.is_active } : day
    ));
  };

  const addShift = (dayIndex) => {
    setWeeklySchedule(prev => prev.map((day, i) => 
      i === dayIndex ? { ...day, shifts: [...day.shifts, { start: '09:00', end: '17:00' }] } : day
    ));
  };

  const removeShift = (dayIndex, shiftIndex) => {
    setWeeklySchedule(prev => prev.map((day, i) => 
      i === dayIndex ? { ...day, shifts: day.shifts.filter((_, idx) => idx !== shiftIndex) } : day
    ));
  };

  const updateShiftTime = (dayIndex, shiftIndex, field, value) => {
    setWeeklySchedule(prev => prev.map((day, i) => 
      i === dayIndex ? { 
        ...day, 
        shifts: day.shifts.map((s, idx) => idx === shiftIndex ? { ...s, [field]: value } : s)
      } : day
    ));
    setTimePicker({ ...timePicker, visible: false });
  };

  const openTimePicker = (dayIndex, shiftIndex, field, currentValue) => {
    setTimePicker({
      visible: true,
      dayIndex,
      shiftIndex,
      field,
      currentValue,
    });
  };

  const TimePickerModal = () => (
    <Modal
      visible={timePicker.visible}
      transparent
      animationType="fade"
      onRequestClose={() => setTimePicker({ ...timePicker, visible: false })}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setTimePicker({ ...timePicker, visible: false })}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select {timePicker.field === 'start' ? 'Start' : 'End'} Time</Text>
          <FlatList
            data={TIME_OPTIONS}
            numColumns={3}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.timeGridItem,
                  timePicker.currentValue === item && styles.timeGridItemActive
                ]}
                onPress={() => updateShiftTime(timePicker.dayIndex, timePicker.shiftIndex, timePicker.field, item)}
              >
                <Text style={[
                  styles.timeGridText,
                  timePicker.currentValue === item && styles.timeGridTextActive
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.timeGrid}
          />
          <Button 
            title="Cancel" 
            variant="outline" 
            onPress={() => setTimePicker({ ...timePicker, visible: false })}
            style={{ marginTop: SPACING.md }}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const onDayPress = (day) => {
    const dateString = day.dateString;
    setSelectedDates(prev => {
      const isSelected = prev[dateString]?.selected;
      if (isSelected) {
        const { [dateString]: removed, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [dateString]: {
          selected: true,
          selectedColor: COLORS.error + '50',
        },
      };
    });
  };

  const TimeSelector = ({ label, value, onChange }) => (
    <View style={styles.timeSelector}>
      <Text style={styles.timeSelectorLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.timeOptions}>
          {TIME_OPTIONS.map(time => (
            <TouchableOpacity
              key={time}
              style={[styles.timeOption, value === time && styles.timeOptionActive]}
              onPress={() => onChange(time)}
            >
              <Text style={[styles.timeOptionText, value === time && styles.timeOptionTextActive]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Schedule</Text>
        <Text style={styles.subtitle}>Manage your availability</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'weekly' && styles.tabActive]}
          onPress={() => setActiveTab('weekly')}
        >
          <Text style={[styles.tabText, activeTab === 'weekly' && styles.tabTextActive]}>
            Weekly Hours
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'block' && styles.tabActive]}
          onPress={() => setActiveTab('block')}
        >
          <Text style={[styles.tabText, activeTab === 'block' && styles.tabTextActive]}>
            Block Dates
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'weekly' ? (
          <>
            {/* Weekly Schedule */}
            <Card elevated style={styles.scheduleCard}>
              <Text style={styles.cardTitle}>Working Days</Text>
              <Text style={styles.cardSubtitle}>Set your regular working hours</Text>

              {weeklySchedule.map((day, index) => (
                <View key={day.day_name} style={styles.dayRow}>
                  <View style={styles.dayHeader}>
                    <Switch
                      value={day.is_active}
                      onValueChange={() => toggleDay(index)}
                      trackColor={{ false: COLORS.border, true: COLORS.primary + '50' }}
                      thumbColor={day.is_active ? COLORS.primary : COLORS.textMuted}
                    />
                    <Text style={[styles.dayName, !day.is_active && styles.dayNameInactive]}>
                      {day.day_name}
                    </Text>
                    {day.is_active && (
                      <TouchableOpacity onPress={() => addShift(index)} style={styles.addShiftBtn}>
                        <Text style={styles.addShiftBtnText}>+ Add Shift</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {day.is_active && day.shifts.map((shift, sIdx) => (
                    <View key={sIdx} style={styles.dayTimes}>
                      <View style={styles.timeInput}>
                        <TouchableOpacity
                          style={styles.timeValue}
                          onPress={() => openTimePicker(index, sIdx, 'start', shift.start)}
                        >
                          <Text style={styles.timeValueText}>{shift.start}</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.timeSeparator}>to</Text>
                      <View style={styles.timeInput}>
                        <TouchableOpacity
                          style={styles.timeValue}
                          onPress={() => openTimePicker(index, sIdx, 'end', shift.end)}
                        >
                          <Text style={styles.timeValueText}>{shift.end}</Text>
                        </TouchableOpacity>
                      </View>
                      {day.shifts.length > 1 && (
                        <TouchableOpacity 
                          style={styles.removeShiftBtn}
                          onPress={() => removeShift(index, sIdx)}
                        >
                          <Text style={styles.removeShiftText}>×</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </Card>


            <Button
              title="Save Schedule"
              onPress={handleSaveSchedule}
              loading={saving}
              style={styles.saveButton}
            />
          </>
        ) : (
          <>
            {/* Block Dates Calendar */}
            <Card elevated style={styles.calendarCard}>
              <Text style={styles.cardTitle}>Block Specific Dates</Text>
              <Text style={styles.cardSubtitle}>
                Select dates when you're unavailable (vacation, etc.)
              </Text>

              <Calendar
                markedDates={selectedDates}
                onDayPress={onDayPress}
                minDate={format(new Date(), 'yyyy-MM-dd')}
                maxDate={format(addDays(new Date(), 90), 'yyyy-MM-dd')}
                theme={{
                  todayTextColor: COLORS.primary,
                  selectedDayBackgroundColor: COLORS.primary,
                  selectedDayTextColor: COLORS.surface,
                  arrowColor: COLORS.primary,
                  monthTextColor: COLORS.text,
                  textMonthFontWeight: '600',
                  textDayFontSize: 14,
                  textMonthFontSize: 16,
                }}
                style={styles.calendar}
              />

              <View style={styles.calendarLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.error }]} />
                  <Text style={styles.legendText}>Blocked</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
                  <Text style={styles.legendText}>Today</Text>
                </View>
              </View>
            </Card>

            {/* Blocked Dates List */}
            {blockedDates.length > 0 && (
              <Card style={styles.blockedListCard}>
                <Text style={styles.cardTitle}>Currently Blocked</Text>
                <View style={styles.blockedList}>
                  {blockedDates.slice(0, 5).map(block => (
                    <Badge key={block.date} text={block.date} variant="error" />
                  ))}
                  {blockedDates.length > 5 && (
                    <Badge text={`+${blockedDates.length - 5} more`} variant="default" />
                  )}
                </View>
              </Card>
            )}

            <Button
              title="Block Selected Dates"
              onPress={handleBlockDates}
              loading={saving}
              style={styles.saveButton}
            />
          </>
        )}
      </ScrollView>
      <TimePickerModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  scheduleCard: {
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  dayRow: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dayName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  dayNameInactive: {
    color: COLORS.textMuted,
  },
  dayTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingLeft: 40,
  },
  addShiftBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary + '15',
  },
  addShiftBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  removeShiftBtn: {
    marginLeft: SPACING.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeShiftText: {
    color: COLORS.error,
    fontSize: 18,
    fontWeight: '700',
    marginTop: -2,
  },
  timeInput: {},
  timeLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  timeValue: {
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeValueText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  timeSeparator: {
    marginHorizontal: SPACING.sm,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  breakCard: {
    marginBottom: SPACING.md,
  },
  breakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  breakLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  breakTimes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakTime: {
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  breakTimeText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  breakSeparator: {
    marginHorizontal: SPACING.sm,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  slotCard: {
    marginBottom: SPACING.md,
  },
  slotOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  slotOption: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slotOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  slotOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  slotOptionTextActive: {
    color: COLORS.surface,
  },
  calendarCard: {
    marginBottom: SPACING.md,
  },
  calendar: {
    borderRadius: RADIUS.md,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.xs,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  blockedListCard: {
    marginBottom: SPACING.md,
  },
  blockedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  saveButton: {
    marginBottom: SPACING.xxl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  timeGrid: {
    paddingBottom: SPACING.md,
  },
  timeGridItem: {
    flex: 1,
    margin: 4,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  timeGridItemActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeGridText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  timeGridTextActive: {
    color: COLORS.surface,
  },
});
