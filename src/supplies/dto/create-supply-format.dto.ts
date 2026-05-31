import { IsNumber, IsString, IsPositive } from 'class-validator';

export class CreateSupplyFormatDto {
  @IsString()
  name: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  supplyId: number;
}