import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEnum, IsISO8601, IsUUID, ValidateNested } from 'class-validator';

export class StudyEventInputDto {
  @IsUUID()
  flashcardId!: string;

  @IsUUID()
  moduleId!: string;

  @IsEnum(['KNOWN', 'STILL_LEARNING'])
  status!: 'KNOWN' | 'STILL_LEARNING';

  @IsISO8601()
  answeredAt!: string;
}

export class SubmitStudyEventsDto {
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => StudyEventInputDto)
  events!: StudyEventInputDto[];
}
