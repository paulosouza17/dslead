const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vwevbdowmjoyrrcqicpq.supabase.co';
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3ZXZiZG93bWpveXJyY3FpY3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODEzMTMwMjQsImV4cCI6MTk5Njg4OTAyNH0.uLg0v5Knh0EKvz-kJIPFKF3d3fCLvwU_utE6vWEjUZM";

const supabase = createClient(supabaseUrl, supabaseKey);
const hashValida = 'd41d8cd98f00b204e9800998ecf8427e';

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/list', async (req, res) => {
  const hash = req.query.hash === hashValida;

  if (hash) {
    const filtro = req.query.filtro;
    console.log('Filtro:', filtro);

    const { data: usuarios, error: errorUsuarios } = await supabase
      .from('usuario')
      .select('nome_usuario, telefone, email');

    const { data: clientes, error: errorClientes } = await supabase
      .from('cliente')
      .select('nome_cliente, tel_cliente, campanha, criativo');

    res.render('list', { usuarios, clientes });
  } else {
    
    res.json({status : 500, msg: 'Hash inválida'});
  }
});


app.listen(3001, () => {
  console.log('O servidor está rodando na porta 3001.');
});
