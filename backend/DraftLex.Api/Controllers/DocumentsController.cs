using DraftLex.Api.Services;
using DraftLex.Application.Features.Documents;
using DraftLex.Application.Features.Documents.DTOs;
using DraftLex.Application.Interfaces;
using DraftLex.Application.Services;
using DraftLex.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
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

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload([FromForm] UploadEvidenceRequest request)
    {
        if (request.File == null || request.File.Length == 0)
            return BadRequest("No file selected.");

        const long maxSize = 20 * 1024 * 1024;

        if (request.File.Length > maxSize)
            return BadRequest("Maximum file size is 20 MB.");

        var allowed = new[] { ".pdf", ".jpg", ".jpeg", ".png", ".docx" };

        var extension = Path.GetExtension(request.File.FileName).ToLowerInvariant();

        if (!allowed.Contains(extension))
            return BadRequest("Unsupported file type.");

        var matter = await _db.Matters
            .Include(m => m.Client)
            .FirstOrDefaultAsync(m => m.Id == request.MatterId);

        if (matter == null)
            return NotFound("Matter not found.");

        var uploadsRoot = Path.Combine(
            Directory.GetCurrentDirectory(),
            "uploads",
            "evidence");

        Directory.CreateDirectory(uploadsRoot);

        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsRoot, fileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await request.File.CopyToAsync(stream);
        }

        var document = new LegalDocument
        {
            Id = Guid.NewGuid(),
            MatterId = request.MatterId,
            Title = Path.GetFileNameWithoutExtension(request.File.FileName),
            DocumentType = "Evidence",
            Content = fileName,
            Status = "Uploaded",
            Version = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.LegalDocuments.Add(document);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            document.Id,
            document.Title,
            document.DocumentType,
            document.Status
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var document = await _db.LegalDocuments.FindAsync(id);

        if (document == null)
            return NotFound();

        if (document.DocumentType == "Evidence")
        {
            var path = Path.Combine(
                Directory.GetCurrentDirectory(),
                "uploads",
                "evidence",
                document.Content.Replace("<p>", "").Replace("</p>", "").Trim());

            if (System.IO.File.Exists(path))
                System.IO.File.Delete(path);
        }

        _db.LegalDocuments.Remove(document);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}


public class UploadEvidenceRequest
{
    public Guid MatterId { get; set; }
    public IFormFile File { get; set; } = default!;
}