import { StyleSheet } from "react-native";

const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#011D4C",
    paddingTop: 20,
    paddingBottom: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  containerFilter: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  textFilter: {
    color: "#fff",
    fontSize: 18,
    marginHorizontal: 10,
  },
  containerBankHours: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
  },
  boxBankHours: {
    alignItems: "center",
    padding: 5,
    borderRadius: 8,
  },
  bankHoursText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 5,
  },
  bankHoursValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  border: {
    width: "100%",
    borderBottomColor: "#fff",
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  content: {
    flex: 1,
    width: "90%",
  },
  scrollView: {
    flexGrow: 1,
  },
  containerReport: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    borderColor: "#fff",
    marginBottom: 10,
  },
  weekDay: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  containerTime: {
    flexDirection: "column",
    justifyContent: "space-around",
    marginTop: 5,
  },
  boxTime: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 5,
  },
  pointTime: {
    alignItems: "center",
  },
  timeText: {
    color: "#fff",
    fontSize: 16,
  },
  containerWorked: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 20,
    width: "100%",
  },
  boxWorked: {
    justifyContent: "center",
    alignItems: "flex-start",
  },
  workedText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  workedValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  positive: {
    color: "#00ff15", // Verde para saldo positivo
  },
  negative: {
    color: "#ff0000", // Vermelho para saldo negativo
  },
  view: {
    gap: 20,
  },
});

export default globalStyles;
