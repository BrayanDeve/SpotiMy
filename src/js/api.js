// ===== api.js =====

// 1️⃣ Pega o token do localStorage
function getToken() {
    return localStorage.getItem('spotify_token');
}

// 2️⃣ Atualiza access token via refresh token
export async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    if (!refreshToken) return false;

    try {
        const res = await fetch('http://localhost:3000/refresh_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
        });

        const data = await res.json();
        if (data.access_token) {
            localStorage.setItem('spotify_token', data.access_token);
            if (data.refresh_token) localStorage.setItem('spotify_refresh_token', data.refresh_token);
            return true;
        }
        return false;
    } catch (err) {
        console.error('Erro ao atualizar token:', err);
        return false;
    }
}

// 3️⃣ Função genérica para chamadas à API Spotify
export async function fetchWebApi(endpoint, method = 'GET') {
    let token = getToken();
    if (!token) {
        // Redireciona só se não estivermos na página de login
        if (!window.location.pathname.endsWith('index.html')) {
            window.location.href = 'index.html';
        }
        return null; // indica falha de autenticação
    }

    try {
        let res = await fetch(`https://api.spotify.com/${endpoint}`, {
            headers: { Authorization: `Bearer ${token}` },
            method
        });

        // Se token expirou (401), tenta refresh
        if (res.status === 401) {
            const refreshed = await refreshAccessToken();
            if (!refreshed) {
                localStorage.removeItem('spotify_token');
                localStorage.removeItem('pkce_code_verifier');

                if (!window.location.pathname.endsWith('index.html')) {
                    window.location.href = 'index.html';
                }
                return null; // falha de autenticação
            }

            token = getToken();
            res = await fetch(`https://api.spotify.com/${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` },
                method
            });
        }

        if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
        return await res.json();
    } catch (err) {
        console.error('Erro ao acessar Spotify API:', err);
        return null; // indica falha de autenticação ou erro na API
    }
}

// 4️⃣ Funções específicas do usuário

// Retorna top artistas do usuário
export async function getTopArtists(limit = 10, time_range = 'medium_term') {
    limit = Math.min(limit, 50);
    const data = await fetchWebApi(`v1/me/top/artists?limit=${limit}&time_range=${time_range}`);
    if (data === null) return null;  // token inválido ou erro
    return data.items ?? [];          // array vazio se não houver artistas
}

// Retorna top tracks do usuário
export async function getTopTracks(limit = 10, time_range = 'medium_term') {
    limit = Math.min(limit, 50);
    const data = await fetchWebApi(`v1/me/top/tracks?limit=${limit}&time_range=${time_range}`);
    if (data === null) return null;  // token inválido ou erro
    return data.items ?? [];          // array vazio se não houver músicas
}