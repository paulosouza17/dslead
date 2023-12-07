require('dotenv').config();
const dsleadnum = process.env.DSLEADNUM;
const accountSid = process.env.ACCOUNTSID;
const authToken = process.env.AUTHTOKEN;

const client = require('twilio')(accountSid, authToken);
const { v4: uuidv4 } = require('uuid');


// console.log("Hash enviada:" + hashValida);

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const { randomUUID } = require('crypto');
app.use(bodyParser.urlencoded({ extended: true }));


// Função para enviar notificação via Twilio
function sendNotification(nome, telefone, cliente, email, campanha, criativo, data_inicio, data_final, descricao, tel_cliente, res) {


  // Obtém a data e hora atual
var dataHoraAtual = new Date();

// Ajusta o fuso horário para UTC-3
var fusoHorario = -3; // UTC-3
var horaUTC3 = dataHoraAtual.getUTCHours() + fusoHorario;

// Verifica se a hora precisa ser ajustada para o dia anterior
if (horaUTC3 < 0) {
  horaUTC3 += 24;
  dataHoraAtual.setUTCDate(dataHoraAtual.getUTCDate() - 1);
}

// Define a nova hora no objeto Date
dataHoraAtual.setUTCHours(horaUTC3);

// Obtém os componentes individuais da data e hora
var dia = dataHoraAtual.getUTCDate();
var mes = dataHoraAtual.getUTCMonth() + 1; // Os meses em JavaScript são baseados em zero
var ano = dataHoraAtual.getUTCFullYear();
var hora = dataHoraAtual.getUTCHours();
var minutos = dataHoraAtual.getUTCMinutes();

// Formata a data e hora no formato desejado (dd/mm/yyyy às hh:mm)
var dataHoraFormatada = dia.toString().padStart(2, '0') + '/' + mes.toString().padStart(2, '0') + '/' + ano + ' às ' + hora.toString().padStart(2, '0') + ':' + minutos.toString().padStart(2, '0');

// Exibe a data e hora atual no fuso horário UTC-3
console.log('Data e hora atual (UTC-3): ' + dataHoraFormatada);

  if (tel_cliente.startsWith("9")) {
    tel_cliente = tel_cliente.substring(1);
  }

  const bodyTemplate = `Olá, ${cliente}! Gostaria de informar que recebemos mais um lead para você. Abaixo estão os dados que foram registrados:

🎯 ${campanha}
👤 ${nome}
📞 ${telefone}
✉️ ${email}
🕒 ${dataHoraFormatada}

-- 
${descricao}`

  client.messages
    .create({
      body: bodyTemplate,
      from: 'whatsapp:+' + dsleadnum,
      to: 'whatsapp:+' + tel_cliente,
      templateSid: 'alert_ds'
    })
    .then((message) => {
      console.log(message.sid);
      res.json({
        status: '200',
        msg: 'Sua mensagem foi enviada com sucesso! Em breve retornaremos seu contato.',
        datahora: new Date(),
        dados_enviados: {
          nome,
          telefone,
          email,
          campanha,
          criativo,
          data_inicio,
          data_final,
          tel_cliente,
        },
        twilio_status: message.status,
      });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({
        status: '500',
        msg: 'Erro na solicitação. Retorne e tente novamente.',
        dados: 'Os dados foram inseridos com sucesso!',
        twilio_status: 'error',

      });
    });
}
app.post('/send/', async (req, res) => {
  const authorization = req.headers['authorization'];
  const hashValida = process.env.HASH;


  if (authorization === hashValida) {
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
    const descricao = req.body.descricao;
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

      const novaAcao = {
        id_acao: uuidv4(),
        id_criativo: idCriativo,
        id_campanha: idCampanha,
        id_usuario: idUsuario,
        id_cliente: idCliente,
        local: local,
      };

      const resultAcao = await supabase.from(tb_acoes).insert(novaAcao);
      if (resultAcao.error) {
        console.log(resultAcao.error);
      } else {
        console.log('Nova ação criada:', novaAcao.id_acao);

        sendNotification(nome, telefone, cliente, email, campanha, criativo, data_inicio, data_final, descricao, tel_cliente, res);
      }
    } catch (error) {
      console.log(error);
    }
  } else {
    res.status(403).json({ error: 'Acesso negado!' });
  }
});

// Método que insere o anunciante no BD

app.post('/create_client', async (req, res) => {
  const authorization = req.headers['authorization'];
  const hashValida = process.env.HASH;

  if (authorization === hashValida) {
      const nome_cliente = req.body.nome_cliente;
      const tel_cliente = req.body.tel_cliente;
      const autorizado = true;

      try {
          const { default: conectabd } = await import('./supabase.js');
          const supabase = conectabd();
          const tb_cliente = 'cliente';

          // Verificar se o cliente já existe no banco
          const { data: existingCliente } = await supabase
              .from(tb_cliente)
              .select()
              .eq('nome_cliente', nome_cliente)
              .single();

          if (existingCliente && existingCliente.id_cliente) {
              res.status(400).json({ error: 'Cliente já existe!' });
          } else {
              const idCliente = uuidv4();
              const novoCliente = {
                  id_cliente: idCliente,
                  nome_cliente: nome_cliente,
                  tel_cliente: tel_cliente,
                  autorizado: autorizado,
              };

              const { error } = await supabase.from(tb_cliente).insert(novoCliente);
              if (error) {
                  console.log(error);
                  res.status(500).json({ error: 'Erro ao inserir o cliente no banco de dados.' });
              } else {
                  res.status(200).json({ success: 'Cliente inserido com sucesso!' });
              }
          }
      } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Erro interno do servidor.' });
      }
  } else {
      res.status(403).json({ error: 'Acesso negado!' });
  }
});


app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
  // console.log("Hash recebida: ", authorization);
  // console.log("Hash esperada: ", hashValida);
});
