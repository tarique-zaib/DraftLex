using DraftLex.Application.DTOs.Clients;
using DraftLex.Application.Interfaces;
using DraftLex.Domain.Entities;

namespace DraftLex.Application.Services;

public class ClientService
{
    private readonly IClientRepository _repo;

    public ClientService(IClientRepository repo)
    {
        _repo = repo;
    }

    // Create Client
    public async Task<ClientResponse> CreateAsync(CreateClientRequest request)
    {
        var nextNumber = await _repo.GetNextClientSequenceAsync();

        var client = new Client
        {
            Id = Guid.NewGuid(),
            ClientCode = $"CL-{nextNumber:D6}",
            FullName = request.FullName,
            FatherName = request.FatherName,
            Mobile = request.Mobile,
            Email = request.Email,
            Address = request.Address
        };

        await _repo.AddAsync(client);
        await _repo.SaveChangesAsync();

        return Map(client);
    }

    // Get All Clients
    public async Task<List<ClientResponse>> GetAllAsync()
    {
        var clients = await _repo.GetAllAsync();
        return clients.Select(Map).ToList();
    }

    // Get Client by Id
    public async Task<ClientResponse?> GetByIdAsync(Guid id)
    {
        var client = await _repo.GetByIdAsync(id);

        if (client == null || !client.IsActive)
            return null;

        return Map(client);
    }

    // Update Client
    public async Task<bool> UpdateAsync(Guid id, UpdateClientRequest request)
    {
        var client = await _repo.GetByIdAsync(id);

        if (client == null || !client.IsActive)
            return false;

        client.FullName = request.FullName;
        client.FatherName = request.FatherName;
        client.Mobile = request.Mobile;
        client.Email = request.Email;
        client.Address = request.Address;

        await _repo.UpdateAsync(client);
        await _repo.SaveChangesAsync();

        return true;
    }

    // Soft Delete Client
    public async Task<bool> DeleteAsync(Guid id)
    {
        var client = await _repo.GetByIdAsync(id);

        if (client == null || !client.IsActive)
            return false;

        await _repo.SoftDeleteAsync(client);
        await _repo.SaveChangesAsync();

        return true;
    }

    private static ClientResponse Map(Client client)
    {
        return new ClientResponse
        {
            Id = client.Id,
            ClientCode = client.ClientCode,
            FullName = client.FullName,
            Mobile = client.Mobile
        };
    }
}