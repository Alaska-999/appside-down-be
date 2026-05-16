class CreateFlashcardNestedDto {
    term: string;
    definition: string;
}


export class CreateModuleDto {
    name: string;
    description?: string;
    isFavorite?: boolean;
    folderId?: string;
    flashcards?: CreateFlashcardNestedDto[];
}

