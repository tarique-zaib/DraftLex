namespace DraftLex.Application.DTOs.Clients;

public class UpdateClientRequest
{
    public string FullName { get; set; } = string.Empty;
    public string FatherName { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
}