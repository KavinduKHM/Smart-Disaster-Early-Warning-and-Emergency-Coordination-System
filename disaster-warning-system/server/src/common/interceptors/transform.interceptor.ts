import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/api-response.dto';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponseDto<T>> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode || 200;

    return next.handle().pipe(
      map((result) => {
        // If the controller already returned a custom formatted response, return it as is
        if (result && typeof result === 'object' && 'success' in result && 'statusCode' in result) {
          return result;
        }

        const message = result?.message || 'Operation successful';
        const data = result?.data !== undefined ? result.data : result;

        return ApiResponseDto.success(data, message, statusCode);
      }),
    );
  }
}
