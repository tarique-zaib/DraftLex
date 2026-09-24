using DraftLex.Api.Services;
using DraftLex.Application.Features.Documents;
using DraftLex.Application.Features.Documents.DTOs;
using DraftLex.Application.Interfaces;
using DraftLex.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DraftLex.Api.Controllers;


[ApiController]
[Route("api/[controller]")]
public class DocumentsController : ControllerBase
{
    private readonly LegalDocumentService _service;
    private readonly PdfExportService _pdf;
    private readonly IDraftLexDbContext _db;

    public DocumentsController(LegalDocumentService service, PdfExportService pdf, IDraftLexDbContext db)
    {
        _service = service;
        _pdf = pdf;
        _db = db;
    }

    [HttpPost]
    public async Task<ActionResult<DocumentResponse>> Create(CreateDocumentRequest request)
    {
        var result = await _service.CreateAsync(request);

        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var document = await _db.LegalDocuments
            .Include(d => d.Matter)
            .ThenInclude(m => m.Client)
            .FirstOrDefaultAsync(d => d.Id == id);

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
        var updated = await _service.UpdateAsync(id, request);

        if (!updated)
            return NotFound();

        return NoContent();
    }

    [HttpPost("generate")]
    public async Task<IActionResult> Generate(
    [FromBody] GenerateDocumentRequest request)
    {
        var advocateName =
        User.FindFirst("name")?.Value ??
        User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ??
        User.Identity?.Name ??
        "Advocate";

        var document = await _service.GenerateAsync(request, advocateName);

        return Ok(new { id = document.Id });
    }

    [HttpGet("matter/{matterId:guid}")]
    public async Task<ActionResult<List<DocumentResponse>>> GetByMatter(Guid matterId)
    {
        var documents = await _service.GetByMatterAsync(matterId);
        return Ok(documents);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var documents = await _service.GetAllAsync();
        return Ok(documents);
    }

    [HttpGet("{id:guid}/pdf")]
    public async Task<IActionResult> ExportPdf(Guid id)
    {
        var document = await _db.LegalDocuments
            .Include(d => d.Matter)
            .ThenInclude(m => m.Client)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (document == null)
            return NotFound();

        var pdf = _pdf.Generate(document);

        return File(
            pdf,
            "application/pdf",
            $"{document.Title}.pdf");
    }
}