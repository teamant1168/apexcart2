using AutoMapper;
using server.Dto;
using server.Entities;
using server.Interface.Repository;
using server.Interface.Service;
using System.Xml.Linq;

namespace server.Service
{
    public class CatalogService: ICatalogService
    {
        private readonly IProductRepository productRepository;
        private readonly ICategoryRepository categoryRepository;
        private readonly IBrandRepository brandRepository;
        private readonly IImageService imageService;
        private readonly IMapper mapper;

        public CatalogService(
            IProductRepository productRepository,
            ICategoryRepository categoryRepository,
            IBrandRepository brandRepository,
            IImageService imageService,
            IMapper mapper)
        {
            this.productRepository = productRepository;
            this.categoryRepository = categoryRepository;
            this.brandRepository = brandRepository;
            this.imageService = imageService;
            this.mapper = mapper;
        }

        public async Task<Brand> CreateBrand(CreateBrandReq inData)
        {
            Image image = await this.imageService.SaveImageAsync(inData.Image);
            Brand brand = mapper.Map<Brand>(inData);
            brand.ImageId = image.Id;
             return await brandRepository.AddAsync(brand);

        }

        public async Task<Category> CreateCategery(CreateCategoryReq inData)
        {
            Image image = await this.imageService.SaveImageAsync(inData.Image);

            Category category = mapper.Map<Category>(inData);
            category.Image = image;
            return await categoryRepository.AddAsync(category);
        }

        public async Task<Product> CreateProduct(CreateProductReq inData)
        {
            Category category = await ResolveCategory(inData.CategoryId, inData.CategoryName);
            Brand brand = await ResolveBrand(inData.BrandId, inData.BrandName);

            Image image = await this.imageService.SaveImageAsync(inData.Thumbnail);

            Product newProduct = mapper.Map<Product>(inData);

            newProduct.Brand = brand;
            newProduct.BrandId = brand.Id;
            newProduct.Category = category;
            newProduct.CategoryId = category.Id;
            newProduct.Thumbnail = image;
            newProduct.ThumbnailId = image.Id;

           return await this.productRepository.AddAsync(newProduct);
        }

        public async Task<Product> UpdateProduct(int productId, UpdateProductReq inData)
        {
            Product? product = await productRepository.GetByIdAsync(productId);
            Category category = await ResolveCategory(inData.CategoryId, inData.CategoryName);
            Brand brand = await ResolveBrand(inData.BrandId, inData.BrandName);

            if (product == null) { throw new Exception($"Invalid Product Id {productId}"); }

            product.Name = inData.Name;
            product.Description = inData.Description;
            product.OriginalPrice = inData.OriginalPrice;
            product.DiscountPercentage = inData.DiscountPercentage;
            product.DiscountAmount = inData.DiscountAmount;
            product.StockQuantity = inData.StockQuantity;
            product.IsFeatured = inData.IsFeatured;
            product.Category = category;
            product.CategoryId = category.Id;
            product.Brand = brand;
            product.BrandId = brand.Id;

            if (inData.Thumbnail != null)
            {
                if (product.ThumbnailId != null)
                {
                    await imageService.DeleteImageAsync((int)product.ThumbnailId);
                }

                Image image = await imageService.SaveImageAsync(inData.Thumbnail);
                product.Thumbnail = image;
                product.ThumbnailId = image.Id;
            }

            return await productRepository.UpdateAsync(product);
        }

        private async Task<Category> ResolveCategory(int? categoryId, string? categoryName)
        {
            if (categoryId.HasValue && categoryId.Value > 0)
            {
                Category? existingById = await categoryRepository.GetByIdAsync(categoryId.Value);
                if (existingById == null)
                {
                    throw new Exception($"Invalid Category Id {categoryId.Value}");
                }

                return existingById;
            }

            string normalizedName = NormalizeLookupName(categoryName, "Category");
            Category? existingByName = await categoryRepository.GetByName(normalizedName);
            if (existingByName != null)
            {
                return existingByName;
            }

            Category newCategory = new Category()
            {
                Name = normalizedName
            };

            return await categoryRepository.AddAsync(newCategory);
        }

        private async Task<Brand> ResolveBrand(int? brandId, string? brandName)
        {
            if (brandId.HasValue && brandId.Value > 0)
            {
                Brand? existingById = await brandRepository.GetByIdAsync(brandId.Value);
                if (existingById == null)
                {
                    throw new Exception($"Invalid Brand Id {brandId.Value}");
                }

                return existingById;
            }

            string normalizedName = NormalizeLookupName(brandName, "Brand");
            Brand? existingByName = await brandRepository.GetByName(normalizedName);
            if (existingByName != null)
            {
                return existingByName;
            }

            Brand newBrand = new Brand()
            {
                Name = normalizedName
            };

            return await brandRepository.AddAsync(newBrand);
        }

        private static string NormalizeLookupName(string? value, string fieldName)
        {
            string normalized = value?.Trim() ?? "";

            if (string.IsNullOrWhiteSpace(normalized))
            {
                throw new Exception($"{fieldName} is required.");
            }

            return normalized;
        }

        public async Task<Product> UpdateProductStockStatus(int productId, UpdateProductStockReq inData)
        {
            Product? product = await productRepository.GetByIdAsync(productId);
            if (product == null) { throw new Exception($"Invalid Product Id {productId}"); }

            if (!inData.InStock)
            {
                product.StockQuantity = 0;
                return await productRepository.UpdateAsync(product);
            }

            if (inData.StockQuantity.HasValue && inData.StockQuantity.Value < 1)
            {
                throw new Exception("Stock quantity must be greater than 0 when product is in stock.");
            }

            if (inData.StockQuantity.HasValue)
            {
                product.StockQuantity = inData.StockQuantity.Value;
            }
            else if (product.StockQuantity <= 0)
            {
                product.StockQuantity = 1;
            }

            return await productRepository.UpdateAsync(product);
        }

        public async Task DeleteBrand(int brandId)
        {
            Brand? brand = await this.brandRepository.GetByIdAsync(brandId);
            if (brand == null) { throw new Exception($"Invalid Brand Id {brandId}"); };

            if (brand.ImageId != null)
            {
                await imageService.DeleteImageAsync((int)brand.ImageId);
            }

            await brandRepository.DeleteAsync(brand);
        }

        public async Task DeleteCategery(int categeryId)
        {
            Category? category = await this.categoryRepository.GetByIdAsync(categeryId);
            if (category == null) { throw new Exception($"Invalid Category Id {categeryId}"); };

            if (category.ImageId != null)
            {
                await imageService.DeleteImageAsync((int)category.ImageId);
            }
            await categoryRepository.DeleteAsync(category);

        }

        public async Task DeleteProduct(int productId)
        {
            Product? product = await productRepository.GetByIdAsync(productId);
            if (product == null) { throw new Exception($"Invalid Product Id {productId}"); };

            if(product.ThumbnailId != null)
            {
                await imageService.DeleteImageAsync((int)product.ThumbnailId);
            }

            await productRepository.DeleteAsync(product);
        }

        public async Task<IEnumerable<Brand>> GetAllBrand()
        {
            return await brandRepository.GetAllIncludingImage();
        }

        public async Task<IEnumerable<Category>> GetAllCategery()
        {
            return await categoryRepository.GetAllIncludingImage();
        }

        public async Task<ProductPagination> GetAllProducts(CatalogSpec inData)
        {
            return await productRepository.GetAllIncludingChlidEntities(inData);
        }

        public async Task<Product?> GetProductById(int id)
        {
            return await productRepository.GetProductByIdIncludingChlidEntities(id);
        }
    }
}
