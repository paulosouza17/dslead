const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const path = require('path');
// const supabase = require('./bd');

const app = express();

// async function listUsuarios(app) {

function conectabd() {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = "https://vwevbdowmjoyrrcqicpq.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3ZXZiZG93bWpveXJyY3FpY3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODEzMTMwMjQsImV4cCI6MTk5Njg4OTAyNH0.uLg0v5Knh0EKvz-kJIPFKF3d3fCLvwU_utE6vWEjUZM";

    const supabase = createClient(supabaseUrl, supabaseKey);

    return supabase;
}



app.get('/list', async (req, res) => {
    const authorization = req.headers['authorization'];
    const hashValida = process.env.HASH;

    if (authorization !== hashValida) {
        try {
            const { default: conectabd } = await import('./supabase.js');
            const supabase = conectabd();

            const { data: acoesData, error: acoesError } = await supabase
                .from('acoes')
                .select('id_acao, id_cliente, id_campanha, id_usuario, data_hora')
                .order('data_hora', { ascending: false });

            if (acoesError) {
                throw acoesError;
            }

            const resultados = await Promise.all(
                acoesData.map(async (acao) => {
                    const [clienteData, campanhaData, usuarioData] = await Promise.all([
                        supabase.from('cliente').select('nome_cliente').eq('id_cliente', acao.id_cliente).single(),
                        supabase.from('campanha').select('campanha').eq('id_campanha', acao.id_campanha).single(),
                        supabase.from('usuario').select('nome_usuario, telefone, email').eq('id_usuario', acao.id_usuario).single(),
                    ]);

                    return {
                        nome_cliente: clienteData.data?.nome_cliente,
                        campanha: campanhaData.data?.campanha,
                        nome_usuario: usuarioData.data?.nome_usuario,
                        telefone: usuarioData.data?.telefone,
                        email: usuarioData.data?.email,
                        data_hora_acao: acao.data_hora,
                    };
                })
            );

            res.json(resultados);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    } else {
        res.status(403).json({ error: 'Acesso negado!' });
    }
});
// }

// module.exports = listUsuarios;