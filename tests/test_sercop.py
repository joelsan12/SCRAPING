"""
Pruebas unitarias para el Pipeline SERCOP.
Verifica:
1. Normalización Unicode NFKC
2. Coerción estricta de Pydantic v2
3. Estabilidad y determinismo del Hash SHA-256
4. Deduplicación por hash y detección de diffs en SQLite
5. Motor de matching por rubro y palabras clave
6. Fábrica de persistencia dual (get_storage)
7. Generador de heartbeat de salud y telemetría
"""

import os
import pytest
from src.models import ProcesoSercop
from src.transform import normalizar_texto, calcular_hash_proceso, calcular_diff_precio
from src.storage import Storage, SqliteStorage, get_storage
from src.matcher import Matcher
from src.notify import Notifier

def test_normalizacion_nfkc():
    raw = "   CONSTRUCCIÓN   DE   ACERAS   "
    norm = normalizar_texto(raw)
    assert norm == "construcción de aceras"

    norm_sin_tildes = normalizar_texto("Hormigón Armado y Tubería", sin_tildes=True)
    assert norm_sin_tildes == "hormigon armado y tuberia"

def test_pydantic_coercion():
    data = {
        "id": 12345,
        "ocid": "ocds-test-001",
        "year": 2024,
        "amount": "$ 45,678.50",
        "budget": "50000",
        "title": "Adquisición de Cemento y Varillas",
        "suppliers": ["PROVEEDOR A", "PROVEEDOR B"],
        "buyer": "GAD MUNICIPAL",
    }
    proceso = ProcesoSercop.model_validate(data)
    assert proceso.amount == 45678.50
    assert proceso.budget == 50000.0
    assert proceso.suppliers == "PROVEEDOR A, PROVEEDOR B"
    assert "ocds-test-001" in proceso.url_portal

def test_hash_sha256_estabilidad():
    p1 = ProcesoSercop(
        id=1,
        ocid="ocds-test-01",
        year=2024,
        title="Compra de Cemento Selvalegre",
        buyer="Empresa Eléctrica",
        amount=15000.0,
    )
    p2 = ProcesoSercop(
        id=2,
        ocid="ocds-test-01",
        year=2024,
        title="  compra de cemento selvalegre  ",
        buyer="EMPRESA ELÉCTRICA",
        amount=15000.0,
    )
    assert calcular_hash_proceso(p1) == calcular_hash_proceso(p2)

    p3 = p1.model_copy(update={"amount": 16500.0})
    assert calcular_hash_proceso(p1) != calcular_hash_proceso(p3)

def test_storage_deduplicacion_y_diff(tmp_path):
    db_file = str(tmp_path / "test.db")
    storage = Storage(db_path=db_file)

    p = ProcesoSercop(
        id=1,
        ocid="ocds-xyz-100",
        year=2024,
        title="Provisión de Varilla Corrugada",
        buyer="Ministerio de Obras Públicas",
        amount=20000.0,
    )
    h1 = calcular_hash_proceso(p)

    hubo_cambio, monto_ant = storage.procesar_y_guardar(p, h1)
    assert hubo_cambio is True
    assert monto_ant is None

    hubo_cambio, monto_ant = storage.procesar_y_guardar(p, h1)
    assert hubo_cambio is False

    p_actualizado = p.model_copy(update={"amount": 25000.0})
    h2 = calcular_hash_proceso(p_actualizado)
    hubo_cambio, monto_ant = storage.procesar_y_guardar(p_actualizado, h2)
    assert hubo_cambio is True
    assert monto_ant == 20000.0

def test_storage_factory_selection(tmp_path):
    db_file = str(tmp_path / "custom.db")
    st = get_storage("sqlite", db_path=db_file)
    assert isinstance(st, SqliteStorage)
    assert st.db_path == db_file

    # Turso sin credenciales debe arrojar ValueError controlado
    with pytest.raises(ValueError, match="Credenciales de Turso no configuradas"):
        get_storage("turso", database_url="", auth_token="")

    # Supabase sin credenciales debe arrojar ValueError controlado
    with pytest.raises(ValueError, match="Credenciales de Supabase no configuradas"):
        get_storage("supabase", supabase_url="", supabase_key="")

def test_matcher_evaluacion():
    matcher = Matcher(config_path="config/rubros.yaml")

    proceso_construccion = ProcesoSercop(
        id=1,
        ocid="ocds-const-01",
        year=2024,
        title="Adquisición de Cemento Portland y Áridos",
        description="Materiales para pavimentación",
        buyer="GAD Cantonal",
        amount=12000.0,
    )

    alerta = matcher.evaluar_proceso(proceso_construccion, "ferreteria_construccion")
    assert alerta is not None
    assert "cemento" in alerta.keywords_detectadas
    assert alerta.amount == 12000.0

    proceso_medico = ProcesoSercop(
        id=2,
        ocid="ocds-med-02",
        year=2024,
        title="Compra de Medicamentos y Vacunas",
        buyer="Hospital del Día",
        amount=5000.0,
    )
    assert matcher.evaluar_proceso(proceso_medico, "ferreteria_construccion") is None

    proceso_pequeno = proceso_construccion.model_copy(update={"amount": 50.0})
    assert matcher.evaluar_proceso(proceso_pequeno, "ferreteria_construccion") is None

def test_notifier_heartbeat():
    notifier = Notifier()
    enviado = notifier.enviar_heartbeat(
        rubro="ferreteria_construccion",
        total_analizados=20,
        nuevos=3,
        alertas=2,
        errores=0,
        duracion_segundos=1.45,
        backend_nombre="sqlite",
        advertencias=["Prueba de advertencia"]
    )
    assert enviado is True
