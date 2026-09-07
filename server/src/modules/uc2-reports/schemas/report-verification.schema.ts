export class ReportVerificationSchema {
  reportId!: string;
  officerId!: string;
  verified!: boolean;
  notes!: string;
  verifiedAt!: Date;
}
