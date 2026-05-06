import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseArrayPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateRecipeDto, CreateRecipeIngredientDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipesService } from './recipes.service';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  create(@Body() createRecipeDto: CreateRecipeDto) {
    return this.recipesService.create(createRecipeDto);
  }

  @Post('preview-costs')
  calculateCosts(
    @Body(
      new ParseArrayPipe({
        items: CreateRecipeIngredientDto,
      }),
    )
    ingredients: CreateRecipeIngredientDto[],
  ) {
    return this.recipesService.calculatePreviewCosts(ingredients);
  }

  @Post(':id/produce')
  async produce(
    @Param('id') id: string,
    @Body('desiredPortions') desiredPortions: number
  ) {
    return await this.recipesService.produce(+id, desiredPortions);
  }

  @Get()
  findAll() {
    return this.recipesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recipesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRecipeDto: UpdateRecipeDto) {
    return this.recipesService.update(+id, updateRecipeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recipesService.remove(+id);
  }
}
