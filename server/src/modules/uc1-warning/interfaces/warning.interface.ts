export interface IWarning {
  id: string;
  title: string;
  severity: string;
  affectedAreas: string[];
  message: string;
  createdAt: Date;
}
