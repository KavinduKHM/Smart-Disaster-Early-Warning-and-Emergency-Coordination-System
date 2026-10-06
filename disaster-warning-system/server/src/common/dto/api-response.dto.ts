export class ApiResponseDto<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  meta?: any;
  timestamp: string;

  constructor(success: boolean, statusCode: number, message: string, data?: T, meta?: any) {
    this.success = success;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.meta = meta;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, message = 'Success', statusCode = 200, meta?: any): ApiResponseDto<T> {
    return new ApiResponseDto<T>(true, statusCode, message, data, meta);
  }

  static error(message: string, statusCode = 400): ApiResponseDto<null> {
    return new ApiResponseDto<null>(false, statusCode, message, null);
  }
}
