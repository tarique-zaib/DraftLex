namespace DraftLex.Domain.Entities;

public class Client
{
    public Guid Id { get; set; }

    public string ClientCode { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string FatherName { get; set; } = string.Empty;

    public string Mobile { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Matter> Matters { get; set; } = new List<Matter>();
}