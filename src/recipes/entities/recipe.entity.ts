import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RecipeIngredient } from './recipe-ingredient.entity';

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

  @OneToMany(() => RecipeIngredient, (ingredient) => ingredient.recipe, {
    cascade: ['insert', 'update'],
  })
  ingredients: RecipeIngredient[];
}
