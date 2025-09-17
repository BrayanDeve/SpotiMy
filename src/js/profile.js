// ===== profile.js =====
import { fetchWebApi } from './api.js';

export const loginBtn = document.getElementById('login-btn');
export const logoutBtn = document.getElementById('logout-btn');
export const profileContainer = document.querySelector('.auth-profile');

const STORAGE_KEY = 'spotify_token';

// =====================================================
// LOGOUT: remove tokens e limpa interface
// =====================================================
export async function logoutUser() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('pkce_code_verifier');

    profileContainer.innerHTML = '';
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
}

// =====================================================
// RENDERIZA PERFIL DO USUÁRIO
// =====================================================
export async function renderUserProfile() {
    profileContainer.innerHTML = ''; // Limpa container

    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) {
        // Se estamos na home, apenas mostra botão de login
        if (window.location.pathname.endsWith('index.html')) {
            loginBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
        }
        return;
    }

    try {
        const user = await fetchWebApi('v1/me');

        // Se fetchWebApi retornou null, token expirou ou inválido
        if (!user) {
            if (!window.location.pathname.endsWith('index.html')) {
                await logoutUser();
                alert('Sessão expirada. Faça login novamente.');
            }
            return;
        }

        // Cria container do perfil
        const profileDiv = document.createElement('div');
        profileDiv.classList.add('user-profile');

        const img = document.createElement('img');
        img.src = user.images?.[0]?.url || 'assets/placeholder.png';
        img.alt = user.display_name || 'Usuário';
        img.classList.add('user-avatar');

        const name = document.createElement('span');
        name.textContent = user.display_name || 'Usuário';
        name.classList.add('user-name');

        profileDiv.appendChild(img);
        profileDiv.appendChild(name);
        profileContainer.appendChild(profileDiv);

        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
    } catch (err) {
        console.error('Erro ao renderizar perfil:', err);
        if (!window.location.pathname.endsWith('index.html')) {
            await logoutUser();
        }
    }
}

// =====================================================
// Inicialização ao carregar a página
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    renderUserProfile();
});