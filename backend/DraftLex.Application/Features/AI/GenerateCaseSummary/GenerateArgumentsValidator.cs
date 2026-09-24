using DraftLex.Application.Features.AI.GenerateCaseSummary;
using FluentValidation;

namespace DraftLex.Application.Features.AI.GenerateArguments;

public class GenerateArgumentsValidator
    : AbstractValidator<GenerateArgumentsQuery>
{
    public GenerateArgumentsValidator()
    {
        RuleFor(x => x.MatterId)
            .NotEmpty()
            .WithMessage("Matter Id is required.");
    }
}