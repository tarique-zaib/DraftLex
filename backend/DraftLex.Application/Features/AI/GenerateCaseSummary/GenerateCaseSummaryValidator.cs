using FluentValidation;

namespace DraftLex.Application.Features.AI.GenerateCaseSummary;

public class GenerateCaseSummaryValidator
    : AbstractValidator<GenerateCaseSummaryQuery>
{
    public GenerateCaseSummaryValidator()
    {
        RuleFor(x => x.MatterId)
            .NotEmpty()
            .WithMessage("Matter Id is required.");
    }
}