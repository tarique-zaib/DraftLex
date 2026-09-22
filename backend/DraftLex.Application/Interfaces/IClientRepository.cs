using DraftLex.Domain.Entities;

namespace DraftLex.Application.Interfaces;

public interface IClientRepository
{
    Task<Client> AddAsync(Client client);

    Task<List<Client>> GetAllAsync();

    Task<Client?> GetByIdAsync(Guid id);

    Task<long> GetNextClientSequenceAsync();

    Task UpdateAsync(Client client);

    Task SoftDeleteAsync(Client client);

    Task SaveChangesAsync();
}