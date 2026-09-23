namespace DraftLex.Application.Features.Matters.GetById;

public class MatterDetailsResponse
{
    public Guid Id { get; set; }

    public string MatterNumber { get; set; } = "";

    public string Title { get; set; } = "";

    public string MatterType { get; set; } = "";

    public string Court { get; set; } = "";

    public string CaseNumber { get; set; } = "";

    public string JudgeName { get; set; } = "";

    public string Status { get; set; } = "";

    // NEW
    public string? OppositePartyName { get; set; }

    public string? OppositePartyAddress { get; set; }

    public ClientSummary Client { get; set; } = new();
}

public class ClientSummary
{
    public Guid Id { get; set; }

    public string ClientCode { get; set; } = "";

    public string FullName { get; set; } = "";

    public string Mobile { get; set; } = "";
}