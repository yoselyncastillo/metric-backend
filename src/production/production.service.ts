import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductionDto } from './dto/create-production.dto';
import { UpdateProductionDto } from './dto/update-production.dto';
import { RecipesService } from 'src/recipes/recipes.service';
import { SuppliesService } from 'src/supplies/supplies.service';
import { DataSource } from 'typeorm';
import { FinishedProduct } from './entities/finished-product.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class ProductionService {
  constructor(
    private dataSource: DataSource,
    private readonly recipesService: RecipesService,
    private readonly suppliesService: SuppliesService,
  ) { }

  async executeProduction(recipeId: number, quantityToProduce: number, user: User, realQuantity?: number) {
    return await this.dataSource.transaction(async (manager) => {
      const recipe = await this.recipesService.findOne(recipeId, user);
      if (!recipe) throw new NotFoundException(`Receta #${recipeId} no encontrada`);
      // El "Factor de Escala" (Ej: Si quiero 6 y la receta es de 12, el factor es 0.5)
      const scaleFactor = quantityToProduce / recipe.portions; 

      const finalQuantityForStock = realQuantity || quantityToProduce;

      let totalFifoCost = 0;
      let totalReplacementCost = 0;
      let totalAverageCost = 0;

      // 1. Descontar ingredientes y sumar costos
      for (const ingredient of recipe.ingredients) {
        const proportionalQuantity = Number(ingredient.quantity) * scaleFactor;

        // Accedemos a ingredient.supply.id y convertimos la cantidad a número
        const pricing = await this.suppliesService.decreaseStock(
          ingredient.supply.id,
          proportionalQuantity,
          ingredient.unit,
          manager,
          user
        );

        totalFifoCost += pricing.fifoCost;
        totalReplacementCost += pricing.replacementCost;
        totalAverageCost += pricing.averageCost;
      }

      // 2. Actualizar o crear Producto Terminado
      let finishedProduct = await manager.findOne(FinishedProduct, {
        where: { recipe: { id: recipeId }, user: { id: user.id } }
      });

      if (finishedProduct) {
        // --- ACTUALIZACIÓN (Ya existe en vitrina) ---
        const currentQty = parseFloat(finishedProduct.quantity);
        const newQty = currentQty + finalQuantityForStock;

        // Actualizamos cantidades
        finishedProduct.quantity = newQty.toString();

        // Para el FIFO y Average: Sumamos el valor anterior con el nuevo
        // (Esto mantiene el valor total del inventario correcto)
        finishedProduct.fifoCost = (parseFloat(finishedProduct.fifoCost) + totalFifoCost).toString();
        finishedProduct.averageCost = (parseFloat(finishedProduct.averageCost) + totalAverageCost).toString();

        // Para el Reposición: Obtenemos el costo UNITARIO de reposición más reciente
        // y lo multiplicamos por la NUEVA cantidad total en vitrina.
        // Así toda tu vitrina se valora al precio de reposición de HOY.
        if (finalQuantityForStock > 0) {
          const unitReplacementCost = totalReplacementCost / finalQuantityForStock;
          finishedProduct.replacementCost = (unitReplacementCost * newQty).toString();
        }

      } else {
        // --- CREACIÓN (Es la primera vez que lo haces) ---
        finishedProduct = manager.create(FinishedProduct, {
          recipe,
          quantity: finalQuantityForStock.toString(),
          fifoCost: totalFifoCost.toString(),
          replacementCost: totalReplacementCost.toString(),
          averageCost: totalAverageCost.toString(),
          user
        });
      }

      return await manager.save(finishedProduct);
    });
  }

  async findAllFinished(user: User) {
    return await this.dataSource.getRepository(FinishedProduct).find({
      where: { user: { id: user.id } },
      relations: ['recipe'],
    });
  }

  create(createProductionDto: CreateProductionDto, user: User) {
    return 'This action adds a new production';
  }

  findAll(user: User) {
    return `This action returns all production`;
  }

  findOne(id: number, user: User) {
    return `This action returns a #${id} production`;
  }

  update(id: number, updateProductionDto: UpdateProductionDto, user: User) {
    return `This action updates a #${id} production`;
  }

  remove(id: number, user: User) {
    return `This action removes a #${id} production`;
  }
}
