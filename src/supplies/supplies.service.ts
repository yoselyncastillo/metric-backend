import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, MoreThan, Repository } from 'typeorm';
import { CreateBatchDto } from './dto/create-batch.dto';
import { CreateSupplyDto } from './dto/create-supply.dto';
import { CreateUnitConversionDto } from './dto/create-unit-conversion.dto';
import { UpdateSupplyDto } from './dto/update-supply.dto';
import { UpdateUnitConversionDto } from './dto/update-unit-conversion.dto';
import { InventoryBatch } from './entities/inventory-batch.entity';
import { Supply } from './entities/supply.entity';
import { UnitConversion } from './entities/unit-conversion.entity';
import { StoresService } from 'src/stores/stores.service';
import { Store } from 'src/stores/entities/store.entity';
import { SupplyFormat } from './entities/supply-format.entity';
import { CreateSupplyFormatDto } from './dto/create-supply-format.dto';
import { User } from '../auth/entities/user.entity';

export type SupplyWithTotalAvailable = Supply & { totalAvailable: number };

export type ConsumptionResult = {
  totalCost: number;
  consumedQuantity: number;
  insufficientStock: boolean;
};

export type SupplyPricingResult = {
  fifoCost: number;
  replacementCost: number;
  averageCost: number;
  stockWarning: boolean;
};

@Injectable()
export class SuppliesService {
  constructor(
    @InjectRepository(Supply)
    private readonly suppliesRepository: Repository<Supply>,
    @InjectRepository(InventoryBatch)
    private readonly inventoryBatchesRepository: Repository<InventoryBatch>,
    @InjectRepository(UnitConversion)
    private readonly unitConversionsRepository: Repository<UnitConversion>,
    @InjectRepository(SupplyFormat)
    private readonly supplyFormatsRepository: Repository<SupplyFormat>,
    private readonly storesService: StoresService,
  ) { }

  async create(createSupplyDto: CreateSupplyDto, user: User): Promise<Supply> {
    const { name, unit, category, initialQuantity, totalPaid, storeId, createdAt } = createSupplyDto;
    const quantity = String(initialQuantity);

    let store: Store | undefined = undefined;
    if (storeId) {
      store = await this.storesService.findOne(storeId, user);
    }

    return this.suppliesRepository.manager.transaction(async (manager) => {
      const supply = manager.create(Supply, { name, unit, category, user });
      await manager.save(Supply, supply);

      if (initialQuantity && initialQuantity > 0) {
        const costToUse = totalPaid ?? 0;
        const calculatedCostPerUnit = costToUse / initialQuantity;

        const batch = manager.create(InventoryBatch, {
          supply,
          store,
          initialQuantity: quantity,
          remainingQuantity: quantity,
          costPerUnit: String(calculatedCostPerUnit),
          user,
          ...(createdAt ? { createdAt: new Date(createdAt) } : {})
        });
        await manager.save(InventoryBatch, batch);

        supply.batches = [batch];
      } else {
        supply.batches = [];
      }
      return supply;
    });
  }

  async findAll(user: User): Promise<SupplyWithTotalAvailable[]> {
    const supplies = await this.suppliesRepository.find({
      where: { user: { id: user.id } },
      order: { id: 'ASC' },
      relations: { batches: { store: true } },
    });
    return supplies.map((supply) => this.withTotalAvailable(supply));
  }

