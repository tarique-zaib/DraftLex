using DraftLex.Application.Interfaces;
using DraftLex.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DraftLex.Api.Controllers;

[ApiController]
[Route("api/matters/{matterId:guid}/payments")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IDraftLexDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public PaymentsController(
        IDraftLexDbContext db,
        ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    // GET:
    // /api/matters/{matterId}/payments
    [HttpGet]
    public async Task<IActionResult> GetPayments(
        Guid matterId,
        CancellationToken cancellationToken)
    {
        var ownsMatter = await _db.Matters
            .AnyAsync(
                m => m.Id == matterId &&
                     m.AdvocateId == _currentUser.UserId,
                cancellationToken);

        if (!ownsMatter)
            return NotFound();

        var payments = await _db.Payments
            .Where(p => p.MatterId == matterId)
            .OrderByDescending(p => p.PaymentDate)
            .Select(p => new
            {
                p.Id,
                p.PaymentDate,
                p.Amount,
                p.PaymentMode,
                p.ReferenceNumber,
                p.Remarks,
                p.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(payments);
    }

    // POST:
    // /api/matters/{matterId}/payments
    [HttpPost]
    public async Task<IActionResult> AddPayment(
        Guid matterId,
        [FromBody] CreatePaymentRequest request,
        CancellationToken cancellationToken)
    {
        var ownsMatter = await _db.Matters
            .AnyAsync(
                m => m.Id == matterId &&
                     m.AdvocateId == _currentUser.UserId,
                cancellationToken);

        if (!ownsMatter)
            return NotFound();

        if (request.Amount <= 0)
        {
            return BadRequest(new
            {
                message = "Payment amount must be greater than zero."
            });
        }

        var allowedModes = new[]
        {
            "Cash",
            "UPI",
            "Bank Transfer",
            "Cheque",
            "Card",
            "Other"
        };

        if (!allowedModes.Contains(
                request.PaymentMode,
                StringComparer.OrdinalIgnoreCase))
        {
            return BadRequest(new
            {
                message = "Invalid payment mode.",
                allowedModes
            });
        }

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            MatterId = matterId,
            PaymentDate = DateTime.SpecifyKind(
                        request.PaymentDate,
                        DateTimeKind.Utc),
            Amount = request.Amount,
            PaymentMode = request.PaymentMode,
            ReferenceNumber = request.ReferenceNumber,
            Remarks = request.Remarks,
            CreatedAt = DateTime.UtcNow
        };

        _db.Payments.Add(payment);

        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                error = ex.Message,
                innerException = ex.InnerException?.Message,
                innerInnerException = ex.InnerException?.InnerException?.Message
            });
        }

        return Ok(new
        {
            id = payment.Id,
            message = "Payment recorded successfully."
        });
    }

    // DELETE:
    // /api/matters/{matterId}/payments/{paymentId}
    [HttpDelete("{paymentId:guid}")]
    public async Task<IActionResult> DeletePayment(
        Guid matterId,
        Guid paymentId,
        CancellationToken cancellationToken)
    {
        var payment = await _db.Payments
            .Include(p => p.Matter)
            .FirstOrDefaultAsync(
                p => p.Id == paymentId &&
                     p.MatterId == matterId &&
                     p.Matter.AdvocateId == _currentUser.UserId,
                cancellationToken);

        if (payment == null)
            return NotFound();

        _db.Payments.Remove(payment);

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            message = "Payment deleted successfully."
        });
    }

    // GET:
    // /api/matters/{matterId}/financial-summary
    [HttpGet("/api/matters/{matterId:guid}/financial-summary")]
    public async Task<IActionResult> GetFinancialSummary(
        Guid matterId,
        CancellationToken cancellationToken)
    {
        var matter = await _db.Matters
            .Where(m =>
                m.Id == matterId &&
                m.AdvocateId == _currentUser.UserId)
            .Select(m => new
            {
                m.Id,

                TotalCharges = m.FeeEntries
                    .Select(x => (decimal?)x.Amount)
                    .Sum() ?? 0m,

                TotalReceived = m.Payments
                    .Select(x => (decimal?)x.Amount)
                    .Sum() ?? 0m
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (matter == null)
            return NotFound();

        var outstanding =
            matter.TotalCharges - matter.TotalReceived;

        string status;

        if (matter.TotalCharges <= 0 &&
            matter.TotalReceived <= 0)
        {
            status = "Unpaid";
        }
        else if (outstanding > 0)
        {
            status = matter.TotalReceived > 0
                ? "Partially Paid"
                : "Unpaid";
        }
        else if (outstanding == 0)
        {
            status = "Paid";
        }
        else
        {
            status = "Overpaid";
        }

        return Ok(new
        {
            matterId,
            totalCharges = matter.TotalCharges,
            amountReceived = matter.TotalReceived,
            outstanding = outstanding < 0
                ? 0
                : outstanding,
            overpaidAmount = outstanding < 0
                ? Math.Abs(outstanding)
                : 0,
            status
        });
    }
}

public class CreatePaymentRequest
{
    public DateTime PaymentDate { get; set; }

    public decimal Amount { get; set; }

    public string PaymentMode { get; set; } = "Cash";

    public string? ReferenceNumber { get; set; }

    public string? Remarks { get; set; }
}