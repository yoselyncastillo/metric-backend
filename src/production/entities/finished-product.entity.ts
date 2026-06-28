import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Recipe } from '../../recipes/entities/recipe.entity';
import { User } from '../../auth/entities/user.entity';

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

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
}