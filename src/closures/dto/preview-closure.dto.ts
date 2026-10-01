import { IsDateString } from 'class-validator';

export class PreviewClosureDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
