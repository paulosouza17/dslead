const accountSid = 'AC8b88b3faa876a039956cd230105fd85f';
const authToken = '265109523508bb0eaa3c5d4d0280ff33';
const client = require('twilio')(accountSid, authToken);
const { v4: uuidv4 } = require('uuid');

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

// const dsleadnum = '14155238886'; //antigo
const dsleadnum = '15075165741'; //definitivo

function formatarDataHora(data) {
  const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' };
  return data.toLocaleString('pt-BR', options);
}

function getTimestampWithinInterval(start, end) {
  var startTime = start.getTime() / 1000; // Divide por 1000 para obter o timestamp em segundos
  var endTime = end.getTime() / 1000; // Divide por 1000 para obter o timestamp em segundos
  var randomTimestamp = Math.floor(Math.random() * (endTime - startTime + 1)) + startTime;
  return new Date(randomTimestamp * 1000); // Multiplica por 1000 para converter o timestamp em milissegundos
}

app.post('/send', async (req, res) => {
  const nome = req.body.nome;
  const telefone = req.body.telefone;
  const email = req.body.email;
  const cliente = req.body.nome_cliente;
  const campanha = req.body.campanha;
  const data_inicio = req.body.data_inicio;
  const data_final = req.body.data_final;
  const criativo = req.body.criativo;
  const tel_cliente = req.body.tel_cliente;
  const local = req.body.local;
  const cta = '_Clique no número do lead para iniciar uma conversa_';
  const autorizado = true;

  try {
    const { default: conectabd } = await import('./supabase.js');
    const supabase = conectabd();

    const tb_acoes = 'acoes';
    const tb_campanha = 'campanha';
    const tb_cliente = 'cliente';
    const tb_criativo = 'criativo';
    const tb_usuario = 'usuario';

    // Verificar se o cliente já existe no banco
    let idCliente;
    const { data: existingCliente } = await supabase
      .from(tb_cliente)
      .select()
      .eq('nome_cliente', cliente)
      .single();

    if (existingCliente && existingCliente.id_cliente) {
      idCliente = existingCliente.id_cliente;
      console.log('Cliente já existe:', idCliente);
    } else {
      idCliente = uuidv4();
      const novoCliente = {
        id_cliente: idCliente,
        nome_cliente: cliente,
        tel_cliente: tel_cliente,
        autorizado: autorizado,
      };

      await supabase.from(tb_cliente).insert(novoCliente);
      console.log('Novo cliente criado:', idCliente);
    }

    // Verificar se a campanha já existe no banco
    let idCampanha;
    const { data: existingCampanha } = await supabase
      .from(tb_campanha)
      .select()
      .eq('campanha', campanha)
      .single();

    if (existingCampanha && existingCampanha.id_campanha) {
      idCampanha = existingCampanha.id_campanha;
      console.log('Campanha já existe:', idCampanha);
    } else {
      idCampanha = uuidv4();
      const novaCampanha = {
        id_campanha: idCampanha,
        campanha: campanha,
        id_cliente: idCliente,
        data_inicio: data_inicio,
        data_final: data_final,
      };

      await supabase.from(tb_campanha).insert(novaCampanha);
      console.log('Nova campanha criada:', idCampanha);
    }

    // Verificar se o criativo já existe no banco
    let idCriativo;
    const { data: existingCriativo } = await supabase
      .from(tb_criativo)
      .select()
      .eq('criativo', criativo)
      .single();

    if (existingCriativo && existingCriativo.id_criativo) {
      idCriativo = existingCriativo.id_criativo;
      console.log('Criativo já existe:', idCriativo);
    } else {
      idCriativo = uuidv4();
      const novoCriativo = {
        id_criativo: idCriativo,
        criativo: criativo,
        id_campanha: idCampanha,
        id_cliente: idCliente,
      };

      await supabase.from(tb_criativo).insert(novoCriativo);
      console.log('Novo criativo criado:', idCriativo);
    }

    // Verificar se o usuário já existe no banco
    let idUsuario;
    const { data: existingUsuario } = await supabase
      .from(tb_usuario)
      .select()
      .eq('telefone', telefone)
      .single();

    if (existingUsuario && existingUsuario.id_usuario) {
      idUsuario = existingUsuario.id_usuario;
      console.log('Usuário já existe:', idUsuario);
    } else {
      idUsuario = uuidv4();
      const novoUsuario = {
        id_usuario: idUsuario,
        nome_usuario: nome,
        telefone: telefone,
        email: email,
      };

      await supabase.from(tb_usuario).insert(novoUsuario);
      console.log('Novo usuário criado:', idUsuario);
    }

    const start = new Date('2023-06-10T00:00:00Z');
    const end = new Date('2023-06-20T23:59:59Z');
    const timestamp = getTimestampWithinInterval(start, end);

    const novaAcao = {
      id_acao: uuidv4(),
      id_criativo: idCriativo,
      id_campanha: idCampanha,
      id_usuario: idUsuario,
      id_cliente: idCliente,
      local: local,
      data_hora: timestamp.toISOString()
    };

    const resultAcao = await supabase.from(tb_acoes).insert(novaAcao);
    if (resultAcao.error) {
      console.log(resultAcao.error);
    } else {
      console.log('Nova ação criada:', novaAcao.id_acao);
      res.json({
        status: '200',
        msg: 'Dados inseridos com sucesso!',
        datahora: new Date(),
        dados_inseridos: {
          nome,
          telefone,
          email,
          cliente,
          campanha,
          data_inicio,
          data_final,
          criativo,
          tel_cliente,
          local,
        },
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: '500',
      msg: 'Erro na solicitação. Retorne e tente novamente.',
    });
  }
});

app.get('/form', (req, res) => {
  res.send(`
  <!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css">
</head>
<body>
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
    <a class="navbar-brand" href="#">Meu Site</a>
    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav">
        <li class="nav-item active">
          <a class="nav-link" href="#">Página Inicial</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#">Sobre</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#">Contato</a>
        </li>
      </ul>
    </div>
  </nav>

  <div class="container">
    <h1>Formulário de Inserção</h1>
    <form action="/send" method="post">
      <div class="form-group">
        <label for="nome">Nome:</label>
        <input type="text" id="nome" name="nome" class="form-control" required>
      </div>
      <div class="form-group">
        <label for="telefone">Telefone:</label>
        <input type="text" id="telefone" name="telefone" class="form-control" required>
      </div>
      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" name="email" class="form-control" required>
      </div>
      <div class="form-group">
        <label for="nome_cliente">Nome do Cliente:</label>
        <input type="text" id="nome_cliente" name="nome_cliente" class="form-control" value="Vivo" required>
      </div>
      <div class="form-group">
        <label for="campanha">Campanha:</label>
        <input type="text" id="campanha" name="campanha" class="form-control" value="Vivo Play" required>
      </div>
      <div class="form-group">
        <label for="criativo">Criativo:</label>
        <input type="text" id="criativo" name="criativo" class="form-control" value="https://i.postimg.cc/MpTcb5x3/vivo-play-criativo2.jpg" required>
      </div>
      <div class="form-group">
        <label for="tel_cliente">Telefone do Cliente:</label>
        <input type="text" id="tel_cliente" name="tel_cliente" class="form-control" value="5567676767" required>
      </div>
      <div class="form-group">
        <label for="local">Local:</label>
        <input type="text" id="local" name="local" class="form-control" value="Rodoviária do Plano Piloto" required>
      </div>
      <button type="submit" class="btn btn-primary">Enviar</button>
    </form>
  </div>

  <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/js/bootstrap.min.js"></script>
</body>
</html>
  
  `);
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

