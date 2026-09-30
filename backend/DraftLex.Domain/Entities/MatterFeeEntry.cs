namespace DraftLex.Domain.Entities;

public class MatterFeeEntry
{
    public Guid Id { get; set; }

    public Guid MatterId { get; set; }

    public Matter Matter { get; set; } = null!;

    public Guid? MatterFeeId { get; set; }

    public MatterFee? MatterFee { get; set; }

    /// <summary>
    /// Optional link to a hearing/appearance.
    /// We are not changing Hearing functionality.
    /// </summary>
    public Guid? HearingId { get; set; }

    public Hearing? Hearing { get; set; }

    public DateTime ChargeDate { get; set; }

    /// <summary>
    /// Daily, Appearance, Fixed, Hourly, Miscellaneous or Custom.
    /// </summary>
    public string ChargeType { get; set; } = "Custom";

    public string Description { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public decimal? Hours { get; set; }

    public string? Remarks { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}