/**
 * LicitaciónYa — Compilador Modular de Landing Page
 * Ensambla los componentes semánticos de landing/sections/ en landing/index.html
 */
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const LANDING_DIR = path.join(ROOT_DIR, 'landing');
const SECTIONS_DIR = path.join(LANDING_DIR, 'sections');
const OUTPUT_FILE = path.join(LANDING_DIR, 'index.html');

const SECTIONS = [
  'navbar.html',
  'hero.html',
  'metrics.html',
  'rubros.html',
  'entregables.html',
  'comparativa.html',
  'metodologia.html',
  'calculadora.html',
  'precios.html',
  'faq.html',
  'footer.html',
  'modal.html'
];

function build() {
  console.log('⚡ Iniciando compilación modular de LicitaciónYa...');

  const startTime = Date.now();

  let bodyContent = '';
  for (const file of SECTIONS) {
    const filePath = path.join(SECTIONS_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Error: Sección no encontrada: ${file}`);
      process.exit(1);
    }
    const content = fs.readFileSync(filePath, 'utf8').trim();
    bodyContent += `\n  ${content}\n`;
    console.log(`  ✓ Sección cargada: ${file}`);
  }

  const html = `<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LicitaciónYa | Monitoreo B2B de Contratación Pública SERCOP Ecuador</title>
  <meta name="description"
    content="Servicio corporativo de monitoreo y analítica de compras públicas SERCOP en Ecuador. Alertas a WhatsApp por rubro exacto y reporte ejecutivo en Excel cada lunes a las 8:00 AM.">

  <!-- Favicon & Canonical Link -->
  <link rel="icon" type="image/svg+xml" href="favicon.svg">
  <link rel="canonical" href="https://licitacionya.pages.dev">

  <!-- Open Graph / WhatsApp Rich Preview Metadata -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://licitacionya.pages.dev">
  <meta property="og:title" content="LicitaciónYa | Monitoreo B2B de Contratación Pública SERCOP Ecuador">
  <meta property="og:description"
    content="Auditoría continua de compras públicas SERCOP en Ecuador cada 6 horas. Alertas a WhatsApp por rubro exacto y reporte en Excel los lunes a las 8:00 AM.">
  <meta property="og:image" content="https://licitacionya.pages.dev/og-image.png">
  <meta property="og:locale" content="es_EC">

  <!-- Twitter Card Metadata -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="LicitaciónYa | Monitoreo B2B SERCOP Ecuador">
  <meta name="twitter:description"
    content="Alertas automatizadas a WhatsApp y matriz ejecutiva en Excel semanal con licitaciones afines a su inventario.">
  <meta name="twitter:image" content="https://licitacionya.pages.dev/og-image.png">

  <!-- Self-Hosted Local Fonts (Zero External Dependencies) -->
  <link rel="stylesheet" href="css/fonts.css">

  <!-- Parallel Modular CSS -->
  <link rel="stylesheet" href="css/tokens.css?v=20261023_v1">
  <link rel="stylesheet" href="css/base.css?v=20261023_v1">
  <link rel="stylesheet" href="css/components/buttons.css?v=20261023_v1">
  <link rel="stylesheet" href="css/components/navbar.css?v=20261023_v1">
  <link rel="stylesheet" href="css/components/hero.css?v=20261023_v1">
  <link rel="stylesheet" href="css/components/industries.css?v=20261023_v1">
  <link rel="stylesheet" href="css/components/demo-cards.css?v=20261023_v1">
  <link rel="stylesheet" href="css/components/comparison.css?v=20261023_v1">
  <link rel="stylesheet" href="css/components/steps.css?v=20261023_v1">
  <link rel="stylesheet" href="css/components/calculator.css?v=20261023_v1">
  <link rel="stylesheet" href="css/components/pricing.css?v=20261023_v1">
  <link rel="stylesheet" href="css/components/faq.css?v=20261023_v1">
  <link rel="stylesheet" href="css/components/footer.css?v=20261023_v1">
  <link rel="stylesheet" href="css/components/modal.css?v=20261023_v1">

  <!-- Structured Data: Organization & FAQPage Schema -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://licitacionya.pages.dev/#organization",
        "name": "LicitaciónYa Ecuador",
        "url": "https://licitacionya.pages.dev",
        "logo": "https://licitacionya.pages.dev/og-image.png",
        "description": "Plataforma B2B de inteligencia y monitoreo automatizado de contratación pública SERCOP en Ecuador.",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "EC"
        }
      },
      {
        "@type": "FAQPage",
        "@id": "https://licitacionya.pages.dev/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "¿Es legal este servicio de monitoreo?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Totalmente legal y transparente. Consumimos exclusivamente la API oficial de Datos Abiertos del Sistema Nacional de Contratación Pública bajo el estándar internacional OCDS. No intervenimos en los sistemas del Estado ni usamos credenciales privadas."
            }
          },
          {
            "@type": "Question",
            "name": "¿Por qué pagar si el portal del SERCOP es público?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "El portal es público pero buscar manualmente consume horas, suele ralentizarse y las licitaciones cierran etapas de preguntas con plazos perentorios. Dedicar a un colaborador a buscar a mano cuesta más de $500/mes y se escapan procesos. LicitaciónYa inspecciona cada 6 horas y le avisa directo a su WhatsApp."
            }
          },
          {
            "@type": "Question",
            "name": "¿Cómo funciona la prueba gratis de 15 días?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Configuramos sus palabras clave y su WhatsApp sin costo inicial. Durante dos semanas recibe alertas reales y dos reportes en Excel. Si al terminar no comprueba valor comercial, el servicio concluye sin compromiso."
            }
          },
          {
            "@type": "Question",
            "name": "¿Emiten factura autorizada por el SRI?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Sí. Todos los pagos se facturan electrónicamente con autorización del SRI, siendo 100% deducibles de impuestos como gasto operativo de inteligencia comercial."
            }
          }
        ]
      }
    ]
  }
  </script>
</head>

<body>
${bodyContent}
  <!-- Modular ES Modules Entry Point -->
  <script type="module" src="js/main.js?v=20261023_v1"></script>
</body>

</html>
`;

  fs.writeFileSync(OUTPUT_FILE, html, 'utf8');
  const duration = Date.now() - startTime;
  console.log(`✅ Compilación exitosa en ${duration}ms!`);
  console.log(`📄 Archivo generado: ${OUTPUT_FILE} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`);
}

build();
