export interface INotification {
  notification: {
    title: string;
    body: string;
  };
  data?: any;
  tokens?: string[];
}
