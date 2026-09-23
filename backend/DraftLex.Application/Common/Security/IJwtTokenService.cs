namespace DraftLex.Application.Common.Security;

public interface IJwtTokenService
{
    string GenerateToken(
        Guid userId,
        string fullName,
        string email,
        string role);
}