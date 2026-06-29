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

-- Tracking (representativo): demais logs seguem o mesmo padrão (user_id + date).
CREATE TABLE IF NOT EXISTS weight_logs (
    id      BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date    DATE NOT NULL,
    weight_kg NUMERIC(5,1) NOT NULL
);

CREATE TABLE IF NOT EXISTS water_logs (
    id      BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date    DATE NOT NULL,
    cups    INT NOT NULL DEFAULT 0
);

-- Índices que previnem degradação das leituras de tracking/consulta (ver dívida DT-05).
CREATE INDEX IF NOT EXISTS ix_consultations_user ON consultations(user_id, date, time);
CREATE INDEX IF NOT EXISTS ix_weight_logs_user   ON weight_logs(user_id, date);
CREATE INDEX IF NOT EXISTS ix_water_logs_user    ON water_logs(user_id, date);
