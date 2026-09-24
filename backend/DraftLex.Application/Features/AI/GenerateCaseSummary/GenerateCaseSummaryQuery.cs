using MediatR;

namespace DraftLex.Application.Features.AI.GenerateCaseSummary;

public record GenerateCaseSummaryQuery(Guid MatterId)
    : IRequest<GenerateCaseSummaryResponse>;