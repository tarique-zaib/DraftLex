namespace DraftLex.Domain.Entities;

public class Payment
{
    public Guid Id { get; set; }

    public Guid MatterId { get; set; }

    public Matter Matter { get; set; } = null!;

    public DateTime PaymentDate { get; set; }

    public decimal Amount { get; set; }

    /// <summary>
    /// Cash, UPI, BankTransfer, Cheque, Card or Other
    /// </summary>
    public string PaymentMode { get; set; } = "Cash";

    public string? ReferenceNumber { get; set; }

    public string? Remarks { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}