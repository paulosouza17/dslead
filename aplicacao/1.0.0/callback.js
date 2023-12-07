const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configurações do Supabase
const supabaseUrl = 'https://vwevbdowmjoyrrcqicpq.supabase.co';
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3ZXZiZG93bWpveXJyY3FpY3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODEzMTMwMjQsImV4cCI6MTk5Njg4OTAyNH0.uLg0v5Knh0EKvz-kJIPFKF3d3fCLvwU_utE6vWEjUZM";

const supabase = createClient(supabaseUrl, supabaseKey);



app.post('/callback', async (req, res) => {
  const messageStatus = req.body.MessageStatus;
  const messageId = req.body.MessageSid;
  const idAcao = req.body.id_acao;

  console.log('Recebido callback do Twilio:');
  console.log('Status da mensagem:', messageStatus);
  console.log('ID da mensagem:', messageId);

  console.log('Verificando se o id_acao existe no banco de dados...');

  // Consulta o Supabase para verificar se o id_acao existe na tabela 'acoes'
  const { data: acaoData, error: acaoError } = await supabase
    .from('acoes')
    .select('*')
    .eq('id_acao', idAcao)
    .single();

  if (acaoError || !acaoData) {
    console.log('O id_acao não foi encontrado no banco de dados:', idAcao);
    res.status(404).json({ error: 'O id_acao não foi encontrado no banco de dados' });
    return;
  }

  console.log('O id_acao foi encontrado no banco de dados:', idAcao);

  console.log('Armazenando informações no Supabase...');

  // Verifica se o messageStatus é "delivered"
  const isDelivered = messageStatus === 'delivered';

  // Atualiza o campo 'status' na tabela 'acoes' do Supabase com o valor de isDelivered
  const { data: updateData, error: updateError } = await supabase
    .from('acoes')
    .update({ status: isDelivered })
    .eq('id_acao', idAcao);

  if (updateError) {
    console.log('Erro ao atualizar dados no Supabase:', updateError);
    res.status(500).json({ error: 'Erro ao atualizar dados no Supabase' });
  } else {
    console.log('Informações atualizadas com sucesso no Supabase');
    res.status(200).end();
  }
});

app.listen(3001, () => {
  console.log('Servidor rodando na porta 3001');
});