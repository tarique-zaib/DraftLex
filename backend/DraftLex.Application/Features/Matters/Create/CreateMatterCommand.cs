using MediatR;

namespace DraftLex.Application.Features.Matters.Create;

public record CreateMatterCommand(
    Guid ClientId,
    string Title,
    string MatterType,
    string Court,
    string CaseNumber,
    string JudgeName
) : IRequest<Guid>;