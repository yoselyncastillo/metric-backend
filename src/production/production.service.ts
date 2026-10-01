import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateProductionDto } from './dto/create-production.dto';
import { UpdateProductionDto } from './dto/update-production.dto';
import { RecipesService } from 'src/recipes/recipes.service';
import { SuppliesService } from 'src/supplies/supplies.service';
import { DataSource } from 'typeorm';
import { FinishedProduct, ProductLocation } from './entities/finished-product.entity';
import { InventoryBatch } from '../supplies/entities/inventory-batch.entity';
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

      // 2. Evaluar si es receta intermedia o final
      if (recipe.isIntermediate) {
        if (!recipe.associatedSupply) {
          throw new NotFoundException(`La receta intermedia no tiene un insumo asociado configurado`);
        }

        const costPerUnit = finalQuantityForStock > 0 ? (totalFifoCost / finalQuantityForStock) : 0;

        const batch = manager.create(InventoryBatch, {
          supply: recipe.associatedSupply,
          initialQuantity: finalQuantityForStock.toString(),
          remainingQuantity: finalQuantityForStock.toString(),
          costPerUnit: costPerUnit.toString(),
          user
        });

        return await manager.save(batch);
      }

      // --- RECETA FINAL ---
      // Actualizar o crear Producto Terminado
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

  async update(id: number, updateProductionDto: any, user: User) {
    const repository = this.dataSource.getRepository(FinishedProduct);
    const finishedProduct = await repository.findOne({
      where: { id, user: { id: user.id } },
      relations: ['recipe', 'user', 'closure']
    });

    if (!finishedProduct) {
      throw new NotFoundException(`Producto terminado #${id} no encontrado`);
    }

    const currentQty = parseFloat(finishedProduct.quantity);
    const moveQty = updateProductionDto.quantity !== undefined ? parseFloat(updateProductionDto.quantity) : currentQty;

    if (moveQty <= 0 || moveQty > currentQty) {
      throw new BadRequestException('Cantidad a mover inválida');
    }

    if (moveQty < currentQty) {
      // Split record
      const ratio = moveQty / currentQty;

      // Update current record (deduct)
      finishedProduct.quantity = (currentQty - moveQty).toString();
      const currentTotalCost = parseFloat(finishedProduct.totalProductionCost);
      const currentFifoCost = parseFloat(finishedProduct.fifoCost);
      finishedProduct.totalProductionCost = (currentTotalCost * (1 - ratio)).toFixed(2);
      finishedProduct.fifoCost = (currentFifoCost * (1 - ratio)).toFixed(2);
      await repository.save(finishedProduct);

      // Create new record for the moved quantity
      const newLocation = updateProductionDto.location !== undefined ? updateProductionDto.location : finishedProduct.location;

      const movedProduct = repository.create({
        ...finishedProduct,
        id: undefined, // ensure new id
        quantity: moveQty.toString(),
        totalProductionCost: (currentTotalCost * ratio).toFixed(2),
        fifoCost: (currentFifoCost * ratio).toFixed(2),
        location: newLocation,
        price: updateProductionDto.price !== undefined ? updateProductionDto.price.toString() : finishedProduct.price,
        amountPaid: updateProductionDto.amountPaid !== undefined ? updateProductionDto.amountPaid.toString() : '0',
        amountPending: updateProductionDto.amountPending !== undefined ? updateProductionDto.amountPending.toString() : '0',
        closure: undefined, // new product shouldn't be attached to an old closure automatically unless specified
        movedToLocalAt: newLocation === ProductLocation.LOCAL ? new Date() : (newLocation === finishedProduct.location ? finishedProduct.movedToLocalAt : undefined),
        soldAt: newLocation === ProductLocation.VENDIDO ? new Date() : (newLocation === finishedProduct.location ? finishedProduct.soldAt : undefined),
      });

      return await repository.save(movedProduct);
    } else {
      // Full move, update existing record
      if (updateProductionDto.location !== undefined && updateProductionDto.location !== finishedProduct.location) {
        finishedProduct.location = updateProductionDto.location;
        if (finishedProduct.location === ProductLocation.LOCAL) {
          finishedProduct.movedToLocalAt = new Date();
        } else if (finishedProduct.location === ProductLocation.VENDIDO) {
          finishedProduct.soldAt = new Date();
        }
      }
      if (updateProductionDto.price !== undefined) {
        finishedProduct.price = updateProductionDto.price.toString();
      }
      if (updateProductionDto.amountPaid !== undefined) {
        finishedProduct.amountPaid = updateProductionDto.amountPaid.toString();
      }
      if (updateProductionDto.amountPending !== undefined) {
        finishedProduct.amountPending = updateProductionDto.amountPending.toString();
      }
      return await repository.save(finishedProduct);
    }
  }

  async remove(id: number, user: User) {
    const repository = this.dataSource.getRepository(FinishedProduct);
    const finishedProduct = await repository.findOne({
      where: { id, user: { id: user.id } }
    });
    
    if (!finishedProduct) {
      throw new NotFoundException(`Producto terminado #${id} no encontrado`);
    }

    await repository.remove(finishedProduct);
    return { message: `Producto terminado #${id} eliminado correctamente` };
  }
}
