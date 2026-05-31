import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, UpdateDateColumn } from 'typeorm';
import { Recipe } from '../../recipes/entities/recipe.entity';

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
}