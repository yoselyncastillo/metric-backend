import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateSupplyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  unit: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  initialQuantity: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  totalPaid: number;
}
