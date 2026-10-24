/**
 * Cloudflare Pages Function: /api/client
 * Autentica y recupera el perfil del cliente en Turso mediante RUC y últimos 4 dígitos de WhatsApp
 */

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    const { ruc, phone4 } = body;

    const cleanRuc = (ruc || '').toString().replace(/\D/g, '');
    const cleanPhone4 = (phone4 || '').toString().replace(/\D/g, '');

    if (cleanRuc.length !== 13) {
      return jsonResponse({ success: false, error: 'El RUC debe tener 13 dígitos numéricos' }, 400);
    }

    if (cleanPhone4.length !== 4) {
      return jsonResponse({ success: false, error: 'Ingrese los últimos 4 dígitos de su celular para validar identidad' }, 400);
    }

    const tursoUrl = context.env.TURSO_DATABASE_URL;
    const tursoToken = context.env.TURSO_AUTH_TOKEN;

    if (!tursoUrl || !tursoToken) {
      return jsonResponse({
        success: false,
        error: 'Servicio de base de datos no configurado en el servidor'
      }, 503);
    }

    const cleanEndpoint = tursoUrl.replace('libsql://', 'https://').replace(/\/$/, '');
    const pipelineEndpoint = cleanEndpoint.endsWith('/v2/pipeline')
      ? cleanEndpoint
      : `${cleanEndpoint}/v2/pipeline`;

    const querySql = `
      SELECT empresa, ruc, whatsapp, phone_last4, email, rubro, plan, status, created_at
      FROM leads
      WHERE ruc = ? AND phone_last4 = ?
      LIMIT 1;
    `;

    const pipelinePayload = {
      requests: [
        {
          type: 'execute',
          stmt: {
            sql: querySql,
            args: [
              { type: 'text', value: cleanRuc },
              { type: 'text', value: cleanPhone4 }
            ]
          }
        },
        { type: 'close' }
      ]
    };

    const res = await fetch(pipelineEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tursoToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pipelinePayload)
    });

    if (!res.ok) {
      return jsonResponse({ success: false, error: 'Error al consultar la base de datos' }, 502);
    }

    const data = await res.json();
    const result = data?.results?.[0]?.response?.result;

    if (!result || !result.rows || result.rows.length === 0) {
      return jsonResponse({
        success: false,
        error: 'RUC o últimos 4 dígitos no coinciden con un registro activo. Verifique sus datos o active su prueba gratis.'
      }, 404);
    }

    const cols = result.cols.map(c => c.name);
    const rowValues = result.rows[0].map(val => val.value);
    const client = {};
    cols.forEach((col, idx) => {
      client[col] = rowValues[idx];
    });

    // Calcular días restantes de prueba (15 días desde created_at)
    const createdAt = new Date(client.created_at || Date.now());
    const now = new Date();
    const diffDays = Math.max(0, 15 - Math.floor((now - createdAt) / (1000 * 60 * 60 * 24)));
    client.trialDaysRemaining = diffDays;

    return jsonResponse({
      success: true,
      client
    });
  } catch (err) {
    console.error('Error en /api/client:', err);
    return jsonResponse({ success: false, error: 'Error interno de validación' }, 500);
  }
}
