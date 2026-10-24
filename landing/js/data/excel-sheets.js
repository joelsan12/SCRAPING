/**
 * LicitaciónYa — Datos para la Previsualización de Hojas Excel Semanales
 */
export const EXCEL_SHEETS_DATA = {
  oportunidades: {
    headers: ['Código Real', 'Entidad Contratante', 'Presupuesto USD', 'Provincia', 'Fase'],
    rows: [
      ['SIE-CELECEP-2026-04070-238940', 'CELEC EP — Termopichincha', '$1,750,208.57', 'Pichincha', '<span class="badge-phase badge-open">Abierta</span>'],
      ['LICO-EEASA-2026-010-3233', 'Empresa Eléctrica Ambato (EEASA)', '$115,753.64', 'Tungurahua', '<span class="badge-phase badge-open">Abierta</span>'],
      ['LICS-CNELEP-2026-006-462114', 'CNEL EP — Guayaquil', '$785,783.20', 'Guayas', '<span class="badge-phase badge-open">Abierta</span>'],
      ['CE-20260002974757-741823', 'EPMMOP — Quito', '$97,324.98', 'Pichincha', '<span class="badge-phase badge-recent">Adjudicada</span>']
    ],
    footer: 'Incluye hoja adicional de <strong>Resumen Geográfico y Análisis por Entidad</strong> para planificar despachos.'
  },
  geografico: {
    headers: ['Provincia', 'Procesos Detectados', 'Monto Acumulado USD', 'Entidad Principal', 'Estado Predominante'],
    rows: [
      ['Pichincha', '2 procesos', '$1,847,533.55', 'CELEC EP', '<span class="badge-phase badge-open">1 Abierta / 1 Adj.</span>'],
      ['Tungurahua', '1 proceso', '$115,753.64', 'Empresa Eléctrica Ambato', '<span class="badge-phase badge-open">Convocatoria Abierta</span>'],
      ['Guayas', '1 proceso', '$785,783.20', 'CNEL EP', '<span class="badge-phase badge-open">Convocatoria Abierta</span>']
    ],
    footer: 'Filtro territorial para optimizar viáticos, logística de entrega técnica y cobertura de su fuerza comercial.'
  },
  entidad: {
    headers: ['Entidad Contratante', 'Sector Institucional', 'Código del Proceso', 'Monto del Proceso', 'Fase'],
    rows: [
      ['CELEC EP — Termopichincha', 'Empresa Pública Eléctrica', 'SIE-CELECEP-2026-04070-238940', '$1,750,208.57', '<span class="badge-phase badge-open">Abierta</span>'],
      ['EEASA', 'Empresa Pública Eléctrica', 'LICO-EEASA-2026-010-3233', '$115,753.64', '<span class="badge-phase badge-open">Abierta</span>'],
      ['CNEL EP — Guayaquil', 'Distribución Energética', 'LICS-CNELEP-2026-006-462114', '$785,783.20', '<span class="badge-phase badge-open">Abierta</span>'],
      ['EPMMOP — Quito', 'Movilidad y Obras Públicas', 'CE-20260002974757-741823', '$97,324.98', '<span class="badge-phase badge-recent">Adjudicada</span>']
    ],
    footer: 'Ficha verificable de la entidad y del proceso de referencia publicado en el registro OCDS del SERCOP.'
  }
};
