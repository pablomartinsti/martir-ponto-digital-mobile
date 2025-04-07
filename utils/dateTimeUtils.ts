import dayjs from "dayjs";

export const formatSecondsToTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export const getFormattedCurrentDate = (): string => {
  const now = new Date();
  const options = {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  } as const;
  return now.toLocaleDateString("pt-BR", options);
};

export const getFormattedCurrentTime = (): string => {
  const now = new Date();
  return now.toLocaleTimeString("pt-BR");
};

export const formatDateToISO = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

export const formatTimeOrPlaceholder = (dateString: string | null): string => {
  if (!dateString) return "--:--";
  return dayjs(dateString).format("HH:mm");
};

export const getUserFirstName = (
  fullName: string | undefined | null
): string => {
  if (!fullName) return "Usuário";
  const firstName = fullName.split(" ")[0];
  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
};
