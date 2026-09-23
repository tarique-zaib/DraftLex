using DraftLex.Application.DTOs.Clients;
using DraftLex.Application.Interfaces;
using DraftLex.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace DraftLex.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientsController : ControllerBase
{
    private readonly ClientService _service;

    public ClientsController(ClientService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateClientRequest request)
    {
        var result = await _service.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var client = await _service.GetByIdAsync(id);

        if (client == null)
            return NotFound();

        return Ok(client);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, UpdateClientRequest request)
    {
        var updated = await _service.UpdateAsync(id, request);

        if (!updated)
            return NotFound();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _service.DeleteAsync(id);

        if (!deleted)
            return NotFound();

        return NoContent();
    }

    [HttpGet("{id:guid}/matters")]
    public async Task<IActionResult> GetMatters(Guid id)
    {
        var matters = await _service.GetMattersAsync(id);
        return Ok(matters);
    }

    [HttpGet("{id:guid}/hearings")]
    public async Task<IActionResult> GetHearings(Guid id)
    {
        var hearings = await _service.GetHearingsAsync(id);
        return Ok(hearings);
    }
}