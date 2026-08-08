import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateFlashcardDto } from './create-flashcard.dto';

export class UpdateFlashcardDto extends PartialType(
  OmitType(CreateFlashcardDto, ['moduleId'] as const),
) {}
