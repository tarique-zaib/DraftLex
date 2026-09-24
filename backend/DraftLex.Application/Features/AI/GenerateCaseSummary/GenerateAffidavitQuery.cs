using DraftLex.Application.Features.AI.GenerateCaseSummary;
using MediatR;

namespace DraftLex.Application.Features.AI.GenerateAffidavit;

public record GenerateAffidavitQuery(Guid MatterId)
    : IRequest<GenerateAffidavitResponse>;