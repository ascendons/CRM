export enum AttributeType {
    STRING = 'STRING',
    NUMBER = 'NUMBER',
    BOOLEAN = 'BOOLEAN',
    RANGE = 'RANGE',
    DATE = 'DATE',
    UNKNOWN = 'UNKNOWN'
}

export interface ProductAttribute {
    key: string;
    displayKey: string;
    value: string;
    type: AttributeType;
    numericValue?: number;
    unit?: string;
}

export interface Product {
    id: string;
    productId: string;
    displayName: string;
    category?: string;
    attributes: ProductAttribute[];
    sourceHeaders?: Record<string, string>;
    createdAt: string;
    createdBy: string;
}

export interface AvailableFilter {
    attributeKey: string;
    displayName: string;
    type: AttributeType;
    availableValues: string[];
}

export enum FilterType {
    EXACT = 'EXACT',
    RANGE = 'RANGE',
    IN = 'IN',
    CONTAINS = 'CONTAINS'
}

export interface FilterRequest {
    type: FilterType;
    value?: string;
    values?: string[];
    min?: number;
    max?: number;
}

export interface SearchRequest {
    keyword?: string;
    category?: string;
    filters?: Record<string, FilterRequest>;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: 'ASC' | 'DESC';
}

export interface SearchResponse {
    content: Product[];
    totalElements: number;
    totalPages: number;
    number: number;
}
