import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { InventoryBatch } from './inventory-batch.entity';
import { UnitConversion } from './unit-conversion.entity';

@Entity('supplies')
export class Supply {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ length: 32 })
  unit: string;

  @OneToMany(() => InventoryBatch, (batch) => batch.supply)
  batches: InventoryBatch[];

  @OneToMany(() => UnitConversion, (uc) => uc.supply, { eager: true })
  unitConversions: UnitConversion[];
}
