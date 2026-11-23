export const config = { matcher: '/:path*' };

const COOKIE_NAME = 'am_auth';
const LOGIN_PATH = '/login';

function getCookie(request, name) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function loginPage(errorMsg = '') {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Agent Majeur — Accès sécurisé</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8fafc;font-family:system-ui,sans-serif}
  .box{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:40px;width:320px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.06)}
  img{height:48px;margin-bottom:20px}
  input{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #cbd5e1;border-radius:8px;margin:14px 0;font-size:14px}
  button{width:100%;padding:10px;border:none;border-radius:8px;background:#164194;color:#fff;font-weight:600;cursor:pointer}
  .err{color:#dc2626;font-size:13px;margin-bottom:10px}
</style>
</head>
<body>
  <div class="box">
    <img src="/logo-am.png" alt="Agent Majeur">
    <form method="POST" action="/login">
      ${errorMsg ? `<div class="err">${errorMsg}</div>` : ''}
      <input type="password" name="password" placeholder="Mot de passe" required autofocus>
      <button type="submit">Accéder au rapport</button>
    </form>
  </div>
</body>
</html>`;
}

export default async function middleware(request) {
  const url = new URL(request.url);

  if (url.pathname === '/logo-am.png') {
    return;
  }

  if (url.pathname === LOGIN_PATH) {
    if (request.method === 'POST') {
      const form = await request.formData();
      const password = form.get('password');
      if (password === process.env.SITE_PASSWORD) {
        const res = Response.redirect(new URL('/', request.url), 303);
        res.headers.append('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(process.env.SITE_PASSWORD)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`);
        return res;
      }
      return new Response(loginPage('Mot de passe incorrect.'), { status: 401, headers: { 'content-type': 'text/html; charset=utf-8' } });
    }
    return new Response(loginPage(), { headers: { 'content-type': 'text/html; charset=utf-8' } });
  }

  if (getCookie(request, COOKIE_NAME) === process.env.SITE_PASSWORD) {
    return; // accès autorisé
  }

  return Response.redirect(new URL(LOGIN_PATH, request.url), 303);

}
