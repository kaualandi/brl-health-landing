-- BRL Health — seed mínimo para bater com o front (conta demo, planos, nutricionistas).
-- A senha demo é '123456'; guardamos um hash placeholder de dev. No primeiro login
-- bem-sucedido a credencial é re-hasheada em BCrypt automaticamente (PasswordHasher.NeedsUpgrade).

INSERT INTO plans (id, name, monthly_price, rank, credits) VALUES
    ('free',   'Free',       0.00, 0, 1),
    ('pro',    'BRL Pro',   29.90, 1, 4),
    ('family', 'BRL Family',49.90, 2, 8)
ON CONFLICT (id) DO NOTHING;

INSERT INTO nutritionists (id, name, crn, focus, bio, rating, reviews, years, avatar, goals, diets) VALUES
    ('ana-prado',     'Ana Prado',     'CRN-3 12345', 'Emagrecimento e reeducação alimentar',
        'Ajuda a perder gordura sem dietas malucas, ajustando o plano à sua rotina.', 4.9, 212, 9,
        '👩🏻‍⚕️', '{lose,health}', '{omnivore,lowcarb,mediterranean}'),
    ('rafael-couto',  'Rafael Couto',  'CRN-4 23456', 'Nutrição esportiva e ganho de massa',
        'Foco em performance e hipertrofia — periodiza a dieta junto com o treino.', 4.8, 168, 7,
        '👨🏽‍⚕️', '{gain,performance,recomp}', '{omnivore,lowcarb}'),
    ('bianca-rios',   'Bianca Rios',   'CRN-1 34567', 'Alimentação vegetariana e vegana',
        'Monta planos 100% vegetais equilibrados, sem deixar nenhum nutriente pra trás.', 5.0, 143, 6,
        '👩🏾‍⚕️', '{health,recomp,lose}', '{vegetarian,vegan,mediterranean}'),
    ('diego-martins', 'Diego Martins', 'CRN-2 45678', 'Nutrição clínica e saúde metabólica',
        'Cuida de quem busca saúde no longo prazo — colesterol, glicemia e bem-estar.', 4.7, 97, 12,
        '🧑🏼‍⚕️', '{health,performance,gain}', '{omnivore,mediterranean,lowcarb}')
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

-- Conteúdo editorial (8 artigos, espelha ARTICLES de src/lib/nutri-content.ts).
-- body em JSONB; dollar-quoting ($$) dispensa escapar apóstrofos do texto.
INSERT INTO articles (id, category, emoji, title, excerpt, read_time, author, goals, body) VALUES
('proteina-quanto','Macros','🍗',
 $$Proteína: quanto você realmente precisa por dia$$,
 $$Esqueça os mitos. A conta é mais simples — e mais alta — do que te contaram.$$,
 '4 min','Equipe BRL Nutri','{gain,recomp,lose}',
 $$[{"paragraphs":["Proteína é o macronutriente mais subestimado de quem treina. Ela não só constrói músculo: também é o que mais sacia, o que mais protege sua massa magra num déficit e o que tem o maior gasto de energia pra ser digerido."]},{"heading":"A conta que funciona","paragraphs":["Pra maioria das pessoas ativas, a faixa que a literatura sustenta é de 1,6 a 2,2 g de proteína por quilo de peso corporal por dia. Quanto mais agressivo o objetivo (cutting puxado ou ganho de massa sério), mais perto do teto."],"bullets":["Emagrecendo: 2,0 g/kg — segura a massa magra enquanto a gordura sai.","Recomposição: ~1,9 g/kg — o ponto doce pra trocar gordura por músculo.","Ganhando massa: 1,8 g/kg já cobre, o resto é caloria e treino."]},{"heading":"Como bater na prática","paragraphs":["Distribua entre 3 e 5 refeições, com 25–40 g de proteína em cada. Comece o prato pela proteína: frango, ovos, peixe, carne, iogurte, tofu ou leguminosas. O resto se encaixa em volta.","O BRL Nutri já calcula sua meta exata de proteína a partir do seu peso e objetivo — é só seguir o número do seu plano."]}]$$::jsonb),
