import { getTopArtists } from './api.js';

// ===== Função auxiliar: renderiza lista de artistas =====
function renderArtists(ul, artists) {
    if (!artists?.length) {
        ul.innerHTML = '<li class="artist-item">Nenhum artista encontrado.</li>';
        return;
    }

    ul.innerHTML = artists.map(artist => `
        <li class="artist-item">
            <img src="${artist.images[0]?.url ?? 'assets/placeholder.png'}" alt="${artist.name}">
            <div class="artist-info">
                <a href="${artist.external_urls.spotify}" target="_blank">${artist.name}</a>
                ${artist.genres?.length ? `<span class="genres">${artist.genres.join(', ')}</span>` : ''}
            </div>
        </li>
    `).join('');
}

// ===== Função principal: busca artistas =====
async function loadTopArtists() {
    const ul = document.getElementById('artists');
    ul.classList.add('artists-list'); // adiciona classe para diferenciar do CSS de tracks

    try {
        const artists = await getTopArtists(10, 'medium_term');

        if (artists === null) {
            // Token inválido ou erro de autenticação
            alert('Você precisa logar primeiro!');
            renderArtists(ul, []);
            return;
        }

        renderArtists(ul, artists);
    } catch (error) {
        console.error('Erro ao carregar artistas:', error);
        ul.innerHTML = '<li class="artist-item">Erro ao carregar artistas.</li>';
    }
}

// ===== Execução =====
loadTopArtists();