import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Supply } from './supply.entity';
import { User } from '../../auth/entities/user.entity';

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

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
