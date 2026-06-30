-- BRL Health — schema do banco (PostgreSQL). Derivado dos mocks/tipos do front.
-- Todas as escritas da API usam Dapper com parâmetros @Parametro.

CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nutri_profiles (
    user_id      BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    sex          TEXT NOT NULL,
    age          INT  NOT NULL,
    height_cm    NUMERIC(5,1) NOT NULL,
    weight_kg    NUMERIC(5,1) NOT NULL,
    target_kg    NUMERIC(5,1),
    goal         TEXT NOT NULL,
    activity     TEXT NOT NULL,
    diet         TEXT NOT NULL,
    restrictions TEXT[] NOT NULL DEFAULT '{}',
    meals_per_day INT NOT NULL DEFAULT 3,
    water_glasses INT NOT NULL DEFAULT 8,
    meals        JSONB NOT NULL DEFAULT '[]',
    wake_time    TEXT,
    train_time   TEXT,
    sleep_time   TEXT
);

-- Planos: rank define a ordem (free < pro < family) para regra de upgrade/downgrade.
CREATE TABLE IF NOT EXISTS plans (
    id            TEXT PRIMARY KEY,           -- 'free' | 'pro' | 'family'
    name          TEXT NOT NULL,
    monthly_price NUMERIC(8,2) NOT NULL,
    rank          INT NOT NULL,
    credits       INT NOT NULL                -- consultas incluídas no plano
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id                 BIGSERIAL PRIMARY KEY,
    user_id            BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id            TEXT NOT NULL REFERENCES plans(id),
    status             TEXT NOT NULL DEFAULT 'active',
    has_pending_charge BOOLEAN NOT NULL DEFAULT FALSE,
    current_period_end DATE,
    stripe_customer_id TEXT,                    -- id do Customer no Stripe (p/ o portal de assinatura)
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);
-- Para bancos já criados antes desta coluna:
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE TABLE IF NOT EXISTS nutritionists (
    id      TEXT PRIMARY KEY,
    name    TEXT NOT NULL,
    crn     TEXT NOT NULL,
    focus   TEXT NOT NULL,
    bio     TEXT,
    rating  NUMERIC(2,1),
    reviews INT,
    years   INT,
    avatar  TEXT,                          -- emoji placeholder até ter foto real
    goals   TEXT[] NOT NULL DEFAULT '{}',  -- objetivos com que mais combina (recomendação)
    diets   TEXT[] NOT NULL DEFAULT '{}'   -- estilos de dieta que domina
);
-- Para bancos já criados antes destas colunas:
ALTER TABLE nutritionists ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE nutritionists ADD COLUMN IF NOT EXISTS goals TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE nutritionists ADD COLUMN IF NOT EXISTS diets TEXT[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS consultations (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nutritionist_id TEXT NOT NULL REFERENCES nutritionists(id),
    date            DATE NOT NULL,
    time            TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'scheduled',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------
-- Cardápio: catálogo de alimentos e tipos de refeição (espelha lib/foods.ts e lib/meals.ts)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS foods (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    emoji       TEXT,
    role        TEXT NOT NULL,                 -- protein|carb|veg|fruit|fat|dairy|drink
    portion     TEXT NOT NULL,
    kcal        INT NOT NULL,
    protein     INT NOT NULL,
    carb        INT NOT NULL,
    fat         INT NOT NULL,
    diets       TEXT[] NOT NULL DEFAULT '{}',  -- vazio = aceito em todas as dietas
    excluded_by TEXT[] NOT NULL DEFAULT '{}'   -- restrições que excluem o alimento
);

CREATE TABLE IF NOT EXISTS meals (
    name         TEXT PRIMARY KEY,
    emoji        TEXT,
    default_time TEXT NOT NULL,
    weight       NUMERIC(3,1) NOT NULL,        -- peso relativo na distribuição de kcal
    roles        TEXT[] NOT NULL DEFAULT '{}'  -- papéis de alimento que compõem a refeição
);

-- Catálogo de receitas (espelha RECIPES_CATALOG de lib/nutri-content.ts), página /receitas.
CREATE TABLE IF NOT EXISTS recipes (
    id          TEXT PRIMARY KEY,             -- slug
    title       TEXT NOT NULL,
    emoji       TEXT,
    category    TEXT NOT NULL,                -- Café da manhã | Almoço | Lanche | Jantar | Sobremesa fit
    excerpt     TEXT NOT NULL,
    prep_time   TEXT NOT NULL,                -- ex.: '25 min'
    kcal        INT NOT NULL,
    protein     INT NOT NULL,                 -- macros por porção (g)
    carbs       INT NOT NULL,
    fat         INT NOT NULL,
    servings    INT NOT NULL DEFAULT 1,
    diet        TEXT NOT NULL,                -- omnivore|vegetarian|vegan|lowcarb|mediterranean
    goals       TEXT[] NOT NULL DEFAULT '{}', -- objetivos indicados (vazio = todos)
    ingredients TEXT[] NOT NULL DEFAULT '{}',
    steps       TEXT[] NOT NULL DEFAULT '{}',
    tags        TEXT[] NOT NULL DEFAULT '{}'
);

-- Conteúdo editorial (espelha lib/nutri-content.ts). body = seções em JSONB.
CREATE TABLE IF NOT EXISTS articles (
    id        TEXT PRIMARY KEY,                -- slug
    category  TEXT NOT NULL,
    emoji     TEXT,
    title     TEXT NOT NULL,
    excerpt   TEXT NOT NULL,
    read_time TEXT NOT NULL,
    author    TEXT NOT NULL,
    goals     TEXT[] NOT NULL DEFAULT '{}',    -- objetivos relevantes (vazio = todos)
    body      JSONB NOT NULL DEFAULT '[]'      -- [{heading?, paragraphs?, bullets?}]
);

-- ------------------------------------------------------------------
-- Tracking diário (um registro por user_id + date, upsert na escrita)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS water_logs (
    id      BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date    DATE NOT NULL,
    ml      INT NOT NULL DEFAULT 0,
    UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS weight_logs (
    id        BIGSERIAL PRIMARY KEY,
    user_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date      DATE NOT NULL,
    weight_kg NUMERIC(5,1) NOT NULL,
    UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS sleep_logs (
    id      BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date    DATE NOT NULL,
    hours   NUMERIC(4,1) NOT NULL,
    UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS step_logs (
    id      BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date    DATE NOT NULL,
    count   INT NOT NULL DEFAULT 0,
    UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS measurements (
    id      BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date    DATE NOT NULL,
    waist   NUMERIC(5,1),
    hip     NUMERIC(5,1),
    chest   NUMERIC(5,1),
    arm     NUMERIC(5,1),
    thigh   NUMERIC(5,1),
    UNIQUE (user_id, date)
);

-- Hábitos e diário de refeições marcados no dia (mapa item -> bool em JSONB).
CREATE TABLE IF NOT EXISTS habit_logs (
    id      BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date    DATE NOT NULL,
    done    JSONB NOT NULL DEFAULT '{}',
    UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS meal_logs (
    id      BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date    DATE NOT NULL,
    done    JSONB NOT NULL DEFAULT '{}',
    UNIQUE (user_id, date)
);

-- ------------------------------------------------------------------
-- Captação e telemetria
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
    id         BIGSERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    subject    TEXT NOT NULL,
    message    TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS waitlist (
    id         BIGSERIAL PRIMARY KEY,
    email      TEXT NOT NULL UNIQUE,
    source     TEXT NOT NULL DEFAULT 'fit',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics_events (
    id         BIGSERIAL PRIMARY KEY,
    event      TEXT NOT NULL,
    props      JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------
-- Auth real (§7): refresh tokens rotativos e tokens enviados por e-mail.
-- Guardamos apenas o hash do segredo — o valor em claro só existe no cliente.
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,           -- SHA-256 do refresh token
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,                     -- preenchido na rotação/logout
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose     TEXT NOT NULL,                 -- 'reset' (link) | 'verify' (código 6 dígitos)
    token_hash  TEXT NOT NULL,                 -- SHA-256 do token/código
    expires_at  TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,                    -- preenchido ao usar ou ao emitir um novo
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- LGPD: registro de consentimento (versão do documento aceita pelo titular).
CREATE TABLE IF NOT EXISTS consent_records (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document    TEXT NOT NULL,                 -- 'termos' | 'privacidade' | ...
    version     TEXT NOT NULL,                 -- versão/data do documento aceito
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices que previnem degradação das leituras de tracking/consulta (ver dívida DT-05).
CREATE INDEX IF NOT EXISTS ix_consultations_user ON consultations(user_id, date, time);
CREATE INDEX IF NOT EXISTS ix_weight_logs_user   ON weight_logs(user_id, date);
CREATE INDEX IF NOT EXISTS ix_water_logs_user    ON water_logs(user_id, date);
CREATE INDEX IF NOT EXISTS ix_sleep_logs_user    ON sleep_logs(user_id, date);
CREATE INDEX IF NOT EXISTS ix_step_logs_user     ON step_logs(user_id, date);
CREATE INDEX IF NOT EXISTS ix_measurements_user  ON measurements(user_id, date);
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS ix_email_tokens_lookup ON email_tokens(purpose, token_hash);
CREATE INDEX IF NOT EXISTS ix_consent_records_user ON consent_records(user_id);
