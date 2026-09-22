using MediatR;

namespace DraftLex.Application.Features.Matters.GetById;

public record GetMatterByIdQuery(Guid Id)
    : IRequest<MatterDetailsResponse?>;