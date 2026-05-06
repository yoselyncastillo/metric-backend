import { Injectable } from '@nestjs/common';
import { RecipesService } from 'src/recipes/recipes.service';
import { StoresService } from 'src/stores/stores.service';
import { SuppliesService } from 'src/supplies/supplies.service';

@Injectable()
export class SeedService {
  constructor(
    private readonly storesService: StoresService,
    private readonly suppliesService: SuppliesService,
    private readonly recipesService: RecipesService,
  ) {}

  async runSeed() {
    // 1. Crear Tiendas
    const store = await this.storesService.create({
      name: 'Repostería La Mejor',
      address: 'La Concordia',
      instagramUrl: 'https://instagram.com/reposterialamejor'
    });

    // 2. Crear Insumos
    const harina = await this.suppliesService.create({
      name: 'Harina de Trigo',
      unit: 'gr',
      initialQuantity: 1000,
      costPerUnit: 5.5
    });

    // 3. Agregar Lotes (Inventory) vinculados a la tienda
    await this.suppliesService.addBatch(harina.id, {
      initialQuantity: 900,
      costPerUnit: 6.5,
      storeId: store[0].id
    });

    // 4. Crear Recetas...
    const receta = await this.recipesService.create({
      name: 'Pan de Trigo',
      description: 'Pan de trigo',
      ingredients: [
        { supplyId: harina.id, quantity: 100, unit: 'gr' }
      ]
    });

    return {
      message: 'Seed executed successfully',
      store,
      harina,
      receta
    };
  }
}
