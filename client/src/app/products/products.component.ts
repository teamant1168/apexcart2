import { Component, HostListener, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ProductFilters, ProductResDto } from '../core/Models/catalog';
import { CatalogService } from '../core/Services/catalog.service';

@Component({
    selector: 'app-products',
    templateUrl: './products.component.html',
    styleUrls: ['./products.component.css'],
    standalone: false
})
export class ProductsComponent implements OnInit {
  products: ProductResDto[] = [];
  
  pageIndex: number=1;
  pageSize:number= 10;
  firstTimeloaded=false;
  pageItems!:number;
  maxPrice:number = 0;
  minPrice:number = 0;

  constructor(private catalogService: CatalogService) { }

  ngOnInit(): void {
    this.filters$.subscribe((filter) => {
      this.catalogService.getProducts(filter).subscribe((res) => {
        if(res.data?.count!=undefined){
          this.pageItems = res.data?.count;
        }
        if(res.data?.minPrice!=undefined){
          this.minPrice = res.data?.minPrice;
        }
        if(res.data?.maxPrice!=undefined){
          this.maxPrice = res.data?.maxPrice;
        }
        if (res.data?.data !== undefined) {
          this.products = res.data?.data;
        }
      });
    })
  }

  @HostListener('window:focus')
  onWindowFocus(): void {
    this.filters$.next({ ...this.getFilters });
  }


  

  initialFilters: ProductFilters = {
    pageIndex: 1,
    pageSize: 10,
    sort: 'newest'
  };
  filters$ = new BehaviorSubject<ProductFilters>(this.initialFilters);
  get getFilters(){
    return this.filters$.value;
  }

  display(pageIndex: number) {
    this.pageIndex = pageIndex;
    this.initialFilters={
      ...this.initialFilters,
      pageIndex: pageIndex
    }
    this.filters$.next(this.initialFilters)
  }
  filtersChanged(filters: any) {
    this.pageIndex = 1;
    this.initialFilters={
      ...this.initialFilters,
      pageIndex: 1,
      categoryIds: filters.categoryId,
      brandIds: filters.brandId,
      ratings : filters.ratings,
      maxPrice: filters.maxPrice,
      minPrice: filters.minPrice,
      inStock: filters.stockType
    }
    this.filters$.next(this.initialFilters)
  }

  sortFiltersChanged(sortFilters: any) {
    this.pageSize = sortFilters.itemsToShow;
    this.pageIndex = 1;
    this.initialFilters={
      ...this.initialFilters,
      pageIndex: 1,
      pageSize: sortFilters.itemsToShow,
      sort: sortFilters.sortBy
    }
    this.filters$.next(this.initialFilters);
  }
}
