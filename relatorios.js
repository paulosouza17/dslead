const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vwevbdowmjoyrrcqicpq.supabase.co';
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3ZXZiZG93bWpveXJyY3FpY3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODEzMTMwMjQsImV4cCI6MTk5Njg4OTAyNH0.uLg0v5Knh0EKvz-kJIPFKF3d3fCLvwU_utE6vWEjUZM";

const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/relatorios', async (req, res) => {
  const filtro = req.query.filtro;
  console.log('Filtro:', filtro);
  const { data: usuarios, error: errorUsuarios } = await supabase
    .from('usuario')
    .select('nome_usuario, telefone, email');
  const { data: clientes, error: errorClientes } = await supabase
    .from('cliente')
    .select('nome_cliente, tel_cliente, campanha, criativo');
  res.render('index', { usuarios, clientes });
});



// app.listen(3000, () => {
//   console.log('O servidor está rodando na porta 3000.');
// });
