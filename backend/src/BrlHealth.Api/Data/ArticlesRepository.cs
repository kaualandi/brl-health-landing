using Dapper;

namespace BrlHealth.Api.Data;

// Mapeamento por propriedade (text[] chega como System.Array — evita o casamento
// estrito do construtor posicional do record).
public class ArticleListItem
{
    public string Id { get; set; } = "";
    public string Category { get; set; } = "";
    public string Emoji { get; set; } = "";
    public string Title { get; set; } = "";
    public string Excerpt { get; set; } = "";
    public string ReadTime { get; set; } = "";
    public string Author { get; set; } = "";
    public string[] Goals { get; set; } = [];
}

public sealed class ArticleFull : ArticleListItem
{
    /// <summary>Corpo do artigo em JSON (texto do JSONB).</summary>
    public string Body { get; set; } = "[]";
}

/// <summary>Conteúdo editorial (read-only). Queries parametrizadas.</summary>
public sealed class ArticlesRepository
{
    private readonly IDbConnectionFactory _factory;

    public ArticlesRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<IEnumerable<ArticleListItem>> GetAllAsync()
    {
        using var conn = _factory.Create();
        const string sql =
            @"SELECT id AS Id, category AS Category, emoji AS Emoji, title AS Title,
                     excerpt AS Excerpt, read_time AS ReadTime, author AS Author, goals AS Goals
              FROM articles ORDER BY id";
        return await conn.QueryAsync<ArticleListItem>(sql);
    }

    public async Task<ArticleFull?> GetByIdAsync(string id)
    {
        using var conn = _factory.Create();
        const string sql =
            @"SELECT id AS Id, category AS Category, emoji AS Emoji, title AS Title,
                     excerpt AS Excerpt, read_time AS ReadTime, author AS Author,
                     goals AS Goals, body::text AS Body
              FROM articles WHERE id = @Id";
        return await conn.QuerySingleOrDefaultAsync<ArticleFull>(sql, new { Id = id });
    }
}
