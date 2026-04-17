using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using server.Dto;
using server.Interface.Service;

namespace server.Controllers
{
    [Route("api/admin/products")]
    [ApiController]
    [Authorize(Roles = "ADMIN")]
    public class AdminProductsController : ControllerBase
    {
        private readonly ICatalogService catalogService;

        public AdminProductsController(ICatalogService catalogService)
        {
            this.catalogService = catalogService;
        }

        [HttpPost]
        public async Task<ActionResult<ResponseDto>> CreateProduct([FromForm] CreateProductReq req)
        {
            ResponseDto response = new ResponseDto();
            try
            {
                var createdProduct = await catalogService.CreateProduct(req);
                response.Data = createdProduct;
                response.Message = "Product created successfully";
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(response.Error(ex.Message));
            }
        }

        [HttpPut("{productId:int}")]
        public async Task<ActionResult<ResponseDto>> UpdateProduct(int productId, [FromForm] UpdateProductReq req)
        {
            ResponseDto response = new ResponseDto();
            try
            {
                var updatedProduct = await catalogService.UpdateProduct(productId, req);
                response.Data = updatedProduct;
                response.Message = "Product updated successfully";
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(response.Error(ex.Message));
            }
        }

        [HttpPatch("{productId:int}/stock-status")]
        public async Task<ActionResult<ResponseDto>> UpdateProductStockStatus(int productId, [FromBody] UpdateProductStockReq req)
        {
            ResponseDto response = new ResponseDto();
            try
            {
                var updatedProduct = await catalogService.UpdateProductStockStatus(productId, req);
                response.Data = updatedProduct;
                response.Message = "Stock status updated successfully";
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(response.Error(ex.Message));
            }
        }

        [HttpDelete("{productId:int}")]
        public async Task<ActionResult<ResponseDto>> DeleteProduct(int productId)
        {
            ResponseDto response = new ResponseDto();
            try
            {
                await catalogService.DeleteProduct(productId);
                response.Message = "Product deleted successfully";
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(response.Error(ex.Message));
            }
        }
    }
}
