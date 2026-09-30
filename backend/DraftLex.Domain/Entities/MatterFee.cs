namespace DraftLex.Domain.Entities;

public class MatterFee
{
    public Guid Id { get; set; }

    public Guid MatterId { get; set; }

    public Matter Matter { get; set; } = null!;

    /// <summary>
    /// Fixed, Daily, Hourly, PerAppearance or Custom
    /// </summary>
    public string FeeType { get; set; } = "Fixed";

    /// <summary>
    /// Base/fixed professional fee.
    /// </summary>
    public decimal FixedFee { get; set; }

    /// <summary>
    /// Amount charged for one chargeable day/appearance.
    /// </summary>
    public decimal DailyRate { get; set; }

    /// <summary>
    /// Amount charged per hour when Hourly fee type is used.
    /// </summary>
    public decimal HourlyRate { get; set; }

    /// <summary>
    /// Amount charged per hearing/appearance.
    /// </summary>
    public decimal AppearanceRate { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public ICollection<MatterFeeEntry> FeeEntries { get; set; }
        = new List<MatterFeeEntry>();
}