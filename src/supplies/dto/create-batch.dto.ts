import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class CreateBatchDto {
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  initialQuantity?: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  totalPaid: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  storeId: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  supplyFormatId?: number;
}
