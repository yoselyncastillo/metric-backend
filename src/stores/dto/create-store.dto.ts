import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la tienda es obligatorio' })
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsUrl({}, { message: 'El enlace de Instagram debe ser una URL válida' })
  @IsOptional()
  instagramUrl?: string;

  @IsUrl({}, { message: 'El enlace de Google Maps debe ser una URL válida' })
  @IsOptional()
  mapsUrl?: string;
}