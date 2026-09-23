namespace DraftLex.Application.DTOs.Clients;

public class ClientResponse
{
    public Guid Id { get; set; }

    public string ClientCode { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string Mobile { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;
    
}