-- BRL Health — seed mínimo para bater com o front (conta demo, planos, nutricionistas).
-- A senha demo é '123456'; aqui guardamos um hash placeholder (troca por BCrypt na fase de auth real).

INSERT INTO plans (id, name, monthly_price, rank, credits) VALUES
    ('free',   'Free',       0.00, 0, 1),
    ('pro',    'BRL Pro',   29.90, 1, 4),
    ('family', 'BRL Family',49.90, 2, 8)
ON CONFLICT (id) DO NOTHING;

INSERT INTO nutritionists (id, name, crn, focus, bio, rating, reviews, years) VALUES
    ('ana-prado',     'Ana Prado',     'CRN-3 12345', 'Emagrecimento e reeducação alimentar',
        'Ajuda a perder gordura sem dietas malucas, ajustando o plano à sua rotina.', 4.9, 212, 9),
    ('rafael-couto',  'Rafael Couto',  'CRN-4 23456', 'Nutrição esportiva e ganho de massa',
        'Foco em performance e hipertrofia — periodiza a dieta junto com o treino.', 4.8, 168, 7),
    ('bianca-rios',   'Bianca Rios',   'CRN-1 34567', 'Alimentação vegetariana e vegana',
        'Monta planos 100% vegetais equilibrados, sem deixar nenhum nutriente pra trás.', 5.0, 143, 6),
    ('diego-martins', 'Diego Martins', 'CRN-2 45678', 'Nutrição clínica e saúde metabólica',
        'Cuida de quem busca saúde no longo prazo — colesterol, glicemia e bem-estar.', 4.7, 97, 12)
ON CONFLICT (id) DO NOTHING;

-- Conta demo (demo@brl.com / 123456) e sua assinatura Free.
INSERT INTO users (id, name, email, password_hash, email_verified) VALUES
    (1, 'Usuário Demo', 'demo@brl.com', '$placeholder$123456', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subscriptions (user_id, plan_id, status, has_pending_charge) VALUES
    (1, 'free', 'active', FALSE)
ON CONFLICT (user_id) DO NOTHING;

-- Mantém a sequência de users à frente do id fixo do seed.
SELECT setval(pg_get_serial_sequence('users', 'id'), GREATEST((SELECT MAX(id) FROM users), 1));
