import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export enum ExpenseCategory {
  UTILITIES = 'UTILITIES',
  TRANSPORT = 'TRANSPORT',
  PACKAGING = 'PACKAGING',
  MARKETING = 'MARKETING',
  OTHERS = 'OTHERS'
}

@Entity()
export class ExtraExpense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: string; // Guardado como string para precisión decimal

  @Column({ type: 'enum', enum: ExpenseCategory, default: ExpenseCategory.OTHERS })
  category: ExpenseCategory;

  @CreateDateColumn()
  date: Date;
}