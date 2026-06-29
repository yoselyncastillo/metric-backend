import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateBatchDto {
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  quantity?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  remainingQuantity?: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;
}
