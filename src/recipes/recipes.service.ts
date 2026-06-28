import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { SuppliesService } from '../supplies/supplies.service';
import { CreateRecipeDto, CreateRecipeIngredientDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { Recipe } from './entities/recipe.entity';
import { Supply } from '../supplies/entities/supply.entity';
import { User } from '../auth/entities/user.entity';

export type PreviewIngredientCost = CreateRecipeIngredientDto & {
  fifoCost: number;
  replacementCost: number;
  averageCost: number;
  stockWarning: boolean;
};

export type PreviewCostsResult = {
  items: PreviewIngredientCost[];
  totals: {
    totalFifoCost: number;
    totalReplacementCost: number;
    totalAverageCost: number;
  };
};

@Injectable()
export class RecipesService {
  private async findRecipeWithRelations(id: number, user: User): Promise<Recipe> {
    const recipe = await this.recipesRepository
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.ingredients', 'ingredient')
      .leftJoinAndSelect('ingredient.supply', 'supply')
      .where('recipe.id = :id', { id })
      .andWhere('recipe.user_id = :userId', { userId: user.id })
      .getOne();
    if (!recipe) {
      throw new NotFoundException(`Recipe #${id} not found`);
    }
    return recipe;
  }

  constructor(
    @InjectRepository(Recipe)
    private readonly recipesRepository: Repository<Recipe>,
    @InjectRepository(RecipeIngredient)
    private readonly recipeIngredientsRepository: Repository<RecipeIngredient>,
    private readonly suppliesService: SuppliesService,
    private readonly dataSource: DataSource
  ) {}

  async create(createRecipeDto: CreateRecipeDto, user: User) {
    const { ingredients, ...recipeData } = createRecipeDto;
    const ingredientList = ingredients ?? [];

    return this.recipesRepository.manager.transaction(async (manager) => {
      const recipe = manager.create(Recipe, {
        ...recipeData,
        portions: recipeData.portions ?? 1,
        profitMargin:
          recipeData.profitMargin !== undefined
            ? String(recipeData.profitMargin)
            : '1.4',
        user
      });
      await manager.save(Recipe, recipe);

      const uniqueSupplyIds = [...new Set(ingredientList.map((i) => i.supplyId))];
      const supplies = uniqueSupplyIds.length
        ? await manager.findBy(Supply, { id: In(uniqueSupplyIds), user: { id: user.id } })
        : [];
      const supplyById = new Map(supplies.map((supply) => [supply.id, supply]));
      const missingSupplyIds = uniqueSupplyIds.filter((id) => !supplyById.has(id));
      if (missingSupplyIds.length > 0) {
        throw new BadRequestException(
          `The following supplies do not exist: ${missingSupplyIds.join(', ')}`,
        );
      }

      const ingredientsToSave = ingredientList.map((ingredientDto) =>
        this.buildRecipeIngredient(recipe, ingredientDto, supplyById, user),
      );
      if (ingredientsToSave.length > 0) {
        await manager.save(RecipeIngredient, ingredientsToSave);
      }

      const createdRecipe = await manager.findOne(Recipe, {
        where: { id: recipe.id, user: { id: user.id } },
        relations: { ingredients: { supply: true } },
      });
      if (!createdRecipe) {
        throw new NotFoundException(`Recipe #${recipe.id} not found`);
      }
      return createdRecipe;
    });
  }

  findAll(user: User) {
    return this.recipesRepository
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.ingredients', 'ingredient')
      .leftJoinAndSelect('ingredient.supply', 'supply')
      .where('recipe.user_id = :userId', { userId: user.id })
      .orderBy('recipe.id', 'ASC')
      .addOrderBy('ingredient.id', 'ASC')
      .getMany();
  }

  async findOne(id: number, user: User) {
    const recipe = await this.findRecipeWithRelations(id, user);

    let totalFifoCost = 0;
    let totalReplacementCost = 0;
    let totalAverageCost = 0;

    for (const item of recipe.ingredients ?? []) {
      const pricing = await this.suppliesService.getSupplyPricing(
        item.supply.id,
        Number(item.quantity),
        user,
        item.unit,
      );
      totalFifoCost += pricing.fifoCost;
      totalReplacementCost += pricing.replacementCost;
      totalAverageCost += pricing.averageCost;
    }

    const suggestedPrice = totalReplacementCost * Number(recipe.profitMargin);

    return {
      ...recipe,
      costSummary: {
        totalFifoCost,
        totalReplacementCost,
        totalAverageCost,
        suggestedPrice,
      },
    };
  }

  async calculatePreviewCosts(
    ingredients: CreateRecipeIngredientDto[],
    user: User
  ): Promise<PreviewCostsResult> {
    const ingredientList = ingredients ?? [];
    const items = await Promise.all(
      ingredientList.map(async (item) => {
        const pricing = await this.suppliesService.getSupplyPricing(
          item.supplyId,
          item.quantity,
          user,
          item.unit,
        );
        return {
          ...item,
          fifoCost: pricing.fifoCost,
          replacementCost: pricing.replacementCost,
          averageCost: pricing.averageCost,
          stockWarning: pricing.stockWarning,
        };
      }),
    );

    const totals = items.reduce(
      (acc, item) => {
        acc.totalFifoCost += item.fifoCost;
        acc.totalReplacementCost += item.replacementCost;
        acc.totalAverageCost += item.averageCost;
        return acc;
      },
      {
        totalFifoCost: 0,
        totalReplacementCost: 0,
        totalAverageCost: 0,
      },
    );

    return { items, totals };
  }

  async update(id: number, updateRecipeDto: UpdateRecipeDto, user: User) {
    const recipe = await this.findRecipeWithRelations(id, user);
    const { ingredients: _ignoredIngredients, ...recipePatch } = updateRecipeDto;
    this.recipesRepository.merge(recipe, {
      ...recipePatch,
      profitMargin:
        recipePatch.profitMargin !== undefined
          ? String(recipePatch.profitMargin)
          : recipe.profitMargin,
    });
    return this.recipesRepository.save(recipe);
  }

  async remove(id: number, user: User) {
    const recipe = await this.findRecipeWithRelations(id, user);
    await this.recipesRepository.remove(recipe);
  }

  get pricingEngine(): SuppliesService {
    return this.suppliesService;
  }

  private buildRecipeIngredient(
    recipe: Recipe,
    ingredientDto: CreateRecipeIngredientDto,
    supplyById: Map<number, Supply>,
    user: User
  ): RecipeIngredient {
    const supply = supplyById.get(ingredientDto.supplyId);
    if (!supply) {
      throw new BadRequestException(
        `Supply #${ingredientDto.supplyId} does not exist`,
      );
    }
    return this.recipeIngredientsRepository.create({
      recipe,
      supply,
      quantity: String(ingredientDto.quantity),
      unit: ingredientDto.unit,
      user
    });
  }

  async produce(id: number, desiredPortions: number, user: User) {
    return await this.dataSource.transaction(async (manager) => {
      const recipe = await manager.findOne(Recipe, {
        where: { id, user: { id: user.id } },
        relations: { ingredients: { supply: true } }
      });

      if (!recipe) throw new NotFoundException(`Recipe #${id} not found`);

      const factor = desiredPortions / recipe.portions;

      for (const item of recipe.ingredients ?? []) {
        const neededAmount = Number(item.quantity) * factor;
        
        await this.suppliesService.decreaseStock(
          item.supply.id, 
          neededAmount, 
          item.unit, 
          manager,
          user
        );
      }

      return { 
        message: `Production of ${desiredPortions} portions of "${recipe.name}" completed successfully.` 
      };
    });
  }
}
