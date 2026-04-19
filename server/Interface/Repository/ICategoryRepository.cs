using server.Entities;

namespace server.Interface.Repository
{
    public interface ICategoryRepository:IGenericRepository<Category>
    {
        Task<IEnumerable<Category>> GetAllIncludingImage();
        Task<Category?> GetByName(string name);
    }
}
