using FluentValidation;

namespace DraftLex.Application.Features.AI.GenerateAffidavit;

public class GenerateAffidavitValidator
    : AbstractValidator<GenerateAffidavitQuery>
{
    public GenerateAffidavitValidator()
    {
        RuleFor(x => x.MatterId)
            .NotEmpty()
            .WithMessage("Matter Id is required.");
    }
}