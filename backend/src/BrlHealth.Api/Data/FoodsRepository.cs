using Dapper;

namespace BrlHealth.Api.Data;

// Mapeamento por propriedade (não posicional): o Dapper materializa colunas
// text[] (que chegam como System.Array) sem o casamento estrito do construtor.
public sealed class FoodRow
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Emoji { get; set; } = "";
    public string Role { get; set; } = "";
    public string Portion { get; set; } = "";
    public int Kcal { get; set; }
    public int Protein { get; set; }
    public int Carb { get; set; }
    public int Fat { get; set; }
    public string[] Diets { get; set; } = [];
    public string[] ExcludedBy { get; set; } = [];
}

public sealed class MealRow
{
    public string Name { get; set; } = "";
    public string Emoji { get; set; } = "";
    public string DefaultTime { get; set; } = "";
    public decimal Weight { get; set; }
    public string[] Roles { get; set; } = [];
}

/// <summary>Catálogo de alimentos e tipos de refeição (read-only). Queries parametrizadas.</summary>
public sealed class FoodsRepository
{
    private readonly IDbConnectionFactory _factory;

    public FoodsRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<IEnumerable<FoodRow>> GetFoodsAsync()
    {
        using var conn = _factory.Create();
        const string sql =
            @"SELECT id AS Id, name AS Name, emoji AS Emoji, role AS Role, portion AS Portion,
                     kcal AS Kcal, protein AS Protein, carb AS Carb, fat AS Fat,
                     diets AS Diets, excluded_by AS ExcludedBy
              FROM foods ORDER BY role, id";
        return await conn.QueryAsync<FoodRow>(sql);
    }

    public async Task<IEnumerable<MealRow>> GetMealsAsync()
    {
        using var conn = _factory.Create();
        const string sql =
            @"SELECT name AS Name, emoji AS Emoji, default_time AS DefaultTime,
                     weight AS Weight, roles AS Roles
              FROM meals ORDER BY default_time";
        return await conn.QueryAsync<MealRow>(sql);
    }
}
