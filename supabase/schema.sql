-- Esquema PostgreSQL para Supabase
-- Pipeline de Monitoreo SERCOP (Ecuador)

-- 1. Tabla de Procesos (historial completo y control de versiones por hash)
CREATE TABLE IF NOT EXISTS public.procesos (
    ocid TEXT PRIMARY KEY,
    hash_sha256 TEXT NOT NULL,
    title TEXT NOT NULL,
    buyer TEXT,
    region TEXT,
    amount NUMERIC(14, 2) DEFAULT 0.00,
    method TEXT,
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    raw_json JSONB
);

-- Índices de consulta frecuente para procesos
CREATE INDEX IF NOT EXISTS idx_procesos_hash ON public.procesos(hash_sha256);
CREATE INDEX IF NOT EXISTS idx_procesos_last_seen ON public.procesos(last_seen);
CREATE INDEX IF NOT EXISTS idx_procesos_region ON public.procesos(region);

-- 2. Tabla de Alertas (histórico de oportunidades disparadas al cliente)
CREATE TABLE IF NOT EXISTS public.alertas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ocid TEXT NOT NULL REFERENCES public.procesos(ocid) ON DELETE CASCADE,
    rubro TEXT NOT NULL,
    keywords TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    precio_anterior NUMERIC(14, 2),
    variacion_pct NUMERIC(8, 2),
    buyer TEXT,
    region TEXT,
    enviado_notificacion BOOLEAN DEFAULT FALSE,
    fecha_alerta TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para reportes y dashboards de alertas
CREATE INDEX IF NOT EXISTS idx_alertas_rubro ON public.alertas(rubro);
CREATE INDEX IF NOT EXISTS idx_alertas_fecha ON public.alertas(fecha_alerta DESC);
CREATE INDEX IF NOT EXISTS idx_alertas_ocid ON public.alertas(ocid);

-- 3. Habilitar Row Level Security (RLS) pero permitir acceso mediante service_role / anon key
ALTER TABLE public.procesos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura/escritura públicas o autenticadas según convenga
CREATE POLICY "Permitir lectura publica de procesos" ON public.procesos
    FOR SELECT USING (true);

CREATE POLICY "Permitir insercion/actualizacion con api key" ON public.procesos
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir lectura publica de alertas" ON public.alertas
    FOR SELECT USING (true);

CREATE POLICY "Permitir insercion de alertas" ON public.alertas
    FOR ALL USING (true) WITH CHECK (true);
