using BrlHealth.Api.Endpoints;
using FluentValidation;

namespace BrlHealth.Api.Validation;

/// <summary>
/// Validadores de entrada (FluentValidation). Cobrem o formato/obrigatoriedade dos
/// campos antes do handler; regras de negócio que dependem do banco (e-mail único,
/// saldo, etc.) seguem no endpoint.
/// </summary>
public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Informe seu nome.");
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Informe o e-mail.")
            .EmailAddress().WithMessage("E-mail inválido.");
        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Informe a senha.")
            .MinimumLength(6).WithMessage("A senha precisa ter ao menos 6 caracteres.");
    }
}

public sealed class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().WithMessage("Informe o e-mail.");
        RuleFor(x => x.Password).NotEmpty().WithMessage("Informe a senha.");
    }
}

public sealed class ResetRequestValidator : AbstractValidator<ResetRequest>
{
    public ResetRequestValidator()
    {
        RuleFor(x => x.Token).NotEmpty().WithMessage("Link inválido ou expirado");
        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Informe a nova senha.")
            .MinimumLength(6).WithMessage("A senha precisa ter ao menos 6 caracteres.");
    }
}

public sealed class ConsentRequestValidator : AbstractValidator<ConsentRequest>
{
    public ConsentRequestValidator()
    {
        RuleFor(x => x.Document).NotEmpty().WithMessage("Documento e versão são obrigatórios.");
        RuleFor(x => x.Version).NotEmpty().WithMessage("Documento e versão são obrigatórios.");
    }
}
