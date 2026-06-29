import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateSupplyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  unit: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  initialQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalPaid?: number;
}
