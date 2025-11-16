export type TimePeriod = "week" | "month" | "year";

export type Notification = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
};

export type MockData = {
  chartData: {
    week: Array<{
      date: string;
      spendings: number;
      sales: number;
      coffee: number;
    }>;
    month: Array<{
      date: string;
      spendings: number;
      sales: number;
      coffee: number;
    }>;
    year: Array<{
      date: string;
      spendings: number;
      sales: number;
      coffee: number;
    }>;
  };
  notifications: Notification[];
};
