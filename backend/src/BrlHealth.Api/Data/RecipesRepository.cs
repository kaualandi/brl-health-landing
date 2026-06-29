using Dapper;

namespace BrlHealth.Api.Data;

// Mapeamento por propriedade (não posicional): colunas text[] chegam como
// System.Array e o Dapper as materializa sem o casamento estrito do construtor.
public sealed class RecipeRow
{
    public string Id { get; set; } = "";
    public string Title { get; set; } = "";
    public string Emoji { get; set; } = "";
    public string Category { get; set; } = "";
    public string Excerpt { get; set; } = "";
    public string PrepTime { get; set; } = "";
    public int Kcal { get; set; }
    public int Protein { get; set; }
    public int Carbs { get; set; }
    public int Fat { get; set; }
    public int Servings { get; set; }
    public string Diet { get; set; } = "";
    public string[] Goals { get; set; } = [];
    public string[] Ingredients { get; set; } = [];
    public string[] Steps { get; set; } = [];
    public string[] Tags { get; set; } = [];
}

/// <summary>Catálogo de receitas (read-only), espelha RECIPES_CATALOG de lib/nutri-content.ts.</summary>
public sealed class RecipesRepository
{
    private readonly IDbConnectionFactory _factory;

    public RecipesRepository(IDbConnectionFactory factory) => _factory = factory;

    private const string Columns =
        @"id AS Id, title AS Title, emoji AS Emoji, category AS Category, excerpt AS Excerpt,
          prep_time AS PrepTime, kcal AS Kcal, protein AS Protein, carbs AS Carbs, fat AS Fat,
          servings AS Servings, diet AS Diet, goals AS Goals,
          ingredients AS Ingredients, steps AS Steps, tags AS Tags";

    public async Task<IEnumerable<RecipeRow>> GetAllAsync()
    {
        using var conn = _factory.Create();
        var sql = $"SELECT {Columns} FROM recipes ORDER BY category, id";
        return await conn.QueryAsync<RecipeRow>(sql);
    }

    public async Task<RecipeRow?> GetByIdAsync(string id)
    {
        using var conn = _factory.Create();
        var sql = $"SELECT {Columns} FROM recipes WHERE id = @Id";
        return await conn.QuerySingleOrDefaultAsync<RecipeRow>(sql, new { Id = id });
    }
}
