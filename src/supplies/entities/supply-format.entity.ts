import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { Supply } from './supply.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('supply_formats')
export class SupplyFormat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 4 })
  quantity: string;

  @ManyToOne(() => Supply, (supply) => supply.unitConversions) 
  supply: Supply;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
}