using FluentValidation;

namespace DraftLex.Application.Features.Hearings.GetById;

public class GetHearingByIdValidator
    : AbstractValidator<GetHearingByIdQuery>
{
    public GetHearingByIdValidator()
    {
        RuleFor(x => x.HearingId).NotEmpty();
    }
}