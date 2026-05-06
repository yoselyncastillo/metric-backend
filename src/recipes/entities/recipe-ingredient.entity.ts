import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Supply } from '../../supplies/entities/supply.entity';
import { Recipe } from './recipe.entity';

@Entity('recipe_ingredients')
export class RecipeIngredient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 14, scale: 4 })
  quantity: string;

  @Column({ length: 32 })
  unit: string;

  @ManyToOne(() => Recipe, (recipe) => recipe.ingredients, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recipeId' })
  recipe: Recipe;

  @ManyToOne(() => Supply, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplyId' })
  supply: Supply;
}
