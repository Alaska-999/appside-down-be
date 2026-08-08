export interface RawCursorQuery {
  cursor?: string;
  limit?: string;
  search?: string;
}

export interface ParsedCursorQuery {
  cursor?: string;
  limit: number;
  search?: string;
}

export interface CursorPage<T> {
  data: T[];
  nextCursor: string | null;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export function parseCursorQuery(query: RawCursorQuery): ParsedCursorQuery {
  const parsedLimit = parseInt(query.limit ?? '', 10);
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, MAX_LIMIT)
      : DEFAULT_LIMIT;
  const trimmedSearch = query.search?.trim();

  return {
    cursor: query.cursor || undefined,
    limit,
    search: trimmedSearch ? trimmedSearch : undefined,
  };
}



export function paginateResults<T>(
  items: T[],
  pageSize: number,
  getCursor: (item: T) => string = (item: any) => item.id,
): CursorPage<T> {
  const hasNextPage = items.length > pageSize;
  const pageItems = hasNextPage ? items.slice(0, pageSize) : items;
  const lastItem = pageItems[pageItems.length - 1];

  return {
    data: pageItems,
    nextCursor: hasNextPage && lastItem ? getCursor(lastItem) : null,
  };
}