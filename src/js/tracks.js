import { getTopTracks } from './api.js';

// ===== Função auxiliar: formata duração =====
function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// ===== Função auxiliar: renderiza lista de tracks =====
function renderTracks(ul, tracks) {
    if (!tracks?.length) {
        ul.innerHTML = '<li>Nenhuma música encontrada.</li>';
        return;
    }

    ul.innerHTML = tracks.map((track, index) => `
        <li class="track-item" data-url="${track.external_urls.spotify}">
            <div class="track-number">${index + 1}</div>
            <img src="${track.album.images[0]?.url ?? 'assets/placeholder.png'}" alt="${track.name}">
            <div class="track-info">
                <a href="${track.external_urls.spotify}" target="_blank">${track.name}</a>
                <span class="artists">${track.artists.map(a => a.name).join(', ')}</span>
            </div>
            <div class="track-duration">${formatDuration(track.duration_ms)}</div>
        </li>
    `).join('');
}

// ===== Função principal: busca tracks =====
async function loadTopTracks() {
    const ul = document.getElementById('tracks'); 

    try {
        const tracks = await getTopTracks(10, 'medium_term');

        if (tracks === null) {
            alert('Você precisa logar primeiro!');
            renderTracks(ul, []);
            return;
        }

        if (!tracks.length) {
            renderTracks(ul, []);
            return;
        }

        renderTracks(ul, tracks);

        // Evento para redirecionar ao clicar no li inteiro
        ul.querySelectorAll('li.track-item').forEach(li => {
            li.addEventListener('click', () => {
                const url = li.dataset.url;
                if (url) {
                    window.open(url, '_blank'); // Abre a música no Spotify
                }
            });
        });

    } catch (error) {
        console.error('Erro ao carregar músicas:', error);
        ul.innerHTML = '<li>Erro ao carregar músicas.</li>';
    }
}

// ===== Execução =====
loadTopTracks();
