using System.Data;
using Dapper;

namespace BrlHealth.Api.Data;

/// <summary>
/// Ensina o Dapper a passar/ler <see cref="DateOnly"/> em colunas <c>date</c> do
/// Postgres (a versão do Dapper não trata DateOnly nativamente como parâmetro).
/// </summary>
public sealed class DateOnlyTypeHandler : SqlMapper.TypeHandler<DateOnly>
{
    public override void SetValue(IDbDataParameter parameter, DateOnly value)
    {
        parameter.Value = value.ToDateTime(TimeOnly.MinValue);
        parameter.DbType = DbType.Date;
    }

    public override DateOnly Parse(object value) => DateOnly.FromDateTime((DateTime)value);
}
