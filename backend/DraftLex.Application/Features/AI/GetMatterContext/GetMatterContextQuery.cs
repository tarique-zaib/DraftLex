using DraftLex.Application.Features.AI.DTOs;
using MediatR;

namespace DraftLex.Application.Features.AI.GetMatterContext;

public record GetMatterContextQuery(Guid MatterId)
    : IRequest<MatterContextDto?>;