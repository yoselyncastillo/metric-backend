// src/seed/seed.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

// Entities
import { User } from '../auth/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { Supply } from '../supplies/entities/supply.entity';
import { SupplyFormat } from '../supplies/entities/supply-format.entity';
import { UnitConversion } from '../supplies/entities/unit-conversion.entity';
import { InventoryBatch } from '../supplies/entities/inventory-batch.entity';
import { Recipe } from '../recipes/entities/recipe.entity';
import { RecipeIngredient } from '../recipes/entities/recipe-ingredient.entity';
import { FinishedProduct } from '../production/entities/finished-product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { ExtraExpense, ExpenseCategory } from '../accounting/entities/extra-expense.entity';

// Services
import { StoresService } from '../stores/stores.service';
import { SuppliesService } from '../supplies/supplies.service';
import { RecipesService } from '../recipes/recipes.service';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly storesService: StoresService,
    private readonly suppliesService: SuppliesService,
    private readonly recipesService: RecipesService,
  ) {}

  async runSeed() {
    this.logger.log('Starting seed process...');
    const manager = this.dataSource.manager;

    this.logger.log('Clearing database...');
    // 1. Limpiar todas las tablas en orden inverso a sus dependencias
    await manager.createQueryBuilder().delete().from(ExtraExpense).execute();
    await manager.createQueryBuilder().delete().from(Customer).execute();
    await manager.createQueryBuilder().delete().from(FinishedProduct).execute();
    await manager.createQueryBuilder().delete().from(RecipeIngredient).execute();
    await manager.createQueryBuilder().delete().from(Recipe).execute();
    await manager.createQueryBuilder().delete().from(InventoryBatch).execute();
    await manager.createQueryBuilder().delete().from(UnitConversion).execute();
    await manager.createQueryBuilder().delete().from(SupplyFormat).execute();
    await manager.createQueryBuilder().delete().from(Supply).execute();
    await manager.createQueryBuilder().delete().from(Store).execute();
    await manager.createQueryBuilder().delete().from(User).execute();

    // 2. Crear Usuarios (Yoselyn y Invitado)
    this.logger.log('Creating users...');
    const user1 = manager.create(User, {
      email: 'yoselyn@metric.com',
      password: bcrypt.hashSync('Password123!', 10),
      name: 'Yoselyn Castillo',
      isActive: true,
    });
    const user2 = manager.create(User, {
      email: 'invitado@metric.com',
      password: bcrypt.hashSync('Password123!', 10),
      name: 'Repostera Invitada',
      isActive: true,
    });
    await manager.save([user1, user2]);

    // 3. Poblar datos para cada usuario
    this.logger.log('Populating data for User 1 (Yoselyn)...');
    await this.seedUser(user1);

    this.logger.log('Populating data for User 2 (Invitado)...');
    await this.seedUser(user2);

    return {
      success: true,
      message: 'Database completely populated with multi-user sample data across all tables'
    };
  }

  private async seedUser(user: User) {
    const manager = this.dataSource.manager;

    // a) Tiendas (Store)
    const storesData = [
      { name: 'Distribuidora Táchira', address: 'San Cristóbal', instagramUrl: 'https://instagram.com/dist_tachira', user },
      { name: 'Mundo Repostería', address: 'Barrio Obrero', instagramUrl: 'https://instagram.com/mundo_reposteria', user },
      { name: 'Supermercado Garzón', address: 'Pueblo Nuevo', instagramUrl: 'https://instagram.com/garzon_super', user },
    ];
    const stores = await manager.save(Store, storesData);

    // b) Insumos y c) Lotes FIFO
    // Harina
    const harina = await this.suppliesService.create({
      name: 'Harina de Trigo', unit: 'g', initialQuantity: 1000, totalPaid: 10
    }, user);
    await this.suppliesService.addBatch(harina.id, {
      initialQuantity: 2000, totalPaid: 25, storeId: stores[0].id
    }, user);
    await this.suppliesService.addBatch(harina.id, {
      initialQuantity: 500, totalPaid: 8, storeId: stores[1].id
    }, user);

    // Azúcar
    const azucar = await this.suppliesService.create({
      name: 'Azúcar Blanca', unit: 'g', initialQuantity: 1000, totalPaid: 8
    }, user);
    await this.suppliesService.addBatch(azucar.id, {
      initialQuantity: 5000, totalPaid: 35, storeId: stores[0].id
    }, user);
    await this.suppliesService.addBatch(azucar.id, {
      initialQuantity: 1000, totalPaid: 9, storeId: stores[2].id
    }, user);

    // Huevos
    const huevos = await this.suppliesService.create({
      name: 'Huevos', unit: 'und', initialQuantity: 12, totalPaid: 2
    }, user);
    await this.suppliesService.addBatch(huevos.id, {
      initialQuantity: 30, totalPaid: 4.5, storeId: stores[1].id
    }, user);

    // Mantequilla
    const mantequilla = await this.suppliesService.create({
      name: 'Mantequilla', unit: 'g', initialQuantity: 500, totalPaid: 5
    }, user);
    await this.suppliesService.addBatch(mantequilla.id, {
      initialQuantity: 1000, totalPaid: 11, storeId: stores[2].id
    }, user);

    // Envases
    const envases = await this.suppliesService.create({
      name: 'Cajas de Empaque', unit: 'und', initialQuantity: 50, totalPaid: 10
    }, user);
    await this.suppliesService.addBatch(envases.id, {
      initialQuantity: 100, totalPaid: 18, storeId: stores[2].id
    }, user);

    // d) Recetas e Ingredientes
    const isYoselyn = user.email === 'yoselyn@metric.com';

    const recipe1Data = isYoselyn 
      ? { name: 'Cupcakes de Vainilla', desc: 'Deliciosos cupcakes', portions: 12 }
      : { name: 'Galletas de Chispas', desc: 'Crujientes galletas', portions: 24 };

    const recipe2Data = isYoselyn
      ? { name: 'Ponqué de Auyama', desc: 'Tradicional ponqué', portions: 10 }
      : { name: 'Torta Marmoleada', desc: 'Mezcla de vainilla y chocolate', portions: 8 };

    await this.recipesService.create({
      name: recipe1Data.name,
      description: recipe1Data.desc,
      portions: recipe1Data.portions,
      profitMargin: 2.0,
      ingredients: [
        { supplyId: harina.id, quantity: 200, unit: 'g' },
        { supplyId: azucar.id, quantity: 100, unit: 'g' },
        { supplyId: huevos.id, quantity: 2, unit: 'und' },
        { supplyId: mantequilla.id, quantity: 100, unit: 'g' },
        { supplyId: envases.id, quantity: 12, unit: 'und' },
      ]
    }, user);

    await this.recipesService.create({
      name: recipe2Data.name,
      description: recipe2Data.desc,
      portions: recipe2Data.portions,
      profitMargin: 2.5,
      ingredients: [
        { supplyId: harina.id, quantity: 500, unit: 'g' },
        { supplyId: azucar.id, quantity: 300, unit: 'g' },
        { supplyId: huevos.id, quantity: 4, unit: 'und' },
        { supplyId: mantequilla.id, quantity: 200, unit: 'g' },
        { supplyId: envases.id, quantity: 1, unit: 'und' },
      ]
    }, user);

    // e) Productos Terminados
    const fp1 = manager.create(FinishedProduct, {
      name: isYoselyn ? 'Cupcakes de Vainilla (Caja x6)' : 'Galletas de Chispas (Docena)',
      quantity: '5',
      fifoCost: '15.50',
      replacementCost: '16.00',
      averageCost: '15.75',
      user
    });
    const fp2 = manager.create(FinishedProduct, {
      name: isYoselyn ? 'Porción Ponqué de Auyama' : 'Porción Torta Marmoleada',
      quantity: '10',
      fifoCost: '2.50',
      replacementCost: '2.80',
      averageCost: '2.60',
      user
    });
    await manager.save([fp1, fp2]);

    // f) Clientes
    const customers = [
      manager.create(Customer, { name: isYoselyn ? 'María Gómez' : 'Cliente Frecuente 1', phone: '0414-1234567', isFrequent: true, user }),
      manager.create(Customer, { name: isYoselyn ? 'Carlos Ruiz' : 'Cliente Ocasional', phone: '0412-7654321', isFrequent: false, user }),
      manager.create(Customer, { name: isYoselyn ? 'Panadería El Trigo' : 'Tienda Asociada', phone: '0424-9998888', isFrequent: true, user }),
    ];
    await manager.save(customers);

    // g) Gastos Extra
    const expenses = [
      manager.create(ExtraExpense, { 
        description: 'Cajas extra para envíos', amount: '20.00', category: ExpenseCategory.PACKAGING, date: new Date(), user 
      }),
      manager.create(ExtraExpense, { 
        description: 'Gasolina para entregas', amount: '10.00', category: ExpenseCategory.TRANSPORT, date: new Date(), user 
      }),
      manager.create(ExtraExpense, { 
        description: 'Recarga de Gas', amount: '5.00', category: ExpenseCategory.UTILITIES, date: new Date(), user 
      }),
      manager.create(ExtraExpense, { 
        description: 'Publicidad en Instagram', amount: '15.00', category: ExpenseCategory.MARKETING, date: new Date(), user 
      }),
    ];
    await manager.save(expenses);
  }
}