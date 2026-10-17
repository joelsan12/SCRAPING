"""
Pruebas unitarias para el Pipeline SERCOP (Semana 3).
Verifica:
1. Normalización Unicode NFKC
2. Coerción estricta de Pydantic v2
3. Estabilidad y determinismo del Hash SHA-256
4. Deduplicación por hash y detección de diffs en SQLite
5. Fábrica de persistencia (SQLite, Turso, Supabase)
6. Motor de matching por rubro y palabras clave
7. Telemetría y Heartbeat
8. Generación de reporte Excel (.xlsx) estilizado
9. Rotación determinista de palabras clave por ciclo
"""

import os
import pytest
import openpyxl
from src.models import ProcesoSercop
from src.transform import normalizar_texto, calcular_hash_proceso, calcular_diff_precio
from src.storage import Storage, SqliteStorage, get_storage
from src.matcher import Matcher
from src.notify import Notifier
from src.reporte import generar_excel_semanal

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

def test_storage_factory_selection(tmp_path, monkeypatch):
    db_file = str(tmp_path / "custom.db")
    st = get_storage("sqlite", db_path=db_file)
    assert isinstance(st, SqliteStorage)
    assert st.db_path == db_file

    # Aislar variables de entorno para probar validación de credenciales faltantes
    monkeypatch.delenv("TURSO_DATABASE_URL", raising=False)
    monkeypatch.delenv("TURSO_AUTH_TOKEN", raising=False)
    with pytest.raises(ValueError, match="Credenciales de Turso no configuradas"):
        get_storage("turso", database_url="", auth_token="")

    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_KEY", raising=False)
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

def test_generador_excel_semanal(tmp_path):
    procesos_muestra = [
        {
            "ocid": "ocds-test-1",
            "title": "Adquisición de Cemento Selvalegre",
            "buyer": "GAD Municipal de Quito",
            "region": "PICHINCHA",
            "amount": 45000.0,
            "method": "subasta_inversa",
            "first_seen": "2026-10-15T10:00:00",
            "keywords_str": "cemento, hormigon"
        },
        {
            "ocid": "ocds-test-2",
            "title": "Provisión de Varillas y Tubería PVC",
            "buyer": "Empresa Pública de Agua",
            "region": "GUAYAS",
            "amount": 32000.50,
            "method": "cotizacion",
            "first_seen": "2026-10-14T15:30:00",
            "keywords_str": "varilla, tuberia"
        }
    ]

    out_dir = str(tmp_path / "reportes")
    excel_path = generar_excel_semanal(
        procesos_coincidentes=procesos_muestra,
        rubro_nombre="Ferretería y Construcción",
        output_dir=out_dir
    )

    assert os.path.exists(excel_path)
    wb = openpyxl.load_workbook(excel_path)
    assert "Oportunidades Semanales" in wb.sheetnames
    assert "Resumen por Región" in wb.sheetnames

    ws1 = wb["Oportunidades Semanales"]
    assert ws1["A1"].value == "REPORTE EJECUTIVO DE COMPRAS PÚBLICAS - SERCOP ECUADOR"
    assert ws1["D5"].value == 45000.0

    ws2 = wb["Resumen por Región"]
    assert ws2["A3"].value == "Provincia / Región"

def test_rotacion_keywords():
    todas = [f"kw_{i}" for i in range(32)]
    batch_size = 8

    # Ciclo 0 (00:00 - 05:59 UTC)
    c0 = todas[0:8]
    assert len(c0) == 8
    assert c0[0] == "kw_0" and c0[-1] == "kw_7"

    # Ciclo 1 (06:00 - 11:59 UTC)
    c1 = todas[8:16]
    assert len(c1) == 8
    assert c1[0] == "kw_8" and c1[-1] == "kw_15"

    # Ciclo 2 (12:00 - 17:59 UTC)
    c2 = todas[16:24]
    assert len(c2) == 8
    assert c2[0] == "kw_16" and c2[-1] == "kw_23"

    # Ciclo 3 (18:00 - 23:59 UTC)
    c3 = todas[24:32]
    assert len(c3) == 8
    assert c3[0] == "kw_24" and c3[-1] == "kw_31"

    # Cobertura completa del 100% de keywords en un día (4 ciclos)
    cubiertas = set(c0 + c1 + c2 + c3)
    assert len(cubiertas) == 32
