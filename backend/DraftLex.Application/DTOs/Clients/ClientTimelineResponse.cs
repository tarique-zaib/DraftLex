namespace DraftLex.Application.DTOs.Clients;

public class ClientTimelineResponse
{
    public DateTime Date { get; set; }
    public string Type { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
}