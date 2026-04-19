using server.Entities;

namespace server.Interface.Repository
{
    public interface IBrandRepository:IGenericRepository<Brand>
    {
        Task<IEnumerable<Brand>> GetAllIncludingImage();
        Task<Brand?> GetByName(string name);
    }
}
