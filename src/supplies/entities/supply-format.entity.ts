import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Supply } from './supply.entity';

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
}