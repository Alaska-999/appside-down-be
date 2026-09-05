import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateFolderDto } from './create-folder.dto';

export class UpdateFolderDto extends PartialType(OmitType(CreateFolderDto, ['tags'] as const)) {}
