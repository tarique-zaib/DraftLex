using DraftLex.Application.Interfaces;
using DraftLex.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DraftLex.Api.Controllers;

[ApiController]
[Route("api/matters/{matterId:guid}/fee")]
[Authorize]
public class MatterFeesController : ControllerBase
{
    private readonly IDraftLexDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public MatterFeesController(
        IDraftLexDbContext db,
        ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    // GET:
    // /api/matters/{matterId}/fee
    [HttpGet]
    public async Task<IActionResult> GetFee(
        Guid matterId,
        CancellationToken cancellationToken)
    {
        var fee = await _db.MatterFees
            .Where(x =>
                x.MatterId == matterId &&
                x.Matter.AdvocateId == _currentUser.UserId)
            .Select(x => new
            {
                x.Id,
                x.MatterId,
                x.FeeType,
                x.FixedFee,
                x.DailyRate,
                x.HourlyRate,
                x.AppearanceRate,
                x.Notes,
                x.CreatedAt,
                x.UpdatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (fee == null)
        {
            return NotFound(new
            {
                message = "Fee configuration not found for this matter."
            });
        }

        return Ok(fee);
    }

    // POST:
    // /api/matters/{matterId}/fee
    [HttpPost]
    public async Task<IActionResult> CreateFee(
        Guid matterId,
        [FromBody] CreateMatterFeeRequest request,
        CancellationToken cancellationToken)
    {
        var ownsMatter = await _db.Matters
            .AnyAsync(
                m => m.Id == matterId &&
                     m.AdvocateId == _currentUser.UserId,
                cancellationToken);

        if (!ownsMatter)
            return NotFound();

        var existingFee = await _db.MatterFees
            .FirstOrDefaultAsync(
                x => x.MatterId == matterId,
                cancellationToken);

        if (existingFee != null)
        {
            return Conflict(new
            {
                message = "A fee configuration already exists for this matter."
            });
        }

        var validationResult = ValidateFeeRequest(request);

        if (validationResult != null)
            return BadRequest(validationResult);

        var fee = new MatterFee
        {
            Id = Guid.NewGuid(),
            MatterId = matterId,
            FeeType = request.FeeType,
            FixedFee = request.FixedFee,
            DailyRate = request.DailyRate,
            HourlyRate = request.HourlyRate,
            AppearanceRate = request.AppearanceRate,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };

        _db.MatterFees.Add(fee);

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            id = fee.Id,
            message = "Fee configuration created successfully."
        });
    }

    // PUT:
    // /api/matters/{matterId}/fee
    [HttpPut]
    public async Task<IActionResult> UpdateFee(
        Guid matterId,
        [FromBody] CreateMatterFeeRequest request,
        CancellationToken cancellationToken)
    {
        var fee = await _db.MatterFees
            .FirstOrDefaultAsync(
                x =>
                    x.MatterId == matterId &&
                    x.Matter.AdvocateId == _currentUser.UserId,
                cancellationToken);

        if (fee == null)
        {
            return NotFound(new
            {
                message = "Fee configuration not found for this matter."
            });
        }

        var validationResult = ValidateFeeRequest(request);

        if (validationResult != null)
            return BadRequest(validationResult);

        fee.FeeType = request.FeeType;
        fee.FixedFee = request.FixedFee;
        fee.DailyRate = request.DailyRate;
        fee.HourlyRate = request.HourlyRate;
        fee.AppearanceRate = request.AppearanceRate;
        fee.Notes = request.Notes;
        fee.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            id = fee.Id,
            message = "Fee configuration updated successfully."
        });
    }

    private static object? ValidateFeeRequest(
        CreateMatterFeeRequest request)
    {
        var allowedFeeTypes = new[]
        {
            "Fixed",
            "Daily",
            "Hourly",
            "PerAppearance",
            "Custom"
        };

        if (!allowedFeeTypes.Contains(
                request.FeeType,
                StringComparer.OrdinalIgnoreCase))
        {
            return new
            {
                message = "Invalid fee type.",
                allowedFeeTypes
            };
        }

        if (request.FixedFee < 0 ||
            request.DailyRate < 0 ||
            request.HourlyRate < 0 ||
            request.AppearanceRate < 0)
        {
            return new
            {
                message = "Fee amounts cannot be negative."
            };
        }

        if (request.FeeType.Equals(
                "Fixed",
                StringComparison.OrdinalIgnoreCase) &&
            request.FixedFee <= 0)
        {
            return new
            {
                message = "FixedFee must be greater than zero for Fixed fee type."
            };
        }

        if (request.FeeType.Equals(
                "Daily",
                StringComparison.OrdinalIgnoreCase) &&
            request.DailyRate <= 0)
        {
            return new
            {
                message = "DailyRate must be greater than zero for Daily fee type."
            };
        }

        if (request.FeeType.Equals(
                "Hourly",
                StringComparison.OrdinalIgnoreCase) &&
            request.HourlyRate <= 0)
        {
            return new
            {
                message = "HourlyRate must be greater than zero for Hourly fee type."
            };
        }

        if (request.FeeType.Equals(
                "PerAppearance",
                StringComparison.OrdinalIgnoreCase) &&
            request.AppearanceRate <= 0)
        {
            return new
            {
                message = "AppearanceRate must be greater than zero for PerAppearance fee type."
            };
        }

        return null;
    }
}

public class CreateMatterFeeRequest
{
    public string FeeType { get; set; } = "Fixed";

    public decimal FixedFee { get; set; }

    public decimal DailyRate { get; set; }

    public decimal HourlyRate { get; set; }

    public decimal AppearanceRate { get; set; }

    public string? Notes { get; set; }
}