namespace DraftLex.Application.Features.Auth;

public class LoginResponse
{
    public string Token { get; set; } = "";
    public DateTime ExpiresAt { get; set; }
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
}