using DraftLex.Application.Interfaces;
using DraftLex.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DraftLex.Api.Controllers;

[ApiController]
[Route("api/matters/{matterId:guid}/charges")]
[Authorize]
public class ChargesController : ControllerBase
{
    private readonly IDraftLexDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public ChargesController(
        IDraftLexDbContext db,
        ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    // =========================================================
    // GET
    // /api/matters/{matterId}/charges
    // =========================================================
    [HttpGet]
    public async Task<IActionResult> GetCharges(
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

        var charges = await _db.MatterFeeEntries
            .Where(x => x.MatterId == matterId)
            .OrderByDescending(x => x.ChargeDate)
            .ThenByDescending(x => x.CreatedAt)
            .Select(x => new
            {
                x.Id,
                x.MatterId,
                x.MatterFeeId,
                x.HearingId,
                x.ChargeDate,
                x.ChargeType,
                x.Description,
                x.Amount,
                x.Hours,
                x.Remarks,
                x.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(charges);
    }

    // =========================================================
    // POST
    // /api/matters/{matterId}/charges
    // =========================================================
    [HttpPost]
    public async Task<IActionResult> AddCharge(
        Guid matterId,
        [FromBody] CreateChargeRequest request,
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
                message = "Charge amount must be greater than zero."
            });
        }

        var allowedChargeTypes = new[]
        {
            "Daily",
            "Appearance",
            "Fixed",
            "Hourly",
            "Miscellaneous",
            "Custom"
        };

        if (!allowedChargeTypes.Contains(
                request.ChargeType,
                StringComparer.OrdinalIgnoreCase))
        {
            return BadRequest(new
            {
                message = "Invalid charge type.",
                allowedChargeTypes
            });
        }

        if (request.ChargeType.Equals(
                "Hourly",
                StringComparison.OrdinalIgnoreCase)
            && (!request.Hours.HasValue || request.Hours <= 0))
        {
            return BadRequest(new
            {
                message = "Hours must be greater than zero for an hourly charge."
            });
        }

        // Optional hearing validation.
        if (request.HearingId.HasValue)
        {
            var hearingBelongsToMatter = await _db.Hearings
                .AnyAsync(
                    h => h.Id == request.HearingId.Value &&
                         h.MatterId == matterId,
                    cancellationToken);

            if (!hearingBelongsToMatter)
            {
                return BadRequest(new
                {
                    message = "The selected hearing does not belong to this matter."
                });
            }
        }

        var charge = new MatterFeeEntry
        {
            Id = Guid.NewGuid(),
            MatterId = matterId,

            MatterFeeId = request.MatterFeeId,
            HearingId = request.HearingId,

            ChargeDate = DateTime.SpecifyKind(
                request.ChargeDate,
                DateTimeKind.Utc),

            ChargeType = request.ChargeType,
            Description = request.Description,
            Amount = request.Amount,
            Hours = request.Hours,
            Remarks = request.Remarks,

            CreatedAt = DateTime.UtcNow
        };

        _db.MatterFeeEntries.Add(charge);

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            id = charge.Id,
            message = "Charge recorded successfully."
        });
    }

    // =========================================================
    // DELETE
    // /api/matters/{matterId}/charges/{chargeId}
    // =========================================================
    [HttpDelete("{chargeId:guid}")]
    public async Task<IActionResult> DeleteCharge(
        Guid matterId,
        Guid chargeId,
        CancellationToken cancellationToken)
    {
        var charge = await _db.MatterFeeEntries
            .FirstOrDefaultAsync(
                x => x.Id == chargeId &&
                     x.MatterId == matterId,
                cancellationToken);

        if (charge == null)
            return NotFound();

        var ownsMatter = await _db.Matters
            .AnyAsync(
                m => m.Id == matterId &&
                     m.AdvocateId == _currentUser.UserId,
                cancellationToken);

        if (!ownsMatter)
            return NotFound();

        _db.MatterFeeEntries.Remove(charge);

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            message = "Charge deleted successfully."
        });
    }
}


// =============================================================
// REQUEST MODEL
// =============================================================

public class CreateChargeRequest
{
    public DateTime ChargeDate { get; set; }

    public string ChargeType { get; set; } = "Custom";

    public string Description { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public decimal? Hours { get; set; }

    public Guid? HearingId { get; set; }

    public Guid? MatterFeeId { get; set; }

    public string? Remarks { get; set; }
}