using DraftLex.Application.Features.Documents;
using DraftLex.Application.Features.Documents.DTOs;
using DraftLex.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DraftLex.Api.Controllers;


[ApiController]
[Route("api/[controller]")]
public class DocumentsController : ControllerBase
{
    private readonly LegalDocumentService _service;

    public DocumentsController(LegalDocumentService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<ActionResult<DocumentResponse>> Create(CreateDocumentRequest request)
    {
        var result = await _service.CreateAsync(request);

        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DocumentResponse>> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);

        if (result == null)
            return NotFound();

        return Ok(result);
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
        var document = await _service.GenerateAsync(request);

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
}