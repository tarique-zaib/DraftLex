using System.Security.Claims;
using DraftLex.Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace DraftLex.Api.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public bool IsAuthenticated =>
        _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated == true;

    public Guid UserId
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;

            var id =
                user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                user?.FindFirst("sub")?.Value;

            if (!Guid.TryParse(id, out var guid))
                throw new UnauthorizedAccessException("User ID not found.");

            return guid;
        }
    }
}