import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateRecipeIngredientDto {
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  supplyId: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  unit: string;
}

export class CreateRecipeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  portions?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  profitMargin?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeIngredientDto)
  ingredients: CreateRecipeIngredientDto[];
}