  async addBatch(
    supplyId: number,
    createBatchDto: CreateBatchDto,
    user: User
  ): Promise<InventoryBatch> {

    if (!createBatchDto.supplyFormatId && !createBatchDto.initialQuantity) {
      throw new BadRequestException('Debes proporcionar un formatId o una initialQuantity');
    }

    const supply = await this.suppliesRepository.findOne({
      where: { id: supplyId, user: { id: user.id } },
    });
    if (!supply) {
      throw new NotFoundException(`Supply #${supplyId} not found`);
    }

    let store: Store | undefined = undefined;
    if (createBatchDto.storeId) {
      store = await this.storesService.findOne(createBatchDto.storeId, user);
    }

    let finalQuantity = Number(createBatchDto.initialQuantity);

    if (createBatchDto.supplyFormatId) {
      const format = await this.supplyFormatsRepository.findOne({
        where: { id: createBatchDto.supplyFormatId, user: { id: user.id } },
      });
      if (!format) {
        throw new NotFoundException(`Format #${createBatchDto.supplyFormatId} not found`);
      }
      finalQuantity = Number(format.quantity);
    }

    const totalPaid = Number(createBatchDto.totalPaid);
    const costPerUnitBase = totalPaid / finalQuantity;

    const batch = this.inventoryBatchesRepository.create({
      supply,
      store,
      initialQuantity: String(finalQuantity),
      remainingQuantity: String(finalQuantity),
      costPerUnit: String(costPerUnitBase),
      user,
      ...(createBatchDto.createdAt ? { createdAt: new Date(createBatchDto.createdAt) } : {})
    });

    return await this.inventoryBatchesRepository.save(batch);
  }

  async addConversion(
    supplyId: number,
    dto: CreateUnitConversionDto,
    user: User
  ): Promise<UnitConversion> {
    const supply = await this.suppliesRepository.findOne({
      where: { id: supplyId, user: { id: user.id } },
    });
    if (!supply) {
      throw new NotFoundException(`Supply #${supplyId} not found`);
    }

    const conversion = this.unitConversionsRepository.create({
      name: dto.name,
      factor: String(dto.factor),
      supply,
      user
    });

    return this.unitConversionsRepository.save(conversion);
  }

  async updateConversion(
    conversionId: number,
    dto: UpdateUnitConversionDto,
    user: User
  ): Promise<UnitConversion> {
    const conversion = await this.unitConversionsRepository.findOne({
      where: { id: conversionId, user: { id: user.id } },
    });
    if (!conversion) {
      throw new NotFoundException(
        `Unit conversion #${conversionId} not found`,
      );
    }

    if (dto.name !== undefined) {
      conversion.name = dto.name;
    }
    if (dto.factor !== undefined) {
      conversion.factor = String(dto.factor);
    }

    return this.unitConversionsRepository.save(conversion);
  }

  async removeConversion(conversionId: number, user: User): Promise<void> {
    const conversion = await this.unitConversionsRepository.findOne({
      where: { id: conversionId, user: { id: user.id } },
    });
    if (!conversion) {
      throw new NotFoundException(
        `Unit conversion #${conversionId} not found`,
      );
    }
    const recipesUsingConversion =
      await this.findRecipeNamesUsingConversion(conversionId);
    if (recipesUsingConversion.length > 0) {
      throw new BadRequestException(
        `Cannot delete unit conversion #${conversionId} because it is used in recipes: ${recipesUsingConversion.join(
          ', ',
        )}`,
      );
    }
    await this.unitConversionsRepository.remove(conversion);
  }

