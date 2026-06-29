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
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS nutritionists (
    id      TEXT PRIMARY KEY,
    name    TEXT NOT NULL,
    crn     TEXT NOT NULL,
    focus   TEXT NOT NULL,
    bio     TEXT,
    rating  NUMERIC(2,1),
    reviews INT,
    years   INT
);

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

-- Índices que previnem degradação das leituras de tracking/consulta (ver dívida DT-05).
CREATE INDEX IF NOT EXISTS ix_consultations_user ON consultations(user_id, date, time);
CREATE INDEX IF NOT EXISTS ix_weight_logs_user   ON weight_logs(user_id, date);
CREATE INDEX IF NOT EXISTS ix_water_logs_user    ON water_logs(user_id, date);
CREATE INDEX IF NOT EXISTS ix_sleep_logs_user    ON sleep_logs(user_id, date);
CREATE INDEX IF NOT EXISTS ix_step_logs_user     ON step_logs(user_id, date);
CREATE INDEX IF NOT EXISTS ix_measurements_user  ON measurements(user_id, date);
