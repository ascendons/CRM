export interface Page<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number; // Current page number (0-indexed)
    size: number;   // Page size
    first: boolean;
    last: boolean;
    empty: boolean;
}

export interface PaginationParams {
    page?: number;
    size?: number;
    sort?: string; // e.g., "productName,asc" or "createdAt,desc"
}
