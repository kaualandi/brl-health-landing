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

-- Catálogo de alimentos (32, espelha src/lib/foods.ts). diets vazio = todas as dietas.
INSERT INTO foods (id, name, emoji, role, portion, kcal, protein, carb, fat, diets, excluded_by) VALUES
    ('frango',        'Frango grelhado',    '🍗', 'protein', '120 g',          200, 37,  0,  6, '{omnivore,lowcarb,mediterranean}', '{}'),
    ('patinho',       'Patinho moído',      '🥩', 'protein', '120 g',          230, 32,  0, 11, '{omnivore,lowcarb}', '{}'),
    ('tilapia',       'Filé de tilápia',    '🐟', 'protein', '140 g',          180, 36,  0,  3, '{omnivore,lowcarb,mediterranean}', '{}'),
    ('ovos',          'Ovos mexidos',       '🍳', 'protein', '2 unidades',     160, 13,  1, 11, '{omnivore,vegetarian,lowcarb,mediterranean}', '{egg}'),
    ('tofu',          'Tofu grelhado',      '🧈', 'protein', '150 g',          170, 17,  4, 10, '{omnivore,vegetarian,vegan}', '{}'),
    ('graobico',      'Grão-de-bico',       '🫘', 'protein', '100 g',          160,  9, 27,  3, '{vegetarian,vegan,mediterranean}', '{}'),
    ('lentilha',      'Lentilha cozida',    '🍲', 'protein', '150 g',          170, 13, 30,  1, '{vegetarian,vegan,mediterranean}', '{}'),
    ('arroz',         'Arroz integral',     '🍚', 'carb',    '4 col. de sopa', 160,  3, 34,  1, '{}', '{}'),
    ('batatadoce',    'Batata-doce',        '🍠', 'carb',    '150 g',          130,  2, 30,  0, '{}', '{}'),
    ('quinoa',        'Quinoa cozida',      '🌾', 'carb',    '100 g',          120,  4, 21,  2, '{}', '{}'),
    ('paointegral',   'Pão integral',       '🍞', 'carb',    '2 fatias',       140,  6, 24,  2, '{}', '{gluten}'),
    ('aveia',         'Aveia',              '🥣', 'carb',    '3 col. de sopa', 150,  5, 26,  3, '{}', '{gluten}'),
    ('macarrao',      'Macarrão integral',  '🍝', 'carb',    '120 g',          180,  7, 36,  1, '{}', '{gluten}'),
    ('brocolis',      'Brócolis no vapor',  '🥦', 'veg',     'à vontade',       40,  3,  6,  0, '{}', '{}'),
    ('salada',        'Salada verde',       '🥗', 'veg',     'à vontade',       30,  1,  4,  0, '{}', '{}'),
    ('abobrinha',     'Abobrinha refogada', '🥒', 'veg',     '1 xícara',        45,  2,  6,  1, '{}', '{}'),
    ('legumes',       'Legumes no vapor',   '🥕', 'veg',     '1 xícara',        60,  2, 11,  1, '{}', '{}'),
    ('banana',        'Banana',             '🍌', 'fruit',   '1 unidade',       90,  1, 23,  0, '{}', '{}'),
    ('maca',          'Maçã',               '🍎', 'fruit',   '1 unidade',       75,  0, 20,  0, '{}', '{}'),
    ('mamao',         'Mamão',              '🧡', 'fruit',   '1 fatia',         60,  1, 15,  0, '{}', '{}'),
    ('frutasverm',    'Frutas vermelhas',   '🫐', 'fruit',   '1 xícara',        70,  1, 16,  0, '{}', '{}'),
    ('laranja',       'Laranja',            '🍊', 'fruit',   '1 unidade',       65,  1, 16,  0, '{}', '{}'),
    ('abacate',       'Abacate',            '🥑', 'fat',     '1/2 unidade',    160,  2,  9, 15, '{}', '{}'),
    ('pastaamendoim', 'Pasta de amendoim',  '🥜', 'fat',     '1 col. de sopa', 100,  4,  3,  8, '{}', '{nuts}'),
    ('castanhas',     'Castanhas',          '🌰', 'fat',     '1 punhado',      180,  5,  6, 16, '{}', '{nuts}'),
    ('azeite',        'Azeite de oliva',    '🫒', 'fat',     '1 fio',           90,  0,  0, 10, '{}', '{}'),
    ('iogurte',       'Iogurte natural',    '🥛', 'dairy',   '1 pote',          90,  9, 12,  1, '{omnivore,vegetarian,mediterranean}', '{lactose}'),
    ('queijominas',   'Queijo minas',       '🧀', 'dairy',   '2 fatias',       140, 12,  3,  9, '{omnivore,vegetarian}', '{lactose}'),
    ('iogurtevegetal','Iogurte vegetal',    '🌱', 'dairy',   '1 pote',          80,  4, 12,  2, '{omnivore,vegetarian,vegan}', '{}'),
    ('cafe',          'Café sem açúcar',    '☕', 'drink',   '1 xícara',         5,  0,  0,  0, '{}', '{}'),
    ('chaverde',      'Chá verde',          '🍵', 'drink',   '1 xícara',         2,  0,  0,  0, '{}', '{}'),
    ('suco',          'Suco natural',       '🧃', 'drink',   '1 copo',          90,  1, 22,  0, '{}', '{}')
ON CONFLICT (id) DO NOTHING;

-- Tipos de refeição (8, espelha MEAL_OPTIONS + a composição de papéis de lib/foods.ts).
INSERT INTO meals (name, emoji, default_time, weight, roles) VALUES
    ('Café da manhã',   '☕',  '07:00', 1.0, '{protein,carb,fruit,drink}'),
    ('Lanche da manhã', '🍌',  '10:00', 0.5, '{fruit,fat}'),
    ('Almoço',          '🍽️', '12:30', 1.3, '{protein,carb,veg}'),
    ('Lanche da tarde', '🥪',  '16:00', 0.5, '{dairy,fruit}'),
    ('Pré-treino',      '⚡',  '17:30', 0.4, '{carb,fruit}'),
    ('Pós-treino',      '💪',  '19:00', 0.6, '{protein,carb}'),
    ('Jantar',          '🌙',  '20:30', 1.2, '{protein,carb,veg}'),
    ('Ceia',            '🍵',  '22:30', 0.4, '{dairy,fruit}')
ON CONFLICT (name) DO NOTHING;
