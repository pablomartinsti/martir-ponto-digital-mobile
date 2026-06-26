export type TimeRecord = {
  _id: string;
  date: string;
  clockIn: string | null;
  lunchStart: string | null;
  lunchEnd: string | null;
  clockOut: string | null;
  workedHours?: string;
  balance?: string;
  status?: string;
};

export type TimeRecordsResponse = {
  period?: {
    startDate: string;
    endDate: string;
    type: "day" | "week" | "month";
  };
  records: TimeRecord[];
  totalPositiveHours?: string;
  totalNegativeHours?: string;
  finalBalance?: string;
  message?: string;
};
