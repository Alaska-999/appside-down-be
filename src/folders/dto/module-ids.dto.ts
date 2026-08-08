import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class ModuleIdsDto {
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(200)
    @IsUUID('4', { each: true })
    moduleIds!: string[];
}