('lanches-pre-treino','Treino','🍌',
 $$5 lanches pré-treino que cabem na rotina (e no bolso)$$,
 $$Energia rápida sem peso no estômago. Da banana com pasta de amendoim ao iogurte.$$,
 '3 min','Equipe BRL Nutri','{performance,gain}',
 $$[{"paragraphs":["O pré-treino certo não precisa ser caro nem complicado. O objetivo é simples: carboidrato de fácil digestão pra ter energia, sem encher o estômago a ponto de atrapalhar o movimento."]},{"heading":"As opções","bullets":["Banana com uma colher de pasta de amendoim — clássico por um motivo.","Iogurte natural com aveia e mel.","Pão integral com ovo mexido, se tiver 40+ minutos antes.","Um punhado de tâmaras com castanhas pra treino mais curto.","Vitamina de banana com leite (ou bebida vegetal) e uma scoop de whey."]},{"heading":"Timing","paragraphs":["Refeição maior: 1h30 a 2h antes. Lanche leve: 30 a 45 minutos antes. Se você treina em jejum e se sente bem, ótimo — só garanta o resto das calorias e proteínas ao longo do dia."]}]$$::jsonb),
('ler-rotulos','Hábitos','🔎',
 $$Como ler rótulos sem cair em pegadinha de marketing$$,
 $$'Zero açúcar' nem sempre é o que parece. Aprenda a olhar a tabela do jeito certo.$$,
 '5 min','Equipe BRL Nutri','{}',
 $$[{"paragraphs":["A frente da embalagem é publicidade. A verdade está atrás, na tabela nutricional e na lista de ingredientes. Aprender a ler os dois te livra de 90% das pegadinhas."]},{"heading":"Olhe a porção, não o pacote","paragraphs":["Fabricantes adoram porções minúsculas pra fazer os números parecerem baixos. Confira quantas gramas é a porção declarada e compare com o quanto você realmente come."]},{"heading":"A lista de ingredientes não mente","paragraphs":["Os ingredientes vêm em ordem de quantidade. Se açúcar (ou seus apelidos: xarope de glicose, maltodextrina, dextrose) aparece nos primeiros, desconfie do 'fit' no rótulo."],"bullets":["'Zero açúcar' pode ter adoçante e ainda assim muita gordura/caloria.","'Integral' de verdade traz farinha integral como primeiro ingrediente.","'Light' só significa 25% menos de algo — não necessariamente saudável."]}]$$::jsonb),
('deficit-sem-fome','Emagrecimento','🥗',
 $$Déficit calórico sem passar fome: o guia honesto$$,
 $$Volume, fibra e proteína são seus amigos. Veja como montar pratos que saciam.$$,
 '6 min','Equipe BRL Nutri','{lose,recomp}',
 $$[{"paragraphs":["Emagrecer exige déficit calórico — comer menos do que gasta. Mas déficit não precisa ser sinônimo de fome. O truque é escolher alimentos que entregam muito volume e saciedade por poucas calorias."]},{"heading":"Os pilares da saciedade","bullets":["Proteína em toda refeição — é o macro que mais corta a fome.","Vegetais e folhas à vontade — enchem o prato com pouquíssimas calorias.","Fibra (aveia, leguminosas, frutas com casca) — digestão mais lenta, fome adiada.","Água antes das refeições — boa parte da 'fome' é sede disfarçada."]},{"heading":"Monte o prato","paragraphs":["Metade do prato de vegetais, um quarto de proteína, um quarto de carboidrato de qualidade. Esse formato simples resolve a maioria dos almoços e jantares sem precisar pesar nada.","Um déficit moderado (em torno de 15–20% abaixo do gasto) emagrece de forma sustentável e preserva músculo. É exatamente o ajuste que o BRL Nutri aplica no objetivo de perder gordura."]}]$$::jsonb),
('agua-hidratacao','Hidratação','💧',
 $$Você provavelmente bebe menos água do que pensa$$,
 $$Sinais de desidratação leve que sabotam seu treino e sua fome — e como corrigir.$$,
 '3 min','Equipe BRL Nutri','{}',
 $$[{"paragraphs":["Desidratação leve raramente dá sede óbvia. Ela aparece disfarçada: queda de energia no treino, dor de cabeça no fim da tarde e aquela 'fome' que some depois de um copo d'água."]},{"heading":"Sinais sutis","bullets":["Urina amarelo-escura (o ideal é amarelo-clarinho).","Cansaço e dificuldade de concentração à tarde.","Fome fora de hora — sede e fome usam o mesmo sinal cerebral."]},{"heading":"Quanto e como","paragraphs":["Uma referência prática é ~35 ml por quilo de peso por dia, mais um extra nos dias de treino. Espalhe ao longo do dia: um copo ao acordar, um antes de cada refeição e uma garrafa por perto. O BRL Nutri calcula sua meta de água e te ajuda a acompanhar."]}]$$::jsonb),
