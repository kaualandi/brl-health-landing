using FluentValidation;

namespace BrlHealth.Api.Validation;

/// <summary>
/// Filtro de endpoint que valida o argumento do tipo <typeparamref name="T"/> com o
/// <see cref="IValidator{T}"/> registrado. Falha ⇒ <c>400</c> com
/// <c>{ errors: [...] }</c>, no mesmo formato dos demais endpoints. Centraliza a
/// validação de entrada server-side (§7).
/// </summary>
public sealed class ValidationFilter<T> : IEndpointFilter where T : class
{
    private readonly IValidator<T> _validator;

    public ValidationFilter(IValidator<T> validator) => _validator = validator;

    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var model = context.Arguments.OfType<T>().FirstOrDefault();
        if (model is not null)
        {
            var result = await _validator.ValidateAsync(model);
            if (!result.IsValid)
                return Results.BadRequest(new { errors = result.Errors.Select(e => e.ErrorMessage).ToArray() });
        }

        return await next(context);
    }
}