  private async findRecipeNamesUsingConversion(
    conversionId: number,
  ): Promise<string[]> {
    const manager = this.unitConversionsRepository.manager;
    const tableExists = await manager.query(
      `SELECT to_regclass('public.recipe_ingredients') AS table_name`,
    );
    if (!tableExists?.[0]?.table_name) {
      return [];
    }

    const ingredientCols = await manager.query(
      `SELECT column_name
         FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'recipe_ingredients'`,
    );
    const ingredientColNames = new Set<string>(
      ingredientCols.map((row: { column_name: string }) => row.column_name),
    );
    const conversionCol = this.pickColumn(
      ingredientColNames,
      'unitConversionId',
      'unit_conversion_id',
      'conversionId',
      'conversion_id',
    );
    if (!conversionCol) {
      return [];
    }
    const recipeIdCol = this.pickColumn(
      ingredientColNames,
      'recipeId',
      'recipe_id',
    );

    if (!recipeIdCol) {
      const usedRows = await manager.query(
        `SELECT 1
           FROM recipe_ingredients ri
          WHERE ri."${conversionCol}" = $1
          LIMIT 1`,
        [conversionId],
      );
      return usedRows.length > 0 ? ['(unknown recipe)'] : [];
    }

    const recipesExists = await manager.query(
      `SELECT to_regclass('public.recipes') AS table_name`,
    );
    if (!recipesExists?.[0]?.table_name) {
      const ids = await manager.query(
        `SELECT DISTINCT ri."${recipeIdCol}"::text AS recipe_ref
           FROM recipe_ingredients ri
          WHERE ri."${conversionCol}" = $1`,
        [conversionId],
      );
      return ids.map((row: { recipe_ref: string }) => `Recipe #${row.recipe_ref}`);
    }

    const recipeCols = await manager.query(
      `SELECT column_name
         FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'recipes'`,
    );
    const recipeColNames = new Set<string>(
      recipeCols.map((row: { column_name: string }) => row.column_name),
    );
    const recipePkCol = this.pickColumn(recipeColNames, 'id');
    const recipeNameCol = this.pickColumn(recipeColNames, 'name', 'title');

    if (!recipePkCol || !recipeNameCol) {
      const ids = await manager.query(
        `SELECT DISTINCT ri."${recipeIdCol}"::text AS recipe_ref
           FROM recipe_ingredients ri
          WHERE ri."${conversionCol}" = $1`,
        [conversionId],
      );
      return ids.map((row: { recipe_ref: string }) => `Recipe #${row.recipe_ref}`);
    }

    const rows = await manager.query(
      `SELECT DISTINCT r."${recipeNameCol}"::text AS recipe_name
         FROM recipe_ingredients ri
         JOIN recipes r
           ON r."${recipePkCol}" = ri."${recipeIdCol}"
        WHERE ri."${conversionCol}" = $1`,
      [conversionId],
    );
    return rows.map((row: { recipe_name: string }) => row.recipe_name);
  }

  private pickColumn(candidates: Set<string>, ...names: string[]): string | null {
    for (const name of names) {
      if (candidates.has(name)) {
        return name;
      }
    }
    return null;
  }

  async findOne(id: number, user: User): Promise<SupplyWithTotalAvailable> {
    const supply = await this.suppliesRepository.findOne({
      where: { id, user: { id: user.id } },
      relations: { batches: { store: true }, unitConversions: true },
    });
    if (!supply) {
      throw new NotFoundException(`Supply #${id} not found`);
    }
    return this.withTotalAvailable(supply);
  }

  async getAmountInBaseUnit(
    supplyId: number,
    amount: number,
    unitName: string,
    user: User
  ): Promise<number> {
    if (amount < 0) {
      throw new BadRequestException('amount must be >= 0');
    }

    const normalizedUnitName = unitName.trim().toLowerCase();
    const supply = await this.suppliesRepository.findOne({
      where: { id: supplyId, user: { id: user.id } },
    });
    if (!supply) {
      throw new NotFoundException(`Supply #${supplyId} not found`);
    }

    if (normalizedUnitName === supply.unit.toLowerCase()) {
      return amount;
    }

    const conversion = (supply.unitConversions ?? []).find(
      (item) => item.name.trim().toLowerCase() === normalizedUnitName,
    );
    if (!conversion) {
      throw new BadRequestException(
        `Unit "${unitName}" is not configured for supply "${supply.name}"`,
      );
    }

    return amount * Number(conversion.factor);
  }

  private withTotalAvailable(supply: Supply): SupplyWithTotalAvailable {
    const batches = supply.batches ?? [];
    const totalAvailable = batches.reduce(
      (sum, batch) => sum + Number(batch.remainingQuantity),
      0,
    );
    return Object.assign(supply, { totalAvailable });
  }

