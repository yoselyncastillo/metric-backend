import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Supply } from './supply.entity';

@Entity('unit_conversions')
export class UnitConversion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('decimal', { precision: 14, scale: 4 })
  factor: string;

  @ManyToOne(() => Supply, (supply) => supply.unitConversions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'supplyId' })
  supply: Supply;
}
