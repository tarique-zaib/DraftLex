using DraftLex.Application.Interfaces;
using DraftLex.Domain.Entities;
using DraftLex.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace DraftLex.Infrastructure.Repositories;

public class ClientRepository : IClientRepository
{
    private readonly DraftLexDbContext _db;

    public ClientRepository(DraftLexDbContext db)
    {
        _db = db;
    }

    public async Task<Client> AddAsync(Client client)
    {
        await _db.Clients.AddAsync(client);
        return client;
    }

    public Task<List<Client>> GetAllAsync()
        => _db.Clients
            .Where(x => x.IsActive)
            .OrderBy(x => x.FullName)
            .ToListAsync();

    public Task<Client?> GetByIdAsync(Guid id)
        => _db.Clients.FirstOrDefaultAsync(x => x.Id == id);

    public async Task<long> GetNextClientSequenceAsync()
    {
        var connection = (NpgsqlConnection)_db.Database.GetDbConnection();

        if (connection.State != System.Data.ConnectionState.Open)
            await connection.OpenAsync();

        await using var command = new NpgsqlCommand("SELECT nextval('client_code_seq')", connection);

        var result = await command.ExecuteScalarAsync();

        return Convert.ToInt64(result);
    }

    public Task UpdateAsync(Client client)
    {
        _db.Clients.Update(client);
        return Task.CompletedTask;
    }

    public Task SoftDeleteAsync(Client client)
    {
        client.IsActive = false;
        _db.Clients.Update(client);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync()
        => _db.SaveChangesAsync();
}