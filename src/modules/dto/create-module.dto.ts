class CreateFlashcardNestedDto {
    term: string;
    definition: string;
}


export class CreateModuleDto {
    name: string;
    isFavorite?: boolean;
    folderId?: string;
    flashcards?: CreateFlashcardNestedDto[];
}

