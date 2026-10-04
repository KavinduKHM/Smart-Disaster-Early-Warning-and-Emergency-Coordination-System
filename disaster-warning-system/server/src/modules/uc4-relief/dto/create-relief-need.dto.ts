import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateReliefNeedDto {
  @IsString()
  @IsNotEmpty()
  district: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsIn(['FOOD', 'WATER', 'MEDICINE', 'SHELTER', 'OTHER'])
  category: string;

  @IsInt()
  @Min(1)
  quantityRequired: number;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;
}