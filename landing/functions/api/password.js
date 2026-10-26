/**
 * Cloudflare Pages Function: /api/password
 * Permite guardar o actualizar la contraseña de acceso al portal para un RUC registrado
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
    const { ruc, password } = body;

    const cleanRuc = (ruc || '').toString().replace(/\D/g, '');
    const cleanPassword = (password || '').toString().trim();

    if (cleanRuc.length !== 13) {
      return jsonResponse({ success: false, error: 'El RUC debe tener 13 dígitos numéricos' }, 400);
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      return jsonResponse({ success: false, error: 'La contraseña debe tener al menos 6 caracteres' }, 400);
    }

    const tursoUrl = context.env.TURSO_DATABASE_URL;
    const tursoToken = context.env.TURSO_AUTH_TOKEN;

    if (tursoUrl && tursoToken) {
      try {
        const cleanEndpoint = tursoUrl.replace('libsql://', 'https://').replace(/\/$/, '');
        const pipelineEndpoint = cleanEndpoint.endsWith('/v2/pipeline')
          ? cleanEndpoint
          : `${cleanEndpoint}/v2/pipeline`;

        const updateSql = `
          UPDATE leads
          SET password = ?, updated_at = CURRENT_TIMESTAMP
          WHERE ruc = ?;
        `;

        const updatePayload = {
          requests: [
            {
              type: 'execute',
              stmt: {
                sql: updateSql,
                args: [
                  { type: 'text', value: cleanPassword },
                  { type: 'text', value: cleanRuc }
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
          body: JSON.stringify(updatePayload)
        });

        // Si la tabla no tiene la columna password, intentamos agregarla y reintentar el update
        if (tursoRes.ok) {
          const resJson = await tursoRes.json();
          const firstErr = resJson?.results?.[0]?.response?.error;
          if (firstErr && firstErr.message && firstErr.message.includes('no such column: password')) {
            const alterPayload = {
              requests: [
                { type: 'execute', stmt: { sql: 'ALTER TABLE leads ADD COLUMN password TEXT;' } },
                {
                  type: 'execute',
                  stmt: {
                    sql: updateSql,
                    args: [
                      { type: 'text', value: cleanPassword },
                      { type: 'text', value: cleanRuc }
                    ]
                  }
                },
                { type: 'close' }
              ]
            };
            await fetch(pipelineEndpoint, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${tursoToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(alterPayload)
            });
          }
        }
      } catch (tursoErr) {
        console.error('Error sincronizando contraseña en Turso:', tursoErr);
      }
    }

    return jsonResponse({
      success: true,
      message: 'Contraseña guardada correctamente'
    });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message || 'Error al procesar la solicitud' }, 500);
  }
}
