using DraftLex.Application.Interfaces;
using DraftLex.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DraftLex.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LegalClausesController : ControllerBase
{
    private readonly IDraftLexDbContext _db;

    public LegalClausesController(IDraftLexDbContext db)
    {
        _db = db;
    }

    // GET: /api/LegalClauses
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? category,
        CancellationToken cancellationToken)
    {
        var query = _db.LegalClauses.AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(c => c.Category == category);
        }

        var clauses = await query
            .OrderBy(c => c.Category)
            .ThenBy(c => c.Title)
            .Select(c => new
            {
                c.Id,
                c.Title,
                c.Category,
                c.Content,
                c.IsSystemClause
            })
            .ToListAsync(cancellationToken);

        return Ok(clauses);
    }

    // GET: /api/LegalClauses/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var clause = await _db.LegalClauses
            .Where(c => c.Id == id)
            .Select(c => new
            {
                c.Id,
                c.Title,
                c.Category,
                c.Content,
                c.IsSystemClause
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (clause == null)
            return NotFound();

        return Ok(clause);
    }

    // POST: /api/LegalClauses
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] LegalClause request,
        CancellationToken cancellationToken)
    {
        var clause = new LegalClause
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Category = request.Category,
            Content = request.Content,
            IsSystemClause = false,
            CreatedBy = request.CreatedBy,
            CreatedAt = DateTime.UtcNow
        };

        _db.LegalClauses.Add(clause);
        await _db.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { id = clause.Id },
            clause);
    }

    // PUT: /api/LegalClauses/{id}
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] LegalClause request,
        CancellationToken cancellationToken)
    {
        var clause = await _db.LegalClauses
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (clause == null)
            return NotFound();

        clause.Title = request.Title;
        clause.Category = request.Category;
        clause.Content = request.Content;

        await _db.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    // DELETE: /api/LegalClauses/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        var clause = await _db.LegalClauses
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (clause == null)
            return NotFound();

        // Protect built-in clauses
        if (clause.IsSystemClause)
            return BadRequest(new
            {
                message = "System clauses cannot be deleted."
            });

        _db.LegalClauses.Remove(clause);
        await _db.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}