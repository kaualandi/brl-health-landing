using Dapper;

namespace BrlHealth.Api.Data;

// Classe com get;set; (não record posicional): colunas text[] (goals/diets)
// chegam como System.Array e o Dapper as materializa por propriedade.
public sealed class NutritionistRow
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Avatar { get; set; } = "";
    public string Crn { get; set; } = "";
    public string Focus { get; set; } = "";
    public string Bio { get; set; } = "";
    public decimal Rating { get; set; }
    public int Reviews { get; set; }
    public int Years { get; set; }
    public string[] Goals { get; set; } = [];
    public string[] Diets { get; set; } = [];
}

/// <summary>Catálogo de nutricionistas (read-only). Espelha src/lib/nutritionists.ts.</summary>
public sealed class NutritionistsRepository
{
    private readonly IDbConnectionFactory _factory;

    public NutritionistsRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<IEnumerable<NutritionistRow>> GetAllAsync()
    {
        using var conn = _factory.Create();
        const string sql =
            @"SELECT id AS Id, name AS Name, avatar AS Avatar, crn AS Crn, focus AS Focus,
                     bio AS Bio, rating AS Rating, reviews AS Reviews, years AS Years,
                     goals AS Goals, diets AS Diets
              FROM nutritionists ORDER BY id";
        return await conn.QueryAsync<NutritionistRow>(sql);
    }
}
