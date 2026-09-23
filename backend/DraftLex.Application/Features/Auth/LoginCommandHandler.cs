using BCrypt.Net;
using DraftLex.Application.Common.Security;
using DraftLex.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DraftLex.Application.Features.Auth;

public class LoginCommandHandler
    : IRequestHandler<LoginCommand, LoginResponse>
{
    private readonly IDraftLexDbContext _db;
    private readonly IJwtTokenService _jwt;

    public LoginCommandHandler(
        IDraftLexDbContext db,
        IJwtTokenService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    public async Task<LoginResponse> Handle(
        LoginCommand request,
        CancellationToken cancellationToken)
    {
        var advocate = await _db.Advocates
            .FirstOrDefaultAsync(x => x.Email == request.Email, cancellationToken);

        if (advocate == null)
            throw new ArgumentException("Invalid credentials.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, advocate.PasswordHash))
            throw new ArgumentException("Invalid credentials.");

        // FullName is now included in the JWT
        var token = _jwt.GenerateToken(
            advocate.Id,
            advocate.FullName,
            advocate.Email,
            advocate.Role);

        return new LoginResponse
        {
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddMinutes(480),
            FullName = advocate.FullName,
            Email = advocate.Email
        };
    }
}