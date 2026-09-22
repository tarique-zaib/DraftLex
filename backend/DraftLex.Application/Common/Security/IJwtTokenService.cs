namespace DraftLex.Application.Common.Security;

public interface IJwtTokenService
{
    string GenerateToken(Guid advocateId, string email, string role);
}