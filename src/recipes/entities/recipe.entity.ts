import { Column, Entity, OneToMany, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Supply } from '../../supplies/entities/supply.entity';
import { RecipeIngredient } from './recipe-ingredient.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('recipes')
export class Recipe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: 1 })
  portions: number;

  @Column('decimal', { precision: 10, scale: 4, default: '1.4' })
  profitMargin: string;

  @Column({ default: false })
  isIntermediate: boolean;

  @Column({ nullable: true })
  category: string;

  @ManyToOne(() => Supply, { nullable: true })
  @JoinColumn({ name: 'associated_supply_id' })
  associatedSupply: Supply;

  @OneToMany(() => RecipeIngredient, (ingredient) => ingredient.recipe, {
    cascade: ['insert', 'update'],
  })
  ingredients: RecipeIngredient[];

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
