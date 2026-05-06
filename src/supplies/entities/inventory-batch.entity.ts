import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Supply } from './supply.entity';
import { Store } from '../../stores/entities/store.entity';

@Entity('inventory_batches')
export class InventoryBatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 14, scale: 4 })
  initialQuantity: string;

  @Column('decimal', { precision: 14, scale: 4 })
  remainingQuantity: string;

  @Column('decimal', { precision: 14, scale: 4 })
  costPerUnit: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Supply, (supply) => supply.batches, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'supplyId' })
  supply: Supply;

  @ManyToOne(() => Store, (store) => store.batches, {
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'storeId' })
  store: Store;
}
