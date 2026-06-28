// src/stores/entities/store.entity.ts
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { InventoryBatch } from '../../supplies/entities/inventory-batch.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  instagramUrl: string; // Ejemplo: https://instagram.com/reposterialamejor

  @Column({ nullable: true })
  mapsUrl: string; // Para ubicación física

  @OneToMany(() => InventoryBatch, (batch) => batch.store)
  batches: InventoryBatch[];

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
}