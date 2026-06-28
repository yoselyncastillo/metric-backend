import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { InventoryBatch } from './inventory-batch.entity';
import { UnitConversion } from './unit-conversion.entity';
import { User } from '../../auth/entities/user.entity';

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

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
