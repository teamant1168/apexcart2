export interface AdminLoginReq {
  username: string;
  password: string;
}

export interface UpdateProductStockReq {
  inStock: boolean;
  stockQuantity?: number;
}
