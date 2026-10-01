import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, UpdateDateColumn, CreateDateColumn, JoinColumn } from 'typeorm';
import { Recipe } from '../../recipes/entities/recipe.entity';
import { User } from '../../auth/entities/user.entity';
import { CashClosure } from '../../closures/entities/cash-closure.entity';

export enum ProductLocation {
  CASA = 'CASA',
  LOCAL = 'LOCAL',
  VENDIDO = 'VENDIDO',
  MERMA = 'MERMA'
}
@Entity()
export class FinishedProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Recipe)
  recipe: Recipe;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: '0' })
  quantity: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: '0' })
  totalProductionCost: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: '0' })
  fifoCost: string; // El costo real de los lotes usados

  @Column({ type: 'decimal', precision: 10, scale: 2, default: '0' })
  averageCost: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: '0' })
  replacementCost: string; // Basado en el último precio de compra registrado

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  movedToLocalAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  soldAt: Date;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: ProductLocation, default: ProductLocation.CASA })
  location: ProductLocation;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: '0' })
  price: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: '0' })
  amountPaid: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: '0' })
  amountPending: string;

  @ManyToOne(() => CashClosure, (closure) => closure.finishedProducts, { nullable: true })
  @JoinColumn({ name: 'closure_id' })
  closure: CashClosure;
}