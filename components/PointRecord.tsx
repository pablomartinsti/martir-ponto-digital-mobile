import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'react-native';
import { formatTime, weekDays } from '@/utils/dateUtils';
import globalStyles from '@/styles/globalStyles';
import { format, parseISO } from 'date-fns';

interface PointRecordProps {
  record: any;
}

export default function PointRecord({ record }: PointRecordProps) {
  if (
    !record?.date ||
    record?.status === 'Folga' ||
    (!record.clockIn && !record.clockOut && !record.lunchStart && !record.lunchEnd)
  ) {
    return null;
  }

  const parsedDate = parseISO(record.date);

  return (
    <View style={globalStyles.containerReport}>
      <Text style={globalStyles.weekDay}>
        {weekDays[parsedDate.getDay()]} - {format(parsedDate, 'dd/MM/yyyy')}
      </Text>

      <View style={globalStyles.containerTime}>
        <View style={globalStyles.boxTime}>
          <View style={globalStyles.pointTime}>
            <Image
              source={require('@/assets/icons/arrow_forward.png')}
              style={{
                width: 28,
                height: 28,
                tintColor: '#00ff15'
              }}
            />
            <Text style={globalStyles.timeText}>{formatTime(record.clockIn)}</Text>
          </View>

          <View style={globalStyles.pointTime}>
            <Image
              source={require('@/assets/icons/arrow_back.png')}
              style={{
                width: 28,
                height: 28,
                tintColor: '#ff0000'
              }}
            />
            <Text style={globalStyles.timeText}>{formatTime(record.lunchStart)}</Text>
          </View>

          <View style={globalStyles.pointTime}>
            <Image
              source={require('@/assets/icons/arrow_forward.png')}
              style={{
                width: 28,
                height: 28,
                tintColor: '#00ff15'
              }}
            />
            <Text style={globalStyles.timeText}>{formatTime(record.lunchEnd)}</Text>
          </View>

          <View style={globalStyles.pointTime}>
            <Image
              source={require('@/assets/icons/arrow_back.png')}
              style={{
                width: 28,
                height: 28,
                tintColor: '#ff0000'
              }}
            />
            <Text style={globalStyles.timeText}>{formatTime(record.clockOut)}</Text>
          </View>
        </View>

        <View style={globalStyles.containerWorked}>
          <View style={globalStyles.boxWorkedLeft}>
            <Text style={globalStyles.workedText}>Horas</Text>
            <Text style={globalStyles.bankHoursValue}>{record?.workedHours || '00:00'}</Text>
          </View>

          <View style={globalStyles.boxWorkedRight}>
            <Text style={globalStyles.workedText}>Saldo</Text>
            <Text
              style={[
                globalStyles.bankHoursValue,
                record?.balance?.includes('-') ? globalStyles.negative : globalStyles.positive
              ]}
            >
              {record?.balance || '00:00'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
