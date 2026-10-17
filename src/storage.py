"""
Capa de persistencia con arquitectura multi-backend:
- SqliteStorage: Persistencia local rápida con WAL mode (desarrollo local).
- TursoStorage: SQLite Cloud distribuido en el edge vía HTTP Pipeline (recomendado: 9 GB gratis, sin pausas).
- SupabaseStorage: Persistencia cloud en PostgreSQL vía REST.
- get_storage: Fábrica que selecciona el backend mediante STORAGE_BACKEND ('turso' | 'sqlite' | 'supabase').
"""

import os
import sqlite3
import json
import logging
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, timezone
import httpx
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception,
    before_sleep_log,
)
from src.models import ProcesoSercop, AlertaMatch

logger = logging.getLogger("sercop.storage")

def es_error_red_turso(exception: BaseException) -> bool:
    """Identifica errores transitorios de red o timeouts para reintentos con Turso."""
    if isinstance(exception, (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.NetworkError, httpx.PoolTimeout)):
        return True
    if isinstance(exception, httpx.HTTPStatusError):
        return exception.response.status_code in (429, 500, 502, 503, 504)
    return False


class BaseStorage(ABC):
    """Interfaz base para almacenamiento de procesos y alertas."""

    @abstractmethod
    def obtener_proceso(self, ocid: str) -> Optional[Dict[str, Any]]:
        """Busca un proceso existente por su OCID."""
        pass

    @abstractmethod
    def procesar_y_guardar(
        self, proceso: ProcesoSercop, nuevo_hash: str
    ) -> Tuple[bool, Optional[float]]:
        """
        Guarda o actualiza el proceso.
        Retorna (hubo_cambio, monto_anterior).
        - Si es nuevo: (True, None)
        - Si el hash cambió: (True, monto_anterior)
        - Si el hash es idéntico: (False, monto_actual)
        """
        pass

    @abstractmethod
    def registrar_alerta(self, alerta: AlertaMatch, enviado: bool = False) -> int:
        """Registra la alerta disparada en la tabla histórica."""
        pass

    @abstractmethod
    def obtener_procesos_recientes(self, dias: int = 7) -> List[Dict[str, Any]]:
        """Obtiene procesos registrados o actualizados para reportes semanales."""
        pass


