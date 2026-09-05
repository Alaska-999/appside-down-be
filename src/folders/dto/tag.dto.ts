import { ArrayMaxSize, IsArray, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class TagNameDto {
    @IsString()
    @MinLength(1)
    @MaxLength(30)
    name!: string;
}

export class ModuleTagIdsDto {
    @IsArray()
    @ArrayMaxSize(20)
    @IsUUID('all', { each: true })
    tagIds!: string[];
}
