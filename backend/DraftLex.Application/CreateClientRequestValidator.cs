using DraftLex.Application.DTOs.Clients;
using FluentValidation;

public class CreateClientRequestValidator
    : AbstractValidator<CreateClientRequest>
{
    public CreateClientRequestValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Mobile)
            .Matches(@"^[6-9]\d{9}$")
            .When(x => !string.IsNullOrWhiteSpace(x.Mobile));

        RuleFor(x => x.Email)
            .EmailAddress()
            .When(x => !string.IsNullOrWhiteSpace(x.Email));
    }
}