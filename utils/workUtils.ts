import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";

export const getWeekdayAndDate = (dateString: string): string => {
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const date = dayjs(dateString);
  return `${weekDays[date.day()]} - ${date.format("DD/MM/YYYY")}`;
};

export const resetWorkState = async (
  setStatus: React.Dispatch<React.SetStateAction<any>>,
  setElapsedTime: React.Dispatch<React.SetStateAction<number>>,
  setTimerPaused: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setStatus({
    clockIn: false,
    lunchStart: false,
    lunchEnd: false,
    clockOut: false,
  });
  setElapsedTime(0);
  setTimerPaused(true);
  await AsyncStorage.removeItem("recordId");
};

export const calculateElapsedTime = (
  clockIn: string,
  lunchStart?: string,
  lunchEnd?: string
) => {
  const currentTime = new Date().getTime();
  const start = new Date(clockIn).getTime();
  const pause = lunchStart ? new Date(lunchStart).getTime() : null;
  const resume = lunchEnd ? new Date(lunchEnd).getTime() : null;

  if (!pause) {
    return { time: Math.floor((currentTime - start) / 1000), paused: false };
  }

  if (pause && !resume) {
    return { time: Math.floor((pause - start) / 1000), paused: true };
  }

  if (resume) {
    return {
      time:
        Math.floor((pause - start) / 1000) +
        Math.floor((currentTime - resume) / 1000),
      paused: false,
    };
  }

  return { time: 0, paused: true };
};
export const formatDateUTCMinus3 = (date: Date): string => {
  const utcMinus3 = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  return utcMinus3.toISOString().split("T")[0];
};
