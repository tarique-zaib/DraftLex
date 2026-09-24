using MediatR;

namespace DraftLex.Application.Features.AI.GenerateArguments;

public record GenerateArgumentsQuery(Guid MatterId)
    : IRequest<GenerateArgumentsResponse>;