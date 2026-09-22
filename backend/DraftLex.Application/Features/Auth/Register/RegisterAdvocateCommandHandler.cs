using BCrypt.Net;
using DraftLex.Application.Interfaces;
using DraftLex.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DraftLex.Application.Features.Auth.Register;

public class RegisterAdvocateCommandHandler
    : IRequestHandler<RegisterAdvocateCommand, Guid>
{
    private readonly IDraftLexDbContext _db;

    public RegisterAdvocateCommandHandler(IDraftLexDbContext db)
    {
        _db = db;
    }

    public async Task<Guid> Handle(RegisterAdvocateCommand request, CancellationToken cancellationToken)
    {
        var exists = await _db.Advocates
            .AnyAsync(x => x.Email == request.Email, cancellationToken);

        if (exists)
            throw new ArgumentException("Email already registered.");

        var advocate = new Advocate
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName,
            BarCouncilNumber = request.BarCouncilNumber,
            StateBarCouncil = request.StateBarCouncil,
            Email = request.Email,
            Mobile = request.Mobile,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            CreatedAt = DateTime.UtcNow
        };

        _db.Advocates.Add(advocate);

        await _db.SaveChangesAsync(cancellationToken);

        return advocate.Id;
    }
}