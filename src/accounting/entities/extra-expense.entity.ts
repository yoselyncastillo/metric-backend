import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "../../auth/entities/user.entity";
import { CashClosure } from "../../closures/entities/cash-closure.entity";

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

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => CashClosure, (closure) => closure.extraExpenses, { nullable: true })
  @JoinColumn({ name: 'closure_id' })
  closure: CashClosure;
}