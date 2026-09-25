namespace DraftLex.Domain.Entities;

public class Client
{

    public Guid AdvocateId { get; set; }

    public Guid Id { get; set; }

    // Nullable until authentication is wired in
    

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