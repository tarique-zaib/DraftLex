namespace DraftLex.Domain.Entities;

public class Advocate
{
    public Guid Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string BarCouncilNumber { get; set; } = string.Empty;

    public string StateBarCouncil { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Mobile { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public string Role { get; set; } = "Advocate";

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}