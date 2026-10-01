import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateSupplyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  unit: string;

  @IsOptional()
  @IsString()
  category?: string;

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

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  storeId?: number;

  @IsOptional()
  @IsString()
  createdAt?: string;
}
