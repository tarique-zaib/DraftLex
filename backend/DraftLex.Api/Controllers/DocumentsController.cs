using DraftLex.Api.Services;
using DraftLex.Application.Features.Documents;
using DraftLex.Application.Features.Documents.DTOs;
using DraftLex.Application.Interfaces;
using DraftLex.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DraftLex.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly LegalDocumentService _service;
    private readonly PdfExportService _pdf;
    private readonly IDraftLexDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public DocumentsController(
        LegalDocumentService service,
        PdfExportService pdf,
        IDraftLexDbContext db,
        ICurrentUserService currentUser)
    {
        _service = service;
        _pdf = pdf;
        _db = db;
        _currentUser = currentUser;
    }

    [HttpPost]
    public async Task<ActionResult<DocumentResponse>> Create(CreateDocumentRequest request)
    {
        // Verify Matter belongs to current advocate
        var ownsMatter = await _db.Matters.AnyAsync(m =>
            m.Id == request.MatterId &&
            m.AdvocateId == _currentUser.UserId);

        if (!ownsMatter)
            return NotFound();

        var result = await _service.CreateAsync(request);

        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var document = await _db.LegalDocuments
            .Include(d => d.Matter)
                .ThenInclude(m => m.Client)
            .FirstOrDefaultAsync(d =>
                d.Id == id &&
                d.Matter.AdvocateId == _currentUser.UserId);

        if (document == null)
            return NotFound();

        return Ok(new
        {
            id = document.Id,
            title = document.Title,
            documentType = document.DocumentType,
            content = document.Content,
            version = document.Version,
            status = document.Status,

            matterId = document.MatterId,
            matterTitle = document.Matter?.Title ?? "",
            court = document.Matter?.Court ?? "",
            clientName = document.Matter?.Client?.FullName ?? ""
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateDocumentRequest request)
    {
        var ownsDocument = await _db.LegalDocuments.AnyAsync(d =>
            d.Id == id &&
            d.Matter.AdvocateId == _currentUser.UserId);

        if (!ownsDocument)
            return NotFound();

        var updated = await _service.UpdateAsync(id, request);

        if (!updated)
            return NotFound();

        return NoContent();
    }

    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromBody] GenerateDocumentRequest request)
    {
        // Prevent generating documents for another advocate's matter
        var ownsMatter = await _db.Matters.AnyAsync(m =>
            m.Id == request.MatterId &&
            m.AdvocateId == _currentUser.UserId);

        if (!ownsMatter)
            return NotFound();

        var advocateName =
            User.FindFirst("name")?.Value ??
            User.FindFirst(ClaimTypes.Name)?.Value ??
            User.Identity?.Name ??
            "Advocate";

        var document = await _service.GenerateAsync(request, advocateName);

        return Ok(new { id = document.Id });
    }

    [HttpGet("matter/{matterId:guid}")]
    public async Task<ActionResult<List<DocumentResponse>>> GetByMatter(Guid matterId)
    {
        var ownsMatter = await _db.Matters.AnyAsync(m =>
            m.Id == matterId &&
            m.AdvocateId == _currentUser.UserId);

        if (!ownsMatter)
            return NotFound();

        var documents = await _service.GetByMatterAsync(matterId);

        return Ok(documents);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var documents = await _db.LegalDocuments
            .Include(d => d.Matter)
                .ThenInclude(m => m.Client)
            .Where(d => d.Matter.AdvocateId == _currentUser.UserId)
            .OrderByDescending(d => d.UpdatedAt)
            .Select(d => new
            {
                id = d.Id,
                matterId = d.MatterId,
                matterTitle = d.Matter.Title,
                court = d.Matter.Court,
                clientName = d.Matter.Client.FullName,
                title = d.Title,
                documentType = d.DocumentType,
                version = d.Version,
                status = d.Status,
                updatedAt = d.UpdatedAt
            })
            .ToListAsync();

        return Ok(documents);
    }

    [HttpGet("{id:guid}/pdf")]
    public async Task<IActionResult> ExportPdf(Guid id)
    {
        var document = await _db.LegalDocuments
            .Include(d => d.Matter)
                .ThenInclude(m => m.Client)
            .FirstOrDefaultAsync(d =>
                d.Id == id &&
                d.Matter.AdvocateId == _currentUser.UserId);

        if (document == null)
            return NotFound();

        var pdf = _pdf.Generate(document);

        return File(
            pdf,
            "application/pdf",
            $"{document.Title}.pdf");
    }
}