import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { SuppliesService } from '../supplies/supplies.service';
import { CreateRecipeDto, CreateRecipeIngredientDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { Recipe } from './entities/recipe.entity';
import { Supply } from '../supplies/entities/supply.entity';

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
  private async findRecipeWithRelations(id: number): Promise<Recipe> {
    const recipe = await this.recipesRepository
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.ingredients', 'ingredient')
      .leftJoinAndSelect('ingredient.supply', 'supply')
      .where('recipe.id = :id', { id })
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

  async create(createRecipeDto: CreateRecipeDto) {
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
      });
      await manager.save(Recipe, recipe);

      const uniqueSupplyIds = [...new Set(ingredientList.map((i) => i.supplyId))];
      const supplies = uniqueSupplyIds.length
        ? await manager.findBy(Supply, { id: In(uniqueSupplyIds) })
        : [];
      const supplyById = new Map(supplies.map((supply) => [supply.id, supply]));
      const missingSupplyIds = uniqueSupplyIds.filter((id) => !supplyById.has(id));
      if (missingSupplyIds.length > 0) {
        throw new BadRequestException(
          `The following supplies do not exist: ${missingSupplyIds.join(', ')}`,
        );
      }

      const ingredientsToSave = ingredientList.map((ingredientDto) =>
        this.buildRecipeIngredient(recipe, ingredientDto, supplyById),
      );
      if (ingredientsToSave.length > 0) {
        await manager.save(RecipeIngredient, ingredientsToSave);
      }

      const createdRecipe = await manager.findOne(Recipe, {
        where: { id: recipe.id },
        relations: { ingredients: { supply: true } },
      });
      if (!createdRecipe) {
        throw new NotFoundException(`Recipe #${recipe.id} not found`);
      }
      return createdRecipe;
    });
  }

  findAll() {
    return this.recipesRepository
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.ingredients', 'ingredient')
      .leftJoinAndSelect('ingredient.supply', 'supply')
      .orderBy('recipe.id', 'ASC')
      .addOrderBy('ingredient.id', 'ASC')
      .getMany();
  }

  async findOne(id: number) {
    const recipe = await this.findRecipeWithRelations(id);

    let totalFifoCost = 0;
    let totalReplacementCost = 0;
    let totalAverageCost = 0;

    for (const item of recipe.ingredients ?? []) {
      const pricing = await this.suppliesService.getSupplyPricing(
        item.supply.id,
        Number(item.quantity),
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
  ): Promise<PreviewCostsResult> {
    const ingredientList = ingredients ?? [];
    const items = await Promise.all(
      ingredientList.map(async (item) => {
        const pricing = await this.suppliesService.getSupplyPricing(
          item.supplyId,
          item.quantity,
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

  async update(id: number, updateRecipeDto: UpdateRecipeDto) {
    const recipe = await this.findRecipeWithRelations(id);
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

  async remove(id: number) {
    const recipe = await this.findRecipeWithRelations(id);
    await this.recipesRepository.remove(recipe);
  }

  get pricingEngine(): SuppliesService {
    return this.suppliesService;
  }

  private buildRecipeIngredient(
    recipe: Recipe,
    ingredientDto: CreateRecipeIngredientDto,
    supplyById: Map<number, Supply>,
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
    });
  }

  async produce(id: number, desiredPortions: number) {
    return await this.dataSource.transaction(async (manager) => {
      const recipe = await manager.findOne(Recipe, {
        where: { id },
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
          manager
        );
      }

      return { 
        message: `Production of ${desiredPortions} portions of "${recipe.name}" completed successfully.` 
      };
    });
  }
}
