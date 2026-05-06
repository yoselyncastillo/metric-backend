import { Type } from 'class-transformer';
import { IsNumber, IsPositive } from 'class-validator';

export class CreateBatchDto {
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  initialQuantity: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  costPerUnit: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  storeId: number;
}
