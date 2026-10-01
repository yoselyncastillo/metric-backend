import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { FinishedProduct } from '../../production/entities/finished-product.entity';
import { ExtraExpense } from '../../accounting/entities/extra-expense.entity';
import { InventoryBatch } from '../../supplies/entities/inventory-batch.entity';

@Entity('cash_closures')
export class CashClosure {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: '0' })
  totalRevenue: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: '0' })
  totalExpenses: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: '0' })
  netProfit: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: '0' })
  titheAmount: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: '0' })
  offeringAmount: string;

  @Column({ default: false })
  isTithed: boolean;

  @Column({ default: false })
  isOffered: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => FinishedProduct, (product) => product.closure)
  finishedProducts: FinishedProduct[];

  @OneToMany(() => ExtraExpense, (expense) => expense.closure)
  extraExpenses: ExtraExpense[];

  @OneToMany(() => InventoryBatch, (batch) => batch.closure)
  inventoryBatches: InventoryBatch[];
}