  async processConsumption(
    supplyId: number,
    quantityToConsume: number,
    user: User,
    executeDiscount: boolean,
  ): Promise<ConsumptionResult> {
    if (quantityToConsume < 0) {
      throw new BadRequestException('quantityToConsume must be >= 0');
    }
    if (quantityToConsume === 0) {
      return { totalCost: 0, consumedQuantity: 0, insufficientStock: false };
    }

    const supplyRow = await this.suppliesRepository.findOne({
      where: { id: supplyId, user: { id: user.id } },
      select: { id: true },
    });
    if (!supplyRow) {
      throw new NotFoundException(`Supply #${supplyId} not found`);
    }

    if (executeDiscount) {
      return this.inventoryBatchesRepository.manager.transaction(
        async (manager) => {
          const batches = await this.loadPositiveBatchesForFifo(
            manager,
            supplyId,
            user,
            true,
          );
          const { touched, ...result } = this.fifoAllocate(
            batches,
            quantityToConsume,
          );
          for (const { batch, newRemainingStr } of touched) {
            batch.remainingQuantity = newRemainingStr;
          }
          if (touched.length > 0) {
            await manager.save(
              InventoryBatch,
              touched.map((t) => t.batch),
            );
          }
          return result;
        },
      );
    }

    const batches = await this.loadPositiveBatchesForFifo(
      this.inventoryBatchesRepository.manager,
      supplyId,
      user,
      false,
    );
    const { touched: _touched, ...result } = this.fifoAllocate(
      batches,
      quantityToConsume,
    );
    return result;
  }

  async getSupplyPricing(
    id: number,
    quantity: number,
    user: User,
    unitName?: string,
  ): Promise<SupplyPricingResult> {
    if (quantity < 0) {
      throw new BadRequestException('quantity must be >= 0');
    }
    const quantityInBaseUnit = unitName
      ? await this.getAmountInBaseUnit(id, quantity, unitName, user)
      : quantity;

    const supplyRow = await this.suppliesRepository.findOne({
      where: { id, user: { id: user.id } },
      select: { id: true },
    });
    if (!supplyRow) {
      throw new NotFoundException(`Supply #${id} not found`);
    }

    const batchesWithStock = await this.loadPositiveBatchesForFifo(
      this.inventoryBatchesRepository.manager,
      id,
      user,
      false,
    );

    const totalStock = batchesWithStock.reduce(
      (sum, batch) => sum + Number(batch.remainingQuantity),
      0,
    );
    const stockWarning = quantityInBaseUnit > totalStock;

    const { totalCost: fifoCost } = this.fifoAllocate(
      batchesWithStock,
      quantityInBaseUnit,
    );

    const latestBatch = await this.inventoryBatchesRepository
      .createQueryBuilder('batch')
      .where('batch.supplyId = :id', { id })
      .andWhere('batch.user_id = :userId', { userId: user.id })
      .orderBy('batch.createdAt', 'DESC')
      .getOne();

    const replacementCost = latestBatch
      ? quantityInBaseUnit * Number(latestBatch.costPerUnit)
      : 0;

    let averageCost = 0;
    if (totalStock > 0) {
      const inventoryValue = batchesWithStock.reduce(
        (sum, batch) =>
          sum +
          Number(batch.remainingQuantity) * Number(batch.costPerUnit),
        0,
      );
      const weightedAvgPerUnit = inventoryValue / totalStock;
      averageCost = weightedAvgPerUnit * quantityInBaseUnit;
    }

    return {
      fifoCost,
      replacementCost,
      averageCost,
      stockWarning,
    };
  }

  private async loadPositiveBatchesForFifo(
    manager: EntityManager,
    supplyId: number,
    user: User,
    forUpdate: boolean,
  ): Promise<InventoryBatch[]> {
    const qb = manager
      .createQueryBuilder(InventoryBatch, 'batch')
      .where('batch.supplyId = :supplyId', { supplyId })
      .andWhere('batch.user_id = :userId', { userId: user.id })
      .andWhere('"batch"."remainingQuantity"::numeric > 0')
      .orderBy('batch.createdAt', 'ASC');
    if (forUpdate) {
      qb.setLock('pessimistic_write');
    }
    return qb.getMany();
  }

