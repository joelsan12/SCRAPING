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
  'entregables.html',
  'rubros.html',
  'metodologia.html',
  'comparativa.html',
  'calculadora.html',
  'precios.html',
  'faq.html',
  'footer.html',
  'modal.html'
];

const HEADER_SECTIONS = new Set(['navbar.html']);
const TAIL_SECTIONS = new Set(['footer.html', 'modal.html']);

function build() {
  console.log('⚡ Iniciando compilación modular de LicitaciónYa...');

  const startTime = Date.now();

  let headerContent = '';
  let mainContent = '';
  let tailContent = '';

  for (const file of SECTIONS) {
    const filePath = path.join(SECTIONS_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Error: Sección no encontrada: ${file}`);
      process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf8').trim();
    if (HEADER_SECTIONS.has(file)) {
      headerContent += `\n  ${content}\n`;
    } else if (TAIL_SECTIONS.has(file)) {
      tailContent += `\n  ${content}\n`;
    } else {
      mainContent += `\n  ${content}\n`;
    }
    console.log(`  ✓ Sección cargada: ${file}`);
  }

  const html = `<!DOCTYPE html>
<html lang="es-EC">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LicitaciónYa | Radar de compras públicas SERCOP Ecuador</title>
  <meta name="description"
    content="Monitoreo de compras públicas SERCOP cada 6 horas. Fichas con código, entidad, monto, provincia y enlace al pliego. Reporte Excel los lunes a las 08:00 ECT.">
  <meta name="theme-color" content="#F7F5EF">

  <!-- Favicon & Canonical Link -->
  <link rel="icon" type="image/svg+xml" href="favicon.svg">
  <link rel="canonical" href="https://licitacionya.pages.dev">

  <!-- Open Graph / WhatsApp Rich Preview Metadata -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://licitacionya.pages.dev">
  <meta property="og:title" content="LicitaciónYa | Radar de compras públicas SERCOP Ecuador">
  <meta property="og:description"
    content="Auditoría de compras públicas SERCOP cada 6 horas. Fichas con fuente y enlace al pliego, alertas por WhatsApp y Excel consolidado los lunes a las 08:00 ECT.">
  <meta property="og:image" content="https://licitacionya.pages.dev/og-image.png">
  <meta property="og:locale" content="es_EC">

  <!-- Twitter Card Metadata -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="LicitaciónYa | Radar de compras públicas SERCOP Ecuador">
  <meta name="twitter:description"
    content="Fichas de procesos con código, entidad, monto, provincia y enlace al pliego. Monitoreo cada 6 horas y reporte Excel semanal.">
  <meta name="twitter:image" content="https://licitacionya.pages.dev/og-image.png">

  <!-- Self-Hosted Local Fonts (Zero External Dependencies) -->
  <link rel="stylesheet" href="css/fonts.css">

  <!-- Landing Design System -->
  <link rel="stylesheet" href="css/landing.css?v=20261025_v4">

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
            "name": "¿Cada cuánto se actualiza el radar?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "La auditoría se ejecuta cada 6 horas: 00:00, 06:00, 12:00 y 18:00 ECT. No prometemos alertas en 15 minutos."
            }
          },
          {
            "@type": "Question",
            "name": "¿De dónde salen los datos?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "De la API oficial de Datos Abiertos del Sistema Nacional de Contratación Pública, bajo el estándar OCDS. No usamos credenciales del SERCOP ni intervenimos en el portal público."
            }
          },
          {
            "@type": "Question",
            "name": "¿Qué recibo con el piloto?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Un perfil de búsqueda calibrado con su equipo, alertas por WhatsApp y correo, y un reporte consolidado en Excel los lunes a las 08:00 ECT."
            }
          },
          {
            "@type": "Question",
            "name": "¿Qué pasa al terminar los 15 días?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Le confirmamos si desea continuar. No hay permanencia mínima ni cobro automático. Si no continúa, el servicio se detiene."
            }
          },
          {
            "@type": "Question",
            "name": "¿Garantizan adjudicaciones?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "No. El servicio reduce el tiempo de detección y ordena la información. La decisión de cotizar, la oferta y la adjudicación dependen de su empresa y del proceso."
            }
          }
        ]
      }
    ]
  }
  </script>
</head>

<body class="landing-page">
  <a class="skip-link" href="#main">Saltar al contenido</a>
${headerContent}
  <main id="main">
${mainContent}
  </main>
${tailContent}
  <!-- Modular ES Modules Entry Point -->
  <script type="module" src="js/main.js?v=20261025_v4"></script>
</body>

</html>
`;

  fs.writeFileSync(OUTPUT_FILE, html, 'utf8');
  const duration = Date.now() - startTime;
  console.log(`✅ Compilación exitosa en ${duration}ms!`);
  console.log(`📄 Archivo generado: ${OUTPUT_FILE} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`);
}

build();
