using System.Security.Cryptography;

namespace BrlHealth.Api.Services;

/// <summary>
/// Hash de senha. A partir da fase de auth real (§7) o algoritmo padrão é
/// <b>BCrypt</b> (work factor 12). O <see cref="Verify"/> continua aceitando os
/// hashes legados — PBKDF2 (formato <c>pbkdf2$iter$salt$key</c>) e o placeholder
/// do seed de dev (<c>$placeholder$&lt;senha&gt;</c>) — para uma migração
/// transparente: quem loga com hash antigo continua entrando e
/// <see cref="NeedsUpgrade"/> sinaliza o re-hash em BCrypt no próximo login.
/// </summary>
public static class PasswordHasher
{
    private const int WorkFactor = 12;
    private const string PlaceholderPrefix = "$placeholder$";
    private const string Pbkdf2Prefix = "pbkdf2$";
    private const string BcryptPrefix = "$2"; // $2a$ / $2b$ / $2y$

    public static string Hash(string password) =>
        BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);

    public static bool Verify(string password, string stored)
    {
        if (string.IsNullOrEmpty(stored))
            return false;

        // Hash de desenvolvimento do seed (nunca usado em produção).
        if (stored.StartsWith(PlaceholderPrefix, StringComparison.Ordinal))
            return stored[PlaceholderPrefix.Length..] == password;

        // Hash legado PBKDF2 — mantido para login de contas anteriores à migração.
        if (stored.StartsWith(Pbkdf2Prefix, StringComparison.Ordinal))
            return VerifyPbkdf2(password, stored);

        // Hash atual: BCrypt.
        try
        {
            return BCrypt.Net.BCrypt.Verify(password, stored);
        }
        catch (BCrypt.Net.SaltParseException)
        {
            return false;
        }
    }

    /// <summary>
    /// Indica que o hash armazenado não é BCrypt (placeholder/PBKDF2) e deve ser
    /// reescrito em BCrypt após um login bem-sucedido.
    /// </summary>
    public static bool NeedsUpgrade(string stored) =>
        !stored.StartsWith(BcryptPrefix, StringComparison.Ordinal);

    private static bool VerifyPbkdf2(string password, string stored)
    {
        var parts = stored.Split('$');
        if (parts.Length != 4 || parts[0] != "pbkdf2")
            return false;

        if (!int.TryParse(parts[1], out var iterations))
            return false;

        var salt = Convert.FromBase64String(parts[2]);
        var expected = Convert.FromBase64String(parts[3]);
        var actual = Rfc2898DeriveBytes.Pbkdf2(
            password, salt, iterations, HashAlgorithmName.SHA256, expected.Length);
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }
}
