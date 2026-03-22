export type UUID = `${string}-${string}-${string}-${string}-${string}`;

export interface Product {
    id: UUID;
    name: string;
    description: string;
    price: number;
    category: string;
    inStock: boolean;
}
