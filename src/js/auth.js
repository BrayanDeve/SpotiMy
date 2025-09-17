// ===========================================
// Auth Module
// Gerencia login via PKCE, logout e refresh token
// ===========================================

import { renderUserProfile, loginBtn, logoutBtn, logoutUser } from './profile.js';

// ===== Configurações do Spotify vindo do config.js=====
import { CLIENT_ID, REDIRECT_URI, SCOPES } from './config.js';

// ===== Keys no localStorage =====
const STORAGE_KEY = 'spotify_token';
const STORAGE_REFRESH = 'spotify_refresh_token';

// ===========================================
// PKCE: gera code verifier aleatório
// ===========================================
function generateCodeVerifier(length = 128) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from(crypto.getRandomValues(new Uint8Array(length)))
        .map(x => chars[x % chars.length])
        .join('');
}

// ===========================================
// PKCE: transforma buffer em Base64URL
// ===========================================
function base64URLEncode(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ===========================================
// PKCE: SHA-256
// ===========================================
async function sha256(str) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
}

// ===========================================
// LOGIN: monta URL de autorização e redireciona
// ===========================================
loginBtn.addEventListener('click', async () => {
    await logoutUser(); // Limpa sessão anterior

    const codeVerifier = generateCodeVerifier();
    localStorage.setItem('pkce_code_verifier', codeVerifier);
    const codeChallenge = base64URLEncode(await sha256(codeVerifier));

    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('scope', SCOPES);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('code_challenge', codeChallenge);

    window.location.href = authUrl.toString();
});

// ===========================================
// HANDLE REDIRECT: troca code por access token
// ===========================================
export async function handleRedirect() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;

    const codeVerifier = localStorage.getItem('pkce_code_verifier');
    if (!codeVerifier) return;

    try {
        const res = await fetch('http://localhost:3000/exchange_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, code_verifier: codeVerifier })
        });

        const data = await res.json();

        if (data.access_token) {
            // Salva access token
            localStorage.setItem(STORAGE_KEY, data.access_token);

            // Salva refresh token se disponível
            if (data.refresh_token) {
                localStorage.setItem(STORAGE_REFRESH, data.refresh_token);
            }

            await renderUserProfile();
            window.history.replaceState({}, document.title, REDIRECT_URI);
        } else {
            await logoutUser();
            alert('Falha no login Spotify.');
        }

    } catch (err) {
        console.error('Erro fetch token', err);
        await logoutUser();
        alert('Erro ao tentar logar no Spotify.');
    }
}

// ===========================================
// REFRESH TOKEN: atualiza access_token usando refresh_token
// ===========================================
export async function refreshAccessToken() {
    const refreshToken = localStorage.getItem(STORAGE_REFRESH);
    if (!refreshToken) return false;

    try {
        const res = await fetch('http://localhost:3000/refresh_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
        });

        const data = await res.json();
        if (data.access_token) {
            localStorage.setItem(STORAGE_KEY, data.access_token);
            if (data.refresh_token) localStorage.setItem(STORAGE_REFRESH, data.refresh_token);
            return true;
        }

        return false;
    } catch (err) {
        console.error('Erro ao atualizar token:', err);
        return false;
    }
}

// ===========================================
// LOGOUT DIRETO
// ===========================================
logoutBtn.addEventListener('click', logoutUser);

// ===========================================
// INICIALIZAÇÃO
// ===========================================
handleRedirect();