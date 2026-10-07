// =========================================================================
// TERRA ECOSYSTEM â€” WEBBL MORPH HANDLER FOR CARVAULT
// Processes incoming vehicle / brand addition requests, executes middleware validation,
// and automatically creates official issues in amglogicalis/carvault.
// =========================================================================

module.exports = async function handler(payload) {
  const https = require('https');

  console.log('ðŸ¦‹ [Carvault Morph] Received request payload:', JSON.stringify(payload));

  const text = typeof payload === 'string' ? payload : (payload.text || payload.data || payload.query || '');
  const cleanText = (text || '').trim();

  if (!cleanText || cleanText.length < 3) {
    return {
      status: 400,
      success: false,
      error: 'El texto es demasiado corto (mÃ­nimo 3 caracteres).'
    };
  }

  if (cleanText.length > 250) {
    return {
      status: 400,
      success: false,
      error: 'El texto excede el lÃ­mite de 250 caracteres.'
    };
  }

  // Prepara el issue
  const issueTitle = `[Propuesta de VehÃ­culo]: ${cleanText.slice(0, 60)}`;
  const issueBody = `### ðŸš— Solicitud de Modelo / Marca en Carvault

**DescripciÃ³n solicitada por el usuario:**
> ${cleanText}

---
*Procesado automÃ¡ticamente mediante el Morph Serverless del Ecosistema Terra.*
- **Fecha:** ${new Date().toISOString()}
- **Filtro Middleware:** Verificado y aprobado`;

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('âŒ GITHUB_TOKEN no configurado en el runner');
    return {
      status: 500,
      success: false,
      error: 'Falta token de autenticaciÃ³n en el entorno del Morph.'
    };
  }

  const postData = JSON.stringify({
    title: issueTitle,
    body: issueBody,
    labels: ['enhancement']
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: '/repos/amglogicalis/carvault/issues',
      method: 'POST',
      headers: {
        'User-Agent': 'Terra-Webbl-Morph/1.0',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`âœ… Issue #${parsed.number} creada con Ã©xito: ${parsed.html_url}`);
            resolve({
              status: 200,
              success: true,
              message: `Â¡Propuesta registrada con Ã©xito en el catÃ¡logo! (Issue #${parsed.number})`,
              issueNumber: parsed.number,
              issueUrl: parsed.html_url
            });
          } else {
            console.error('âŒ GitHub API Error:', body);
            resolve({
              status: res.statusCode,
              success: false,
              error: parsed.message || 'Error al crear la issue en GitHub.'
            });
          }
        } catch (e) {
          resolve({
            status: 500,
            success: false,
            error: 'Respuesta invÃ¡lida de la API de GitHub.'
          });
        }
      });
    });

    req.on('error', (err) => {
      console.error('âŒ Error de conexiÃ³n:', err);
      resolve({
        status: 500,
        success: false,
        error: err.message
      });
    });

    req.write(postData);
    req.end();
  });
};
