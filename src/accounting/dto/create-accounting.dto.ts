// src/accounting/dto/create-accounting.dto.ts
import { IsString, IsNumber, IsEnum, IsPositive } from 'class-validator';
import { ExpenseCategory } from '../entities/extra-expense.entity';

export class CreateAccountingDto {
  @IsString()
  description: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;
} 