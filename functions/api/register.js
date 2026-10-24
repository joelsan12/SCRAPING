/**
 * Cloudflare Pages Function: /api/register
 * Registra un prospecto B2B, guarda en Turso y despacha notificaciones con Resend
 */

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

export async function onRequestOptions() {
  return jsonResponse({ ok: true });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { empresa, ruc, whatsapp, email, rubro } = body;

    // 1. Validaciones básicas de entrada
    if (!empresa || empresa.trim().length < 3) {
      return jsonResponse({ success: false, error: 'Nombre de empresa inválido' }, 400);
    }

    const cleanRuc = (ruc || '').toString().replace(/\D/g, '');
    if (cleanRuc.length !== 13) {
      return jsonResponse({ success: false, error: 'El RUC debe tener 13 dígitos numéricos' }, 400);
    }

    // Validación provincial ecuatoriana (01 a 24)
    const prov = parseInt(cleanRuc.substring(0, 2), 10);
    if (prov < 1 || (prov > 24 && prov !== 30)) {
      return jsonResponse({ success: false, error: 'Código de provincia de RUC no válido en Ecuador' }, 400);
    }

    const cleanWa = (whatsapp || '').toString().replace(/\D/g, '');
    if (cleanWa.length < 9) {
      return jsonResponse({ success: false, error: 'Número de WhatsApp inválido' }, 400);
    }
    const phoneLast4 = cleanWa.slice(-4);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return jsonResponse({ success: false, error: 'Correo corporativo inválido' }, 400);
    }

    const leadData = {
      empresa: empresa.trim(),
      ruc: cleanRuc,
      whatsapp: cleanWa.startsWith('593') ? `+${cleanWa}` : `+593 ${cleanWa}`,
      phoneLast4,
      email: email.trim().toLowerCase(),
      rubro: rubro || 'Ferretería Industrial & Acero',
      plan: 'Suscripción Integral B2B ($80 USD/mes + IVA)',
      status: 'piloto_activo',
      trialDaysRemaining: 15,
      registeredAt: new Date().toISOString()
    };

    // 2. Persistencia en Base de Datos Turso (LibSQL HTTP Pipeline)
    const tursoUrl = context.env.TURSO_DATABASE_URL;
    const tursoToken = context.env.TURSO_AUTH_TOKEN;

    if (tursoUrl && tursoToken) {
      try {
        const cleanEndpoint = tursoUrl.replace('libsql://', 'https://').replace(/\/$/, '');
        const pipelineEndpoint = cleanEndpoint.endsWith('/v2/pipeline')
          ? cleanEndpoint
          : `${cleanEndpoint}/v2/pipeline`;

        const setupTableSql = `
          CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            empresa TEXT NOT NULL,
            ruc TEXT NOT NULL UNIQUE,
            whatsapp TEXT NOT NULL,
            phone_last4 TEXT NOT NULL,
            email TEXT NOT NULL,
            rubro TEXT NOT NULL,
            plan TEXT DEFAULT 'piloto_15_dias',
            status TEXT DEFAULT 'activo',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `;

        const upsertLeadSql = `
          INSERT INTO leads (empresa, ruc, whatsapp, phone_last4, email, rubro, plan, status, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(ruc) DO UPDATE SET
            empresa=excluded.empresa,
            whatsapp=excluded.whatsapp,
            phone_last4=excluded.phone_last4,
            email=excluded.email,
            rubro=excluded.rubro,
            updated_at=CURRENT_TIMESTAMP;
        `;

        const pipelinePayload = {
          requests: [
            { type: 'execute', stmt: { sql: setupTableSql } },
            {
              type: 'execute',
              stmt: {
                sql: upsertLeadSql,
                args: [
                  { type: 'text', value: leadData.empresa },
                  { type: 'text', value: leadData.ruc },
                  { type: 'text', value: leadData.whatsapp },
                  { type: 'text', value: leadData.phoneLast4 },
                  { type: 'text', value: leadData.email },
                  { type: 'text', value: leadData.rubro },
                  { type: 'text', value: leadData.plan },
                  { type: 'text', value: leadData.status }
                ]
              }
            },
            { type: 'close' }
          ]
        };

        const tursoRes = await fetch(pipelineEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tursoToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(pipelinePayload)
        });

        if (!tursoRes.ok) {
          const errText = await tursoRes.text();
          console.error('Error guardando en Turso:', errText);
        }
      } catch (tursoErr) {
        console.error('Fallo en pipeline Turso:', tursoErr);
      }
    }

    // 3. Notificación Dual con Resend (Interna a contacto@ y Bienvenida al Cliente)
    const resendApiKey = context.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        // A. Alerta Interna para el Administrador
        const adminEmailPayload = {
          from: 'LicitaciónYa Sistema <onboarding@resend.dev>',
          to: ['contacto@j2sdynamics.com'],
          subject: `🚨 Nuevo Prospecto SERCOP: ${leadData.empresa} (RUC: ${leadData.ruc})`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #059669; margin-top: 0;">¡Nuevo Prospecto Activado!</h2>
              <p>Un cliente ha solicitado la prueba gratuita de 15 días en la landing page:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Empresa:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${leadData.empresa}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">RUC:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-family: monospace;">${leadData.ruc}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Rubro:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${leadData.rubro}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">WhatsApp:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-family: monospace; color: #059669;">${leadData.whatsapp}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Email:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${leadData.email}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Plan:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">15 Días Gratis (Luego $80/mes + IVA)</td></tr>
              </table>
              <p style="font-size: 13px; color: #94a3b8;">Registro capturado automáticamente desde LicitaciónYa Ecuador.</p>
            </div>
          `
        };

        // B. Correo de Bienvenida al Prospecto
        const clientEmailPayload = {
          from: 'LicitaciónYa <onboarding@resend.dev>',
          to: [leadData.email],
          subject: `¡Piloto Activado! Su Radar SERCOP está listo — LicitaciónYa`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #0f172a; margin-top: 0;">Bienvenido a <span style="color: #059669;">LicitaciónYa Ecuador</span></h2>
              <p>Estimado equipo de <strong>${leadData.empresa}</strong>,</p>
              <p>Su período de prueba de <strong>15 días 100% gratuito</strong> ha comenzado. Nuestro radar algorítmico ya está auditando las compras públicas del SERCOP para su rubro (<em>${leadData.rubro}</em>).</p>
              
              <div style="background-color: #f8fafc; border-left: 4px solid #059669; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <h4 style="margin: 0 0 8px 0; color: #0f172a;">Datos de Acceso a su Panel de Cliente:</h4>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Enlace directo:</strong> <a href="https://licitacionya.pages.dev/portal.html?ruc=${leadData.ruc}" style="color: #059669;">licitacionya.pages.dev/portal.html</a></p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>RUC:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${leadData.ruc}</code></p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Clave rápida:</strong> Últimos 4 dígitos de su WhatsApp (<code>${leadData.phoneLast4}</code>)</p>
              </div>

              <h4 style="color: #0f172a;">Próximos Pasos:</h4>
              <ul style="color: #475569; padding-left: 20px; line-height: 1.6;">
                <li><strong>Alertas WhatsApp:</strong> Le notificaremos al ${leadData.whatsapp} cuando detectemos licitaciones en convocatoria abierta afines a su catálogo.</li>
                <li><strong>Matriz Excel Semanal:</strong> El próximo lunes a las 08:00 AM recibirá el reporte consolidado en su correo y en su panel.</li>
                <li><strong>Sin cobros sorpresa:</strong> Facturación electrónica SRI solo si decide continuar tras comprobar el retorno comercial.</li>
              </ul>

              <div style="text-align: center; margin-top: 32px;">
                <a href="https://licitacionya.pages.dev/portal.html?ruc=${leadData.ruc}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Ingresar a Mi Panel</a>
              </div>
              <hr style="border: none; border-top: 1px solid #f1f5f9; margin-top: 32px;">
              <p style="font-size: 12px; color: #94a3b8; text-align: center;">J2S Dynamics · RUC: 0941822801001 · Guayaquil, Ecuador</p>
            </div>
          `
        };

        await Promise.allSettled([
          fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(adminEmailPayload)
          }),
          fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(clientEmailPayload)
          })
        ]);
      } catch (emailErr) {
        console.error('Fallo en despacho Resend:', emailErr);
      }
    }

    return jsonResponse({
      success: true,
      message: 'Piloto de 15 días activado con éxito',
      client: leadData
    });
  } catch (err) {
    console.error('Error general en /api/register:', err);
    return jsonResponse({ success: false, error: 'Error interno al procesar el registro' }, 500);
  }
}
