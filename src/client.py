"""
Cliente HTTP resiliente para la API OCDS de SERCOP (Ecuador).
Implementa:
- Backoff exponencial con jitter (tenacity)
- Manejo específico de HTTP 429 respetando la cabecera 'Retry-After'
- Rotación de User-Agents legítimos
- Pausas controladas entre peticiones consecutivas
"""

import os
import time
import random
import logging
from typing import Dict, Any, Optional
import httpx
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception,
    before_sleep_log,
)
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("sercop.client")

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
]

class RateLimitException(Exception):
    """Excepción para forzar reintento ante HTTP 429 con tiempo de espera específico."""
    def __init__(self, retry_after: int = 15):
        self.retry_after = retry_after
        super().__init__(f"HTTP 429 Rate Limited. Reintentar tras {retry_after}s")

def es_error_reintentable(exception: BaseException) -> bool:
    """Identifica si el fallo es recuperable mediante reintento."""
    if isinstance(exception, RateLimitException):
        return True
    if isinstance(exception, (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.NetworkError)):
        return True
    if isinstance(exception, httpx.HTTPStatusError):
        # 429, 502, 503, 504 son reintentables
        return exception.response.status_code in (429, 502, 503, 504)
    return False

class SercopClient:
    def __init__(
        self,
        base_url: Optional[str] = None,
        delay_seconds: float = 3.2,
        timeout: float = 20.0,
    ):
        self.base_url = (base_url or os.getenv(
            "SERCOP_API_BASE_URL", 
            "https://datosabiertos.compraspublicas.gob.ec/PLATAFORMA/api"
        )).rstrip("/")
        self.delay_seconds = float(os.getenv("REQUEST_DELAY_SECONDS", str(delay_seconds)))
        self.timeout = float(os.getenv("REQUEST_TIMEOUT_SECONDS", str(timeout)))
        self._last_request_time = 0.0

    def _get_headers(self) -> Dict[str, str]:
        return {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "es-EC,es;q=0.9,en;q=0.8",
        }

    def _esperar_pausa_cortesia(self):
        """Garantiza el intervalo mínimo entre llamadas para no saturar al servidor."""
        ahora = time.time()
        tiempo_desde_ultima = ahora - self._last_request_time
        if tiempo_desde_ultima < self.delay_seconds:
            espera = (self.delay_seconds - tiempo_desde_ultima) + random.uniform(0.2, 0.8)
            time.sleep(espera)
        self._last_request_time = time.time()

    @retry(
        retry=retry_if_exception(es_error_reintentable),
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=2, min=3, max=30),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,
    )
    def _get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        self._esperar_pausa_cortesia()
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        with httpx.Client(timeout=self.timeout, headers=self._get_headers()) as client:
            resp = client.get(url, params=params)
            
            if resp.status_code == 429:
                retry_after_str = resp.headers.get("Retry-After")
                try:
                    retry_after = int(retry_after_str) if retry_after_str else 15
                except ValueError:
                    retry_after = 15
                # Sumar un pequeño jitter de cortesía
                espera_total = retry_after + random.uniform(1.0, 3.0)
                logger.warning(f"HTTP 429 recibido en {endpoint}. Respetando Retry-After ({espera_total:.1f}s)...")
                time.sleep(espera_total)
                raise RateLimitException(retry_after=int(espera_total))
                
            resp.raise_for_status()
            return resp.json()

    def search_ocds(
        self,
        year: int,
        search: Optional[str] = None,
        page: int = 1,
    ) -> Dict[str, Any]:
        """
        Consulta el listado de procesos OCDS por año, con filtro opcional de búsqueda y paginación.
        """
        params: Dict[str, Any] = {"year": year, "page": page}
        if search:
            params["search"] = search
            
        logger.debug(f"Consultando search_ocds: {params}")
        return self._get("search_ocds", params=params)

    def get_record(self, ocid: str) -> Dict[str, Any]:
        """
        Obtiene el detalle completo de un proceso mediante su OCID único.
        """
        logger.debug(f"Consultando record para OCID: {ocid}")
        return self._get("record", params={"ocid": ocid})