('fora-de-casa','Rotina','🍔',
 $$Comendo fora sem sair da meta$$,
 $$Restaurante, delivery, festa de aniversário. Estratégias pra cada situação real.$$,
 '5 min','Equipe BRL Nutri','{}',
 $$[{"paragraphs":["Plano que só funciona em casa não é plano, é prisão. A vida real tem restaurante, delivery e aniversário — e dá pra navegar todos sem culpa nem descarrilar."]},{"heading":"No restaurante","bullets":["Escolha a proteína primeiro, depois o acompanhamento.","Grelhados, assados e cozidos em vez de fritos e empanados.","Molho e queijo à parte — você controla a quantidade."]},{"heading":"No delivery e nas festas","paragraphs":["No delivery, monte o pedido como montaria o prato: uma boa proteína e algo de vegetal. Na festa, coma uma refeição decente antes pra não chegar faminto, aproveite o que vale a pena e volte ao normal na próxima refeição. Um dia não desfaz uma semana."]}]$$::jsonb),
('carbo-noite','Mitos','🌙',
 $$Carboidrato à noite engorda? A ciência responde$$,
 $$Spoiler: o que importa é o total do dia, não o relógio. Entenda o porquê.$$,
 '4 min','Equipe BRL Nutri','{}',
 $$[{"paragraphs":["O mito é forte: 'carbo à noite vira gordura'. Mas seu corpo não tem um relógio que liga o modo-engorda às 18h. O que determina ganho ou perda de peso é o balanço calórico do dia inteiro, não o horário."]},{"heading":"De onde veio a confusão","paragraphs":["À noite tendemos a comer por tédio, estresse ou sono ruim — e aí o total do dia estoura. O vilão não é o carboidrato no jantar; é a caloria extra que vem junto, geralmente sem fome real."]},{"heading":"O que fazer com isso","paragraphs":["Se carboidrato no jantar te ajuda a dormir melhor e a treinar de manhã com energia, mantenha. O importante é fechar o total de calorias e proteínas do dia. Distribuição é preferência pessoal, não regra metabólica."]}]$$::jsonb),