class SqliteStorage(BaseStorage):
    """Implementación local basada en SQLite con soporte WAL."""

    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            db_path = os.getenv("DATABASE_PATH", "data/sercop.db")
        
        dir_name = os.path.dirname(db_path)
        if dir_name and not os.path.exists(dir_name):
            os.makedirs(dir_name, exist_ok=True)
            
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute("PRAGMA foreign_keys=ON;")
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            conn.executescript("""
            CREATE TABLE IF NOT EXISTS procesos (
                ocid TEXT PRIMARY KEY,
                hash_sha256 TEXT NOT NULL,
                title TEXT NOT NULL,
                buyer TEXT,
                region TEXT,
                amount REAL,
                method TEXT,
                first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                raw_json TEXT
            );

            CREATE TABLE IF NOT EXISTS alertas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ocid TEXT NOT NULL,
                rubro TEXT NOT NULL,
                keywords TEXT NOT NULL,
                amount REAL,
                precio_anterior REAL,
                variacion_pct REAL,
                buyer TEXT,
                region TEXT,
                enviado_notificacion BOOLEAN DEFAULT 0,
                fecha_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ocid) REFERENCES procesos(ocid)
            );

            CREATE INDEX IF NOT EXISTS idx_procesos_hash ON procesos(hash_sha256);
            CREATE INDEX IF NOT EXISTS idx_procesos_last_seen ON procesos(last_seen);
            CREATE INDEX IF NOT EXISTS idx_alertas_rubro ON alertas(rubro);
            """)
        logger.info(f"SQLite Storage inicializado en {self.db_path}")

    def obtener_proceso(self, ocid: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.execute(
                "SELECT ocid, hash_sha256, title, buyer, region, amount, method, first_seen, last_seen FROM procesos WHERE ocid = ?",
                (ocid,)
            )
            row = cursor.fetchone()
            if row:
                return dict(row)
        return None

    def procesar_y_guardar(
        self, proceso: ProcesoSercop, nuevo_hash: str
    ) -> Tuple[bool, Optional[float]]:
        existente = self.obtener_proceso(proceso.ocid)
        
        with self._get_connection() as conn:
            ahora = datetime.now(timezone.utc).isoformat()
            
            if not existente:
                conn.execute(
                    """
                    INSERT INTO procesos (ocid, hash_sha256, title, buyer, region, amount, method, first_seen, last_seen, raw_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        proceso.ocid,
                        nuevo_hash,
                        proceso.title,
                        proceso.buyer,
                        proceso.region,
                        proceso.amount,
                        proceso.method,
                        ahora,
                        ahora,
                        proceso.model_dump_json()
                    )
                )
                return True, None
            
            if existente["hash_sha256"] != nuevo_hash:
                monto_anterior = existente["amount"]
                conn.execute(
                    """
                    UPDATE procesos 
                    SET hash_sha256 = ?, title = ?, buyer = ?, region = ?, amount = ?, method = ?, last_seen = ?, raw_json = ?
                    WHERE ocid = ?
                    """,
                    (
                        nuevo_hash,
                        proceso.title,
                        proceso.buyer,
                        proceso.region,
                        proceso.amount,
                        proceso.method,
                        ahora,
                        proceso.model_dump_json(),
                        proceso.ocid
                    )
                )
                return True, monto_anterior
            else:
                conn.execute(
                    "UPDATE procesos SET last_seen = ? WHERE ocid = ?",
                    (ahora, proceso.ocid)
                )
                return False, existente["amount"]

    def registrar_alerta(self, alerta: AlertaMatch, enviado: bool = False) -> int:
        with self._get_connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO alertas (ocid, rubro, keywords, amount, precio_anterior, variacion_pct, buyer, region, enviado_notificacion)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    alerta.ocid,
                    alerta.rubro,
                    ", ".join(alerta.keywords_detectadas),
                    alerta.amount,
                    alerta.precio_anterior,
                    alerta.variacion_pct,
                    alerta.buyer,
                    alerta.region,
                    1 if enviado else 0
                )
            )
            return cursor.lastrowid

    def obtener_procesos_recientes(self, dias: int = 7) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.execute(
                """
                SELECT ocid, hash_sha256, title, buyer, region, amount, method, first_seen, last_seen, raw_json
                FROM procesos
                ORDER BY amount DESC
                LIMIT 500
                """
            )
            return [dict(r) for r in cursor.fetchall()]


class TursoStorage(BaseStorage):
    """Implementación de SQLite en la nube mediante la API HTTP Pipeline de Turso (LibSQL)."""

    def __init__(self, database_url: Optional[str] = None, auth_token: Optional[str] = None):
        raw_url = database_url or os.getenv("TURSO_DATABASE_URL", "").strip()
        self.auth_token = auth_token or os.getenv("TURSO_AUTH_TOKEN", "").strip()

        if not raw_url or not self.auth_token:
            raise ValueError(
                "Credenciales de Turso no configuradas. Defina TURSO_DATABASE_URL y TURSO_AUTH_TOKEN."
            )

        # Convertir libsql:// a https:// y apuntar al pipeline v2
        clean_url = raw_url.replace("libsql://", "https://").rstrip("/")
        if not clean_url.endswith("/v2/pipeline"):
            self.endpoint = f"{clean_url}/v2/pipeline"
        else:
            self.endpoint = clean_url

        self.headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
        self._init_db()
        logger.info(f"Turso Storage conectado exitosamente a {clean_url}")

    def _to_hrana_val(self, v: Any) -> Dict[str, Any]:
        if v is None:
            return {"type": "null"}
        if isinstance(v, bool):
            return {"type": "integer", "value": "1" if v else "0"}
        if isinstance(v, int):
            return {"type": "integer", "value": str(v)}
        if isinstance(v, float):
            return {"type": "float", "value": float(v)}
        return {"type": "text", "value": str(v)}

    def _parse_row(self, cols: List[Dict], row_vals: List[Dict]) -> Dict[str, Any]:
        d = {}
        for col, cell in zip(cols, row_vals):
            name = col["name"]
            val = cell.get("value")
            ctype = cell.get("type")
            if ctype == "null":
                d[name] = None
            elif ctype == "integer":
                d[name] = int(val)
            elif ctype == "float":
                d[name] = float(val)
            else:
                d[name] = val
        return d

    @retry(
        retry=retry_if_exception(es_error_red_turso),
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1.5, min=1, max=10),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,
    )
    def _execute(self, sql: str, params: Optional[List[Any]] = None) -> List[Dict[str, Any]]:
        stmt: Dict[str, Any] = {"sql": sql}
        if params:
            stmt["args"] = [self._to_hrana_val(p) for p in params]

        payload = {
            "requests": [
                {"type": "execute", "stmt": stmt},
                {"type": "close"}
            ]
        }

        with httpx.Client(timeout=15.0) as client:
            resp = client.post(self.endpoint, json=payload, headers=self.headers)
            resp.raise_for_status()
            data = resp.json()

        results = data.get("results", [])
        if not results:
            return []

        first_res = results[0]
        if first_res.get("type") != "ok":
            error_msg = first_res.get("error", {}).get("message", "Error desconocido en Turso")
            raise RuntimeError(f"Turso query error: {error_msg}")

        exec_res = first_res.get("response", {}).get("result", {})
        cols = exec_res.get("cols", [])
        rows = exec_res.get("rows", [])

        return [self._parse_row(cols, r) for r in rows]

    def _init_db(self):
        stmts = [
            """CREATE TABLE IF NOT EXISTS procesos (
                ocid TEXT PRIMARY KEY,
                hash_sha256 TEXT NOT NULL,
                title TEXT NOT NULL,
                buyer TEXT,
                region TEXT,
                amount REAL,
                method TEXT,
                first_seen TIMESTAMP,
                last_seen TIMESTAMP,
                raw_json TEXT
            );""",
            """CREATE TABLE IF NOT EXISTS alertas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ocid TEXT NOT NULL,
                rubro TEXT NOT NULL,
                keywords TEXT NOT NULL,
                amount REAL,
                precio_anterior REAL,
                variacion_pct REAL,
                buyer TEXT,
                region TEXT,
                enviado_notificacion INTEGER DEFAULT 0,
                fecha_alerta TIMESTAMP
            );""",
            "CREATE INDEX IF NOT EXISTS idx_procesos_hash ON procesos(hash_sha256);",
            "CREATE INDEX IF NOT EXISTS idx_procesos_last_seen ON procesos(last_seen);",
            "CREATE INDEX IF NOT EXISTS idx_alertas_rubro ON alertas(rubro);"
        ]
        requests = [{"type": "execute", "stmt": {"sql": s}} for s in stmts] + [{"type": "close"}]
        with httpx.Client(timeout=20.0) as client:
            resp = client.post(self.endpoint, json={"requests": requests}, headers=self.headers)
            resp.raise_for_status()

    def obtener_proceso(self, ocid: str) -> Optional[Dict[str, Any]]:
        sql = "SELECT ocid, hash_sha256, title, buyer, region, amount, method, first_seen, last_seen FROM procesos WHERE ocid = ?;"
        rows = self._execute(sql, [ocid])
        return rows[0] if rows else None

    def procesar_y_guardar(
        self, proceso: ProcesoSercop, nuevo_hash: str
    ) -> Tuple[bool, Optional[float]]:
        existente = self.obtener_proceso(proceso.ocid)
        ahora = datetime.now(timezone.utc).isoformat()

        if not existente:
            sql = """
            INSERT INTO procesos (ocid, hash_sha256, title, buyer, region, amount, method, first_seen, last_seen, raw_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """
            self._execute(sql, [
                proceso.ocid,
                nuevo_hash,
                proceso.title,
                proceso.buyer,
                proceso.region,
                proceso.amount,
                proceso.method,
                ahora,
                ahora,
                proceso.model_dump_json()
            ])
            return True, None

        if existente["hash_sha256"] != nuevo_hash:
            monto_anterior = existente["amount"]
            sql = """
            UPDATE procesos 
            SET hash_sha256 = ?, title = ?, buyer = ?, region = ?, amount = ?, method = ?, last_seen = ?, raw_json = ?
            WHERE ocid = ?;
            """
            self._execute(sql, [
                nuevo_hash,
                proceso.title,
                proceso.buyer,
                proceso.region,
                proceso.amount,
                proceso.method,
                ahora,
                proceso.model_dump_json(),
                proceso.ocid
            ])
            return True, monto_anterior
        else:
            sql = "UPDATE procesos SET last_seen = ? WHERE ocid = ?;"
            self._execute(sql, [ahora, proceso.ocid])
            return False, existente["amount"]

    def registrar_alerta(self, alerta: AlertaMatch, enviado: bool = False) -> int:
        ahora = datetime.now(timezone.utc).isoformat()
        sql = """
        INSERT INTO alertas (ocid, rubro, keywords, amount, precio_anterior, variacion_pct, buyer, region, enviado_notificacion, fecha_alerta)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """
        self._execute(sql, [
            alerta.ocid,
            alerta.rubro,
            ", ".join(alerta.keywords_detectadas),
            alerta.amount,
            alerta.precio_anterior,
            alerta.variacion_pct,
            alerta.buyer,
            alerta.region,
            1 if enviado else 0,
            ahora
        ])
        return 1

    def obtener_procesos_recientes(self, dias: int = 7) -> List[Dict[str, Any]]:
        sql = """
        SELECT ocid, hash_sha256, title, buyer, region, amount, method, first_seen, last_seen, raw_json
        FROM procesos
        ORDER BY amount DESC
        LIMIT 500;
        """
        return self._execute(sql)


class SupabaseStorage(BaseStorage):
    """Implementación Cloud basada en Supabase (PostgreSQL via REST)."""

    def __init__(self, supabase_url: Optional[str] = None, supabase_key: Optional[str] = None):
        self.url = supabase_url or os.getenv("SUPABASE_URL", "").strip()
        self.key = supabase_key or os.getenv("SUPABASE_KEY", "").strip()

        if not self.url or not self.key:
            raise ValueError(
                "Credenciales de Supabase no configuradas. Defina SUPABASE_URL y SUPABASE_KEY en las variables de entorno."
            )

        from supabase import create_client, Client
        self.client: Client = create_client(self.url, self.key)
        logger.info(f"Supabase Storage conectado exitosamente a {self.url}")

    def obtener_proceso(self, ocid: str) -> Optional[Dict[str, Any]]:
        try:
            resp = self.client.table("procesos").select(
                "ocid, hash_sha256, title, buyer, region, amount, method, first_seen, last_seen"
            ).eq("ocid", ocid).execute()
            if resp.data and len(resp.data) > 0:
                row = resp.data[0]
                if "amount" in row and row["amount"] is not None:
                    row["amount"] = float(row["amount"])
                return row
        except Exception as e:
            logger.error(f"Error consultando proceso en Supabase ({ocid}): {e}")
        return None

    def procesar_y_guardar(
        self, proceso: ProcesoSercop, nuevo_hash: str
    ) -> Tuple[bool, Optional[float]]:
        existente = self.obtener_proceso(proceso.ocid)
        ahora = datetime.now(timezone.utc).isoformat()

        if not existente:
            payload = {
                "ocid": proceso.ocid,
                "hash_sha256": nuevo_hash,
                "title": proceso.title,
                "buyer": proceso.buyer,
                "region": proceso.region,
                "amount": proceso.amount,
                "method": proceso.method,
                "first_seen": ahora,
                "last_seen": ahora,
                "raw_json": json.loads(proceso.model_dump_json())
            }
            try:
                self.client.table("procesos").insert(payload).execute()
                return True, None
            except Exception as e:
                logger.error(f"Error insertando proceso en Supabase ({proceso.ocid}): {e}")
                return False, None

        if existente["hash_sha256"] != nuevo_hash:
            monto_anterior = existente["amount"]
            update_payload = {
                "hash_sha256": nuevo_hash,
                "title": proceso.title,
                "buyer": proceso.buyer,
                "region": proceso.region,
                "amount": proceso.amount,
                "method": proceso.method,
                "last_seen": ahora,
                "raw_json": json.loads(proceso.model_dump_json())
            }
            try:
                self.client.table("procesos").update(update_payload).eq("ocid", proceso.ocid).execute()
                return True, monto_anterior
            except Exception as e:
                logger.error(f"Error actualizando proceso en Supabase ({proceso.ocid}): {e}")
                return False, monto_anterior
        else:
            try:
                self.client.table("procesos").update({"last_seen": ahora}).eq("ocid", proceso.ocid).execute()
            except Exception as e:
                logger.debug(f"Error menor actualizando last_seen en Supabase: {e}")
            return False, existente["amount"]

    def registrar_alerta(self, alerta: AlertaMatch, enviado: bool = False) -> int:
        payload = {
            "ocid": alerta.ocid,
            "rubro": alerta.rubro,
            "keywords": ", ".join(alerta.keywords_detectadas),
            "amount": alerta.amount,
            "precio_anterior": alerta.precio_anterior,
            "variacion_pct": alerta.variacion_pct,
            "buyer": alerta.buyer,
            "region": alerta.region,
            "enviado_notificacion": bool(enviado)
        }
        try:
            resp = self.client.table("alertas").insert(payload).execute()
            if resp.data and len(resp.data) > 0:
                return resp.data[0].get("id", 1)
        except Exception as e:
            logger.error(f"Error registrando alerta en Supabase ({alerta.ocid}): {e}")
        return 0

    def obtener_procesos_recientes(self, dias: int = 7) -> List[Dict[str, Any]]:
        try:
            resp = self.client.table("procesos").select(
                "ocid, hash_sha256, title, buyer, region, amount, method, first_seen, last_seen, raw_json"
            ).order("amount", desc=True).limit(500).execute()
            rows = resp.data or []
            for r in rows:
                if "amount" in r and r["amount"] is not None:
                    r["amount"] = float(r["amount"])
            return rows
        except Exception as e:
            logger.error(f"Error consultando procesos recientes en Supabase: {e}")
            return []


def get_storage(backend: Optional[str] = None, **kwargs) -> BaseStorage:
    """
    Fábrica de persistencia multi-backend.
    backend: 'turso' | 'sqlite' | 'supabase'
    """
    selected = (backend or os.getenv("STORAGE_BACKEND", "sqlite")).strip().lower()

    if selected == "turso":
        return TursoStorage(
            database_url=kwargs.get("database_url"),
            auth_token=kwargs.get("auth_token")
        )
    elif selected == "supabase":
        return SupabaseStorage(
            supabase_url=kwargs.get("supabase_url"),
            supabase_key=kwargs.get("supabase_key")
        )
    return SqliteStorage(db_path=kwargs.get("db_path"))


# Alias retrocompatible
Storage = SqliteStorage
