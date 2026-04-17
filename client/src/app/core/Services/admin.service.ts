import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ResponseDto } from '../Models/response';
import { ProductResDto } from '../Models/catalog';
import { UpdateProductStockReq } from '../Models/admin';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(private http: HttpClient) {}

  createProduct(payload: FormData) {
    return this.http.post<ResponseDto<ProductResDto>>('admin/products', payload);
  }

  updateProduct(productId: number, payload: FormData) {
    return this.http.put<ResponseDto<ProductResDto>>(`admin/products/${productId}`, payload);
  }

  deleteProduct(productId: number) {
    return this.http.delete<ResponseDto<null>>(`admin/products/${productId}`);
  }

  updateProductStock(productId: number, payload: UpdateProductStockReq) {
    return this.http.patch<ResponseDto<ProductResDto>>(`admin/products/${productId}/stock-status`, payload);
  }
}
