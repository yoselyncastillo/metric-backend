// src/stores/entities/store.entity.ts
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { InventoryBatch } from '../../supplies/entities/inventory-batch.entity';

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
}