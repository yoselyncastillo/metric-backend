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
import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';

@Auth()
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  create(@Body() createRecipeDto: CreateRecipeDto, @GetUser() user: User) {
    return this.recipesService.create(createRecipeDto, user);
  }

  @Post('preview-costs')
  calculateCosts(
    @Body(
      new ParseArrayPipe({
        items: CreateRecipeIngredientDto,
      }),
    )
    ingredients: CreateRecipeIngredientDto[],
    @GetUser() user: User
  ) {
    return this.recipesService.calculatePreviewCosts(ingredients, user);
  }

  @Post(':id/produce')
  async produce(
    @Param('id') id: string,
    @Body('desiredPortions') desiredPortions: number,
    @GetUser() user: User
  ) {
    return await this.recipesService.produce(+id, desiredPortions, user);
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.recipesService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.recipesService.findOne(+id, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRecipeDto: UpdateRecipeDto, @GetUser() user: User) {
    return this.recipesService.update(+id, updateRecipeDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.recipesService.remove(+id, user);
  }
}

