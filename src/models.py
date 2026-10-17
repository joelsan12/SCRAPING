"""
Modelos de datos estrictos para el Pipeline de SERCOP con Pydantic v2.
Asegura validación de tipos, coerción limpia de montos y campos robustos.
"""

from typing import List, Optional, Any, Union
from datetime import datetime, timezone
from pydantic import BaseModel, Field, field_validator, ConfigDict

class ProcesoSercop(BaseModel):
    """Representa un proceso de contratación pública obtenido desde search_ocds."""
    model_config = ConfigDict(str_strip_whitespace=True)

    id: Union[int, str]
    ocid: str
    year: int
    month: Optional[int] = None
    method: Optional[str] = Field(default="desconocido")
    internal_type: Optional[str] = Field(default="")
    locality: Optional[str] = Field(default="")
    region: Optional[str] = Field(default="NACIONAL")
    suppliers: Optional[Union[str, List[Any]]] = Field(default="")
    buyer: Optional[str] = Field(default="Entidad no especificada")
    amount: float = Field(default=0.0, ge=0.0)
    budget: Optional[float] = Field(default=0.0)
    date: Optional[str] = None
    title: str = Field(default="Proceso de compra pública")
    description: Optional[str] = Field(default="")

    @field_validator("title", mode="before")
    @classmethod
    def parse_titulo(cls, v: Any) -> str:
        if not v:
            return "Proceso de contratación pública"
        return str(v).strip()

    @field_validator("amount", "budget", mode="before")
    @classmethod
    def parse_monto(cls, v: Any) -> float:
        if v is None or v == "":
            return 0.0
        if isinstance(v, (int, float)):
            return float(v)
        if isinstance(v, str):
            # Limpiar formatos comunes: $ 12,345.67
            limpio = v.replace("$", "").replace(",", "").strip()
            try:
                return float(limpio)
            except ValueError:
                return 0.0
        return 0.0

    @field_validator("suppliers", mode="before")
    @classmethod
    def normalizar_proveedores(cls, v: Any) -> str:
        if v is None:
            return ""
        if isinstance(v, list):
            return ", ".join(str(item) for item in v if item)
        return str(v).strip()

    @property
    def url_portal(self) -> str:
        """Enlace directo al proceso en el portal de compras públicas."""
        # Si el ocid tiene código de proceso ecuatoriano
        return f"https://datosabiertos.compraspublicas.gob.ec/PLATAFORMA/proceso/{self.ocid}"

class ItemProceso(BaseModel):
    """Detalle de un ítem/producto específico dentro de un pliego."""
    id: str
    description: str
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    total_price: Optional[float] = None

class AlertaMatch(BaseModel):
    """Estructura de la alerta que se notifica al cliente."""
    ocid: str
    rubro: str
    title: str
    description: str
    buyer: str
    region: str
    amount: float
    precio_anterior: Optional[float] = None
    variacion_pct: Optional[float] = None
    keywords_detectadas: List[str]
    fecha_proceso: Optional[str] = None
    hash_proceso: str
    url_portal: str
    fecha_creacion_alerta: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