  private fifoAllocate(
    batches: InventoryBatch[],
    quantityToConsume: number,
  ): ConsumptionResult & {
    touched: Array<{ batch: InventoryBatch; newRemainingStr: string }>;
  } {
    const totalStock = batches.reduce(
      (sum, batch) => sum + Number(batch.remainingQuantity),
      0,
    );

    let remainingNeed = quantityToConsume;
    let totalCost = 0;
    let consumedQuantity = 0;
    const touched: Array<{ batch: InventoryBatch; newRemainingStr: string }> =
      [];

    for (const batch of batches) {
      if (remainingNeed <= 0) {
        break;
      }
      const batchRem = Number(batch.remainingQuantity);
      if (batchRem <= 0) {
        continue;
      }
      const take = Math.min(batchRem, remainingNeed);
      totalCost += take * Number(batch.costPerUnit);
      consumedQuantity += take;
      remainingNeed -= take;
      touched.push({
        batch,
        newRemainingStr: (batchRem - take).toFixed(4),
      });
    }

    return {
      totalCost,
      consumedQuantity,
      insufficientStock: quantityToConsume > totalStock,
      touched,
    };
  }

  async update(id: number, updateSupplyDto: UpdateSupplyDto, user: User) {
    const supply = await this.findOne(id, user);
    this.suppliesRepository.merge(supply, updateSupplyDto);
    return this.suppliesRepository.save(supply);
  }

  async remove(id: number, user: User) {
    const supply = await this.findOne(id, user);
    try {
      await this.suppliesRepository.remove(supply);
    } catch (error: any) {
      if (error.code === '23503') {
        throw new BadRequestException(
          'No se puede eliminar el insumo porque está siendo utilizado en una o más recetas. Por favor, elimínelo de las recetas primero.',
        );
      }
      throw error;
    }
  }

  async decreaseStock(
    supplyId: number,
    amount: number,
    unit: string,
    manager: EntityManager,
    user: User
  ): Promise<SupplyPricingResult> {
    const quantityInBaseUnit = await this.getAmountInBaseUnit(supplyId, amount, unit, user);
  
    const batches = await this.loadPositiveBatchesForFifo(manager, supplyId, user, true);
  
    const { totalCost: fifoCost, insufficientStock, touched } = this.fifoAllocate(
      batches,
      quantityInBaseUnit,
    );
  
    if (insufficientStock) {
      throw new BadRequestException(`Stock insuficiente para el insumo ID ${supplyId}`);
    }
  
    for (const { batch, newRemainingStr } of touched) {
      batch.remainingQuantity = newRemainingStr;
    }
    if (touched.length > 0) {
      await manager.save(InventoryBatch, touched.map((t) => t.batch));
    }
  
    const pricing = await this.getSupplyPricing(supplyId, quantityInBaseUnit, user);
  
    return pricing;
  }

  async createFormat(dto: CreateSupplyFormatDto, user: User) {
    const supply = await this.suppliesRepository.findOne({
      where: { id: dto.supplyId, user: { id: user.id } }
    });

    if (!supply) {
      throw new NotFoundException(`Supply #${dto.supplyId} not found`);
    }

    const format = this.supplyFormatsRepository.create({
      name: dto.name,
      quantity: String(dto.quantity),
      supply: supply,
      user
    });

    return await this.supplyFormatsRepository.save(format);
  }

  async updateBatch(
    id: number,
    updateDto: { quantity?: number; remainingQuantity?: number; price?: number },
    user: User
  ): Promise<InventoryBatch> {
    const batch = await this.inventoryBatchesRepository.findOne({
      where: { id, user: { id: user.id } },
      relations: ['supply']
    });
    if (!batch) throw new NotFoundException(`Batch #${id} not found`);

    if (updateDto.quantity !== undefined) {
      batch.initialQuantity = String(updateDto.quantity);
    }
    if (updateDto.remainingQuantity !== undefined) {
      batch.remainingQuantity = String(updateDto.remainingQuantity);
    }
    if (updateDto.price !== undefined) {
      batch.costPerUnit = String(updateDto.price);
    }

    return await this.inventoryBatchesRepository.save(batch);
  }

  async removeBatch(id: number, user: User): Promise<void> {
    const batch = await this.inventoryBatchesRepository.findOne({
      where: { id, user: { id: user.id } }
    });
    if (!batch) throw new NotFoundException(`Batch #${id} not found`);
    await this.inventoryBatchesRepository.remove(batch);
  }
}

