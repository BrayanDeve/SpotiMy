const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ===== Configurações do Spotify =====
const CLIENT_ID = '01ddad056ee848919e2000dea761c2c2';
const REDIRECT_URI = 'http://127.0.0.1:5501/src/index.html';

// ===========================================
// Troca authorization code por access token
// ===========================================
app.post('/exchange_token', async (req, res) => {
    const { code, code_verifier } = req.body;

    if (!code || !code_verifier) {
        return res.status(400).json({ error: 'code e code_verifier obrigatórios' });
    }

    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        code_verifier
    });

    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString()
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro Spotify API:', errorText);
            return res.status(response.status).json({ error: errorText });
        }

        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error('Erro servidor:', err);
        res.status(500).json({ error: 'Erro ao trocar token' });
    }
});

// ===========================================
// 2️⃣ Atualiza access_token usando refresh_token
// ===========================================
app.post('/refresh_token', async (req, res) => {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ error: 'refresh_token obrigatório' });

    const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token,
        client_id: CLIENT_ID
    });

    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: errorText });
        }

        const data = await response.json();
        // data terá novo access_token (às vezes refresh_token também)
        res.json(data);
    } catch (err) {
        console.error('Erro refresh token:', err);
        res.status(500).json({ error: 'Erro ao atualizar token' });
    }
});


// ===========================================
// Inicialização do servidor
// ===========================================
app.listen(3000, () => console.log('Backend rodando na porta 3000'));