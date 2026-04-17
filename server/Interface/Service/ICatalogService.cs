using server.Dto;
using server.Entities;

namespace server.Interface.Service
{
    public interface ICatalogService
    {
        //Product
        Task<ProductPagination> GetAllProducts(CatalogSpec inData);
        Task<Product?> GetProductById(int id);
        Task<Product> CreateProduct(CreateProductReq inData);
        Task<Product> UpdateProduct(int productId, UpdateProductReq inData);
        Task<Product> UpdateProductStockStatus(int productId, UpdateProductStockReq inData);
        Task DeleteProduct(int productId);
  

        //Brand
        Task<IEnumerable<Brand>> GetAllBrand();
        Task<Brand> CreateBrand(CreateBrandReq inData);
        Task DeleteBrand(int brandId);

        //Categery
        Task<IEnumerable<Category>> GetAllCategery();
        Task<Category> CreateCategery(CreateCategoryReq inData);
        Task DeleteCategery(int categeryId);
    }
}
