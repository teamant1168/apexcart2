import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { BrandResDto, CategoryResDto } from 'src/app/core/Models/catalog';
import { loadBrands, loadCategories } from 'src/app/redux/catalog/catalog.action';
import { selectBrands, selectCategories } from 'src/app/redux/catalog/catalog.selector';
import { AppState } from 'src/app/redux/store';

@Component({
    selector: 'app-filters',
    templateUrl: './filters.component.html',
    styleUrls: ['./filters.component.css'],
    standalone: false
})
export class FiltersComponent implements OnChanges {
  categories$: Observable<CategoryResDto[]>;
  brands$:Observable<BrandResDto[]>;
  private isPriceFilterApplied = false;

  constructor(private store: Store<AppState>) {
    this.categories$ = this.store.select(selectCategories);
    this.brands$=this.store.select(selectBrands);
  }


  ngOnInit(): void {
    this.store.dispatch(loadCategories());
    this.store.dispatch(loadBrands());
  }

  ngOnChanges(changes: SimpleChanges): void {
    const hasMinChanged = !!changes['minPrice'];
    const hasMaxChanged = !!changes['maxPrice'];

    if (!hasMinChanged && !hasMaxChanged) {
      return;
    }

    if (this.maxPrice <= 0) {
      return;
    }

    if (!this.isPriceFilterApplied) {
      this.selectedMinPrice = this.minPrice;
      this.selectedMaxPrice = this.maxPrice;
      return;
    }

    this.selectedMinPrice = Math.max(this.selectedMinPrice, this.minPrice);
    this.selectedMaxPrice = Math.min(this.selectedMaxPrice, this.maxPrice);

    if (this.selectedMinPrice > this.selectedMaxPrice) {
      this.selectedMinPrice = this.minPrice;
      this.selectedMaxPrice = this.maxPrice;
      this.isPriceFilterApplied = false;
    }
  }




  // Sample filter values
  @Input() selectedCategoryIds: number[]=[];
  @Input() selectedBrandIds: number[]=[];
  @Input() selectedStockType: boolean | null = null;
  @Input() selectedRating: number[]=[];
 
  @Input() minPrice: number=0;
  @Input() maxPrice: number=30000;
  @Input() selectedMinPrice: number=this.minPrice;
  @Input() selectedMaxPrice: number=this.maxPrice;

  @Output() filtersChanged = new EventEmitter<any>();
 // Slider values


 // Star ratings filter
 ratings = [
   { value: 5, selected: false },
   { value: 4, selected: false },
   { value: 3, selected: false },
   { value: 2, selected: false },
   { value: 1, selected: false }
 ];

 // Update the selected price range
 minPriceChange(priceData:any){
  this.selectedMinPrice=priceData.value;
  this.isPriceFilterApplied = true;
  this.applyFilters();
 }
 maxPriceChange(priceData:any){
  this.selectedMaxPrice=priceData.value;
  this.isPriceFilterApplied = true;
  this.applyFilters();
 }

 // Toggle rating selection
 toggleRating(ratingValue: number) {
  const index = this.selectedRating.indexOf(ratingValue);
  if (index === -1) {
    this.selectedRating.push(ratingValue);
  } else {
    this.selectedRating.splice(index, 1);
  }
  this.applyFilters();
 }

 toggleCategory(categoryId:number){
  const index = this.selectedCategoryIds.indexOf(categoryId);
  if (index === -1) {
    this.selectedCategoryIds.push(categoryId);
  } else {
    this.selectedCategoryIds.splice(index, 1);
  }
  this.applyFilters();
 }

 toggleBrand(brandId:number){
  const index = this.selectedBrandIds.indexOf(brandId);
  if (index === -1) {
    this.selectedBrandIds.push(brandId);
  } else {
    this.selectedBrandIds.splice(index, 1);
  }
  this.applyFilters();
 }
 
 toggleStock(value:boolean | null){
  this.selectedStockType=value;
  this.applyFilters();
 }

   // Method to emit the filter data
   applyFilters() {
    const selectedFilters = {
      categoryId: [...this.selectedCategoryIds],
      brandId: [...this.selectedBrandIds],
      minPrice: this.isPriceFilterApplied ? this.selectedMinPrice : undefined,
      maxPrice: this.isPriceFilterApplied ? this.selectedMaxPrice : undefined,
      stockType:this.selectedStockType,
      ratings:[...this.selectedRating]
    };

    this.filtersChanged.emit(selectedFilters);
  }
}
