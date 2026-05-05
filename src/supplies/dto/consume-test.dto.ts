import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, Min } from 'class-validator';

export class ConsumeTestDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number;

  @IsBoolean()
  execute: boolean;
}
