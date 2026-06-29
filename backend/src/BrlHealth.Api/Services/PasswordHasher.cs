using System.Security.Cryptography;

namespace BrlHealth.Api.Services;

/// <summary>
/// Hash de senha com PBKDF2 (SHA-256). Para a fase de produção (§7) a meta é
/// trocar por BCrypt/Argon2 — registrado como dívida. Aceita o hash placeholder
/// do seed de desenvolvimento (<c>$placeholder$&lt;senha&gt;</c>).
/// </summary>
public static class PasswordHasher
{
    private const int Iterations = 100_000;
    private const int SaltSize = 16;
    private const int KeySize = 32;
    private const string PlaceholderPrefix = "$placeholder$";

    public static string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var key = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlgorithmName.SHA256, KeySize);
        return $"pbkdf2${Iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(key)}";
    }

    public static bool Verify(string password, string stored)
    {
        if (stored.StartsWith(PlaceholderPrefix, StringComparison.Ordinal))
            return stored[PlaceholderPrefix.Length..] == password;

        var parts = stored.Split('$');
        if (parts.Length != 4 || parts[0] != "pbkdf2")
            return false;

        var iterations = int.Parse(parts[1]);
        var salt = Convert.FromBase64String(parts[2]);
        var expected = Convert.FromBase64String(parts[3]);
        var actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, expected.Length);
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }
}
