import { StyleSheet } from 'react-native';

const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#011D4C',
    paddingTop: 16,
    paddingBottom: 112
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8
  },
  containerFilter: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    gap: 8
  },
  textFilter: {
    flex: 1,
    color: '#fff',
    fontSize: 17,
    textAlign: 'center'
  },
  containerBankHours: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 370,
    gap: 8,
    marginTop: 4,
    marginBottom: 8
  },
  boxBankHours: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)'
  },
  bankHoursText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  bankHoursValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center'
  },
  border: {
    width: '100%',
    borderBottomColor: 'rgba(255, 255, 255, 0.65)',
    borderBottomWidth: 1,
    marginTop: 14,
    marginBottom: 14
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 370
  },
  scrollContent: {
    paddingBottom: 18
  },
  containerReport: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)'
  },
  weekDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5
  },
  containerTime: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    marginTop: 5
  },
  boxTime: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    gap: 8
  },
  pointTime: {
    flex: 1,
    alignItems: 'center'
  },
  timeText: {
    color: '#fff',
    fontSize: 15,
    textAlign: 'center'
  },
  containerWorked: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 18,
    width: '100%',
    gap: 10
  },
  boxWorked: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  workedText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold'
  },
  workedValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold'
  },
  errorText: {
    color: '#fff',
    fontSize: 17,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 24
  },
  positive: {
    color: '#00ff15'
  },
  negative: {
    color: '#ff4d4d'
  },
  view: {
    gap: 20
  }
});

export default globalStyles;