('proteina-vegetal','Plant-based','🌱',
 $$Proteína vegetal: como bater a meta sem carne$$,
 $$Combinações de leguminosas, grãos e tofu que fecham seu aminograma do dia.$$,
 '5 min','Equipe BRL Nutri','{}',
 $$[{"paragraphs":["Dá pra construir e manter músculo sem carne — só exige um pouco mais de intenção. A chave é variar as fontes ao longo do dia pra cobrir todos os aminoácidos essenciais."]},{"heading":"As melhores fontes","bullets":["Soja e derivados (tofu, tempeh, edamame, proteína de soja) — perfil completo.","Leguminosas: feijão, grão-de-bico, lentilha, ervilha.","Grãos integrais e pseudocereais como quinoa.","Suplemento de proteína vegetal pra fechar a meta nos dias corridos."]},{"heading":"Combinar é a estratégia","paragraphs":["Leguminosa + grão (arroz com feijão, por exemplo) se complementam e formam um aminograma completo. Você não precisa combinar na mesma refeição — ao longo do dia já resolve.","Mire um pouco mais alto na meta de proteína (a digestibilidade vegetal é levemente menor) e você fica coberto. No BRL Nutri, é só escolher o estilo vegetariano ou vegano no onboarding."]}]$$::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Catálogo de receitas (10, espelha RECIPES_CATALOG de src/lib/nutri-content.ts).
-- dollar-quoting ($r$) dispensa escapar apóstrofos; arrays via ARRAY[...]::text[].
INSERT INTO recipes (id, title, emoji, category, excerpt, prep_time, kcal, protein, carbs, fat, servings, diet, goals, ingredients, steps, tags) VALUES
($r$frango-batata-doce-brocolis$r$, $r$Frango grelhado com batata-doce e brócolis$r$, $r$🍗$r$, $r$Almoço$r$, $r$O prato pós-treino clássico: proteína magra, carbo de qualidade e fibra. Pronto em 25 minutos.$r$, $r$25 min$r$, 520, 45, 50, 15, 1, $r$omnivore$r$, ARRAY[$r$gain$r$, $r$recomp$r$]::text[], ARRAY[$r$180 g de filé de frango$r$, $r$200 g de batata-doce$r$, $r$1 xícara de brócolis em buquês$r$, $r$1 colher de chá de azeite$r$, $r$Sal, pimenta-do-reino e alho a gosto$r$, $r$Suco de meio limão$r$]::text[], ARRAY[$r$Tempere o frango com sal, pimenta, alho e o suco de limão e deixe descansar por 10 minutos.$r$, $r$Cozinhe a batata-doce em cubos na água por 12–15 minutos, até ficar macia, e escorra.$r$, $r$Grelhe o frango na frigideira com o azeite, cerca de 4 minutos de cada lado, até dourar.$r$, $r$Cozinhe o brócolis no vapor por 4 minutos pra manter a cor e a crocância.$r$, $r$Monte o prato e finalize com mais um fio de azeite, se quiser.$r$]::text[], ARRAY[$r$Alta proteína$r$, $r$Pós-treino$r$]::text[]),
($r$panqueca-banana-aveia$r$, $r$Panqueca de banana e aveia$r$, $r$🥞$r$, $r$Café da manhã$r$, $r$Três ingredientes, zero farinha refinada. Energia pra começar o dia ou antes do treino.$r$, $r$15 min$r$, 380, 20, 54, 10, 2, $r$vegetarian$r$, ARRAY[$r$performance$r$]::text[], ARRAY[$r$2 bananas maduras$r$, $r$2 ovos$r$, $r$1 xícara de aveia em flocos$r$, $r$1 colher de chá de canela$r$, $r$1 pitada de sal$r$, $r$Mel ou frutas pra finalizar (opcional)$r$]::text[], ARRAY[$r$Amasse as bananas e misture com os ovos até virar um creme.$r$, $r$Acrescente a aveia, a canela e o sal e mexa bem; deixe descansar 5 minutos pra encorpar.$r$, $r$Aqueça uma frigideira antiaderente e coloque porções da massa.$r$, $r$Doure cerca de 2 minutos de cada lado, com cuidado ao virar.$r$, $r$Sirva com frutas ou um fio de mel por cima.$r$]::text[], ARRAY[$r$Sem farinha$r$, $r$Rápido$r$]::text[]),
($r$bowl-grao-de-bico-quinoa$r$, $r$Bowl de grão-de-bico, quinoa e tahine$r$, $r$🥗$r$, $r$Almoço$r$, $r$Refeição vegana completa, rica em fibra e proteína vegetal, com molho de tahine cremoso.$r$, $r$20 min$r$, 480, 20, 62, 16, 1, $r$vegan$r$, ARRAY[$r$health$r$, $r$lose$r$]::text[], ARRAY[$r$1/2 xícara de quinoa$r$, $r$1 xícara de grão-de-bico cozido$r$, $r$1 punhado de folhas verdes$r$, $r$1/2 pepino em cubos$r$, $r$1 colher de sopa de tahine$r$, $r$Suco de limão, água, sal e cominho a gosto$r$]::text[], ARRAY[$r$Cozinhe a quinoa em duas partes de água por cerca de 12 minutos, até a água secar.$r$, $r$Refogue o grão-de-bico com sal e cominho por 5 minutos.$r$, $r$Misture o tahine com suco de limão, sal e água até virar um molho cremoso.$r$, $r$Monte o bowl com a quinoa, o grão-de-bico, as folhas e o pepino.$r$, $r$Regue com o molho de tahine e sirva.$r$]::text[], ARRAY[$r$Vegano$r$, $r$Rico em fibra$r$]::text[]),
($r$salmao-assado-aspargos$r$, $r$Salmão assado com aspargos$r$, $r$🐟$r$, $r$Jantar$r$, $r$Jantar low carb em uma assadeira só: ômega-3 do salmão e aspargos no azeite e limão.$r$, $r$20 min$r$, 460, 38, 8, 31, 1, $r$lowcarb$r$, ARRAY[$r$lose$r$, $r$recomp$r$]::text[], ARRAY[$r$1 posta de salmão (170 g)$r$, $r$1 maço de aspargos$r$, $r$1 colher de sopa de azeite$r$, $r$Raspas e suco de meio limão$r$, $r$Sal, pimenta e alho a gosto$r$]::text[], ARRAY[$r$Pré-aqueça o forno a 200 °C.$r$, $r$Tempere o salmão com sal, pimenta, alho e raspas de limão.$r$, $r$Disponha o salmão e os aspargos numa assadeira e regue com o azeite.$r$, $r$Asse por 12–15 minutos, até o salmão soltar lascas com facilidade.$r$, $r$Finalize com o suco de limão na hora de servir.$r$]::text[], ARRAY[$r$Low carb$r$, $r$Ômega-3$r$]::text[]),
($r$salada-mediterranea-atum$r$, $r$Salada mediterrânea de atum e grão-de-bico$r$, $r$🫒$r$, $r$Almoço$r$, $r$Sem fogão: atum, grão-de-bico, tomate e azeitona com um toque de azeite extravirgem.$r$, $r$10 min$r$, 450, 32, 30, 22, 1, $r$mediterranean$r$, ARRAY[$r$health$r$]::text[], ARRAY[$r$1 lata de atum em água, escorrido$r$, $r$1 xícara de grão-de-bico cozido$r$, $r$1 tomate em cubos$r$, $r$1/4 de cebola roxa fatiada$r$, $r$Azeitonas pretas a gosto$r$, $r$1 colher de sopa de azeite extravirgem e suco de limão$r$]::text[], ARRAY[$r$Escorra bem o atum e o grão-de-bico.$r$, $r$Numa tigela, junte o atum, o grão-de-bico, o tomate, a cebola e as azeitonas.$r$, $r$Tempere com azeite, suco de limão, sal e pimenta.$r$, $r$Misture com cuidado e sirva em seguida ou gelado.$r$]::text[], ARRAY[$r$Mediterrâneo$r$, $r$Sem fogão$r$]::text[]),
($r$ovos-mexidos-abacate-pao$r$, $r$Ovos mexidos com abacate e pão integral$r$, $r$🍳$r$, $r$Café da manhã$r$, $r$Café da manhã salgado que sacia: gordura boa do abacate e proteína dos ovos.$r$, $r$10 min$r$, 420, 22, 28, 24, 1, $r$omnivore$r$, ARRAY[$r$recomp$r$, $r$health$r$]::text[], ARRAY[$r$3 ovos$r$, $r$1/2 abacate (ou avocado)$r$, $r$1 fatia de pão integral$r$, $r$1 colher de chá de manteiga$r$, $r$Sal, pimenta e cebolinha a gosto$r$]::text[], ARRAY[$r$Bata os ovos com sal e pimenta.$r$, $r$Derreta a manteiga em fogo baixo e mexa os ovos sem parar até ficarem cremosos.$r$, $r$Torre o pão integral.$r$, $r$Amasse o abacate sobre a torrada e tempere com sal e pimenta.$r$, $r$Sirva os ovos ao lado e finalize com cebolinha.$r$]::text[], ARRAY[$r$Rápido$r$, $r$Gordura boa$r$]::text[]),
($r$iogurte-proteico-granola$r$, $r$Iogurte proteico com granola e frutas vermelhas$r$, $r$🫐$r$, $r$Lanche$r$, $r$Lanche da tarde montado em 5 minutos: proteína do iogurte, crocância e antioxidantes.$r$, $r$5 min$r$, 320, 24, 38, 8, 1, $r$vegetarian$r$, ARRAY[$r$gain$r$, $r$recomp$r$]::text[], ARRAY[$r$1 pote de iogurte natural desnatado (170 g)$r$, $r$1 scoop de whey ou 2 colheres de iogurte grego$r$, $r$3 colheres de sopa de granola$r$, $r$1/2 xícara de frutas vermelhas$r$, $r$1 colher de chá de mel (opcional)$r$]::text[], ARRAY[$r$Misture o iogurte com o whey (ou o grego) até ficar homogêneo.$r$, $r$Coloque numa tigela ou copo.$r$, $r$Cubra com a granola e as frutas vermelhas.$r$, $r$Finalize com mel, se quiser um toque doce.$r$]::text[], ARRAY[$r$Alta proteína$r$, $r$Sem fogão$r$]::text[]),
($r$tofu-mexido-legumes$r$, $r$Tofu mexido com legumes$r$, $r$🍳$r$, $r$Jantar$r$, $r$A versão vegana do ovo mexido: tofu temperado com cúrcuma e legumes salteados.$r$, $r$20 min$r$, 360, 24, 22, 19, 1, $r$vegan$r$, ARRAY[$r$lose$r$]::text[], ARRAY[$r$200 g de tofu firme$r$, $r$1/2 cebola picada$r$, $r$1/2 pimentão em tiras$r$, $r$1 xícara de abobrinha em cubos$r$, $r$1 colher de chá de cúrcuma$r$, $r$1 colher de sopa de azeite, sal e pimenta a gosto$r$]::text[], ARRAY[$r$Esfarele o tofu com as mãos ou um garfo.$r$, $r$Refogue a cebola no azeite até dourar.$r$, $r$Acrescente o pimentão e a abobrinha e salteie por 5 minutos.$r$, $r$Junte o tofu e a cúrcuma, tempere com sal e pimenta e refogue por mais 5 minutos.$r$, $r$Sirva quente, com cebolinha por cima se quiser.$r$]::text[], ARRAY[$r$Vegano$r$, $r$Low carb$r$]::text[]),
($r$mousse-abacate-cacau$r$, $r$Mousse de abacate com cacau$r$, $r$🍫$r$, $r$Sobremesa fit$r$, $r$Sobremesa cremosa sem laticínio nem açúcar refinado: abacate, cacau e tâmara.$r$, $r$10 min$r$, 240, 5, 20, 16, 2, $r$vegan$r$, ARRAY[$r$health$r$]::text[], ARRAY[$r$1 abacate maduro$r$, $r$2 colheres de sopa de cacau em pó 100%$r$, $r$3 tâmaras sem caroço (ou mel)$r$, $r$1/4 de xícara de bebida vegetal$r$, $r$1 pitada de sal$r$]::text[], ARRAY[$r$Bata todos os ingredientes no liquidificador ou processador até ficar liso.$r$, $r$Prove e ajuste o doce com mais uma tâmara, se precisar.$r$, $r$Distribua em potinhos.$r$, $r$Leve à geladeira por pelo menos 30 minutos antes de servir.$r$]::text[], ARRAY[$r$Sem açúcar$r$, $r$Vegano$r$]::text[]),
($r$escondidinho-carne-couve-flor$r$, $r$Escondidinho de carne com purê de couve-flor$r$, $r$🥩$r$, $r$Jantar$r$, $r$O conforto do escondidinho na versão low carb: purê de couve-flor no lugar da mandioca.$r$, $r$35 min$r$, 430, 35, 18, 25, 2, $r$lowcarb$r$, ARRAY[$r$recomp$r$, $r$gain$r$]::text[], ARRAY[$r$300 g de patinho moído$r$, $r$1 couve-flor média$r$, $r$1/2 cebola e 2 dentes de alho picados$r$, $r$2 colheres de sopa de molho de tomate$r$, $r$2 colheres de sopa de requeijão ou creme de leite$r$, $r$Azeite, sal, pimenta e noz-moscada a gosto$r$]::text[], ARRAY[$r$Cozinhe a couve-flor no vapor até ficar bem macia e bata com o requeijão, sal e noz-moscada até virar um purê.$r$, $r$Refogue a cebola e o alho no azeite, junte a carne e doure bem.$r$, $r$Acrescente o molho de tomate, tempere e cozinhe por 5 minutos.$r$, $r$Numa travessa, coloque a carne embaixo e cubra com o purê de couve-flor.$r$, $r$Leve ao forno a 200 °C por 10 minutos pra gratinar e sirva.$r$]::text[], ARRAY[$r$Low carb$r$, $r$Conforto$r$]::text[])
ON CONFLICT (id) DO NOTHING;
