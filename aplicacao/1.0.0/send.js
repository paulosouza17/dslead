require('dotenv').config();
const axios = require('axios');
const dsleadnum = process.env.DSLEADNUM;
const accountSid = process.env.ACCOUNTSID;
const authToken = process.env.AUTHTOKEN;

const client = require('twilio')(accountSid, authToken);
const { v4: uuidv4 } = require('uuid');

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));


// INTEGRAÇÃO PLUGA
const plugaIntegration = require('./plugaIntegration');







// API / Função para verificar se o nome é Masculino ou Feminino
async function getGender(name) {
  try {
    const response = await axios.get(`https://api.genderize.io?name=${name}`);
    return response.data.gender;
  } catch (error) {
    console.error('Erro ao verificar o gênero do nome:', error);
    return 'Desconhecido';
  }
}

// Função para enviar notificação via Twilio
function clienteNotification(nome, telefone, cliente, email, campanha, criativo, data_inicio, data_final, descricao, tel_cliente, res) {
  // Obtém a data e hora atual
  var dataHoraAtual = new Date();

  // Ajusta o fuso horário para UTC-3
  var fusoHorario = 0; // UTC-3
  var horaUTC3 = dataHoraAtual.getUTCHours() - fusoHorario;

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
  var horaFormat = hora - 3;
  var minutos = dataHoraAtual.getUTCMinutes();

  // Formata a data e hora no formato desejado (dd/mm/yyyy às hh:mm)
  var dataHoraFormatada = dia.toString().padStart(2, '0') + '/' + mes.toString().padStart(2, '0') + '/' + ano + ' às ' + horaFormat.toString().padStart(2, '0') + ':' + minutos.toString().padStart(2, '0');

  // Exibe a data e hora atual no fuso horário UTC-3
  console.log('Data e hora atual (UTC-3): ' + dataHoraFormatada);

  if (tel_cliente && tel_cliente.startsWith("9")) {
    tel_cliente = tel_cliente.substring(1);
  }

  const bodyTemplate = `Olá, ${cliente}! Gostaria de informar que recebemos mais um lead para você. Abaixo estão os dados que foram registrados:

  🎯 ${campanha}
  👤 ${nome}
  📞 ${telefone}
  ✉️ ${email}
  🕒 ${dataHoraFormatada}
  
  -- 
  ${descricao}`;

  client.messages
    .create({
      body: bodyTemplate,
      from: 'whatsapp:+' + dsleadnum,
      to: 'whatsapp:+' + tel_cliente,
      templateSid: 'alert_ds'
    })
    .then((message) => {
      console.log('Mensagem enviada com sucesso:', message.sid);
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
      console.error('Erro ao enviar mensagem via Twilio:', error);
      res.status(500).json({
        status: '500',
        msg: 'Erro na solicitação. Retorne e tente novamente.',
        dados: 'Os dados foram inseridos com sucesso!',
        twilio_status: 'error',
      });
    });
}

function userNotification(tel_usuario, msg, res) {
  if (tel_usuario && tel_usuario.startsWith("9")) {
    tel_usuario = tel_usuario.substring(1);
  }

  const bodyTemplate = msg;

  client.messages
    .create({
      body: bodyTemplate,
      from: 'whatsapp:+' + dsleadnum,
      to: 'whatsapp:+' + tel_usuario,
      templateSid: 'participation_notification'
    })
    .then((message) => {
      console.log('Mensagem de notificação enviada com sucesso:', message.sid);
      res.json({
        status: '200',
        msg: 'Sua mensagem foi enviada com sucesso!',
        datahora: dataHoraAtual,
        twilio_status: message.status,
      });
    })
    .catch((error) => {
      console.error('Erro ao enviar mensagem de notificação via Twilio:', error);
      res.status(500).json({
        status: '500',
        msg: 'Erro na solicitação. Retorne e tente novamente.',
        twilio_status: 'error',
      });
    });
}

// Obtem a lista de usuários 
app.get('/list', async (req, res) => {
  const authorization = req.headers['authorization'];
  const hashValida = process.env.HASH;

  if (authorization === hashValida) {
    try {
      const { default: conectabd } = await import('./supabase.js');
      const supabase = conectabd();

      const { data: acoesData, error: acoesError } = await supabase
        .from('acoes')
        .select('id_acao, id_cliente, id_campanha, id_usuario, created_at')
        .order('data_hora', { ascending: false });

      if (acoesError) {
        console.error('Erro ao obter a lista de usuários:', acoesError);
        res.status(500).json({ error: 'Erro interno do servidor.' });
        return;
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
      console.error('Erro ao obter a lista de usuários:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  } else {
    res.status(403).json({ error: 'Acesso negado!' });
  }
});

// Método de inserção e notificação
app.post('/send/', async (req, res) => {
  const {
    nome,
    telefone,
    email,
    nome_cliente: cliente,
    campanha,
    data_hora,
    data_inicio,
    data_final,
    criativo,
    tel_cliente,
    local,
    descricao,
  } = req.body;


  function dataHoraAmigavel() {
    var dataHoraAtual = new Date();

    // Ajusta o fuso horário para UTC-3
    var fusoHorario = 0; // UTC-3
    var horaUTC3 = dataHoraAtual.getUTCHours() - fusoHorario;

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
    var horaFormat = hora - 3;
    var minutos = dataHoraAtual.getUTCMinutes();

    // Formata a data e hora no formato desejado (dd/mm/yyyy às hh:mm)
    var dataHoraFormatada = dia.toString().padStart(2, '0') + '/' + mes.toString().padStart(2, '0') + '/' + ano + ' às ' + horaFormat.toString().padStart(2, '0') + ':' + minutos.toString().padStart(2, '0');

    return dataHoraFormatada;

  }


  // Dados que você deseja enviar para o Pluga
  const dataToPluga = {
    nome: req.body.nome,
    telefone: req.body.telefone,
    email: req.body.email,
    campanha: req.body.campanha,
    tel_cliente: req.body.tel_cliente,
    local: req.body.local,
    data_hora: dataHoraAmigavel()
  };


  console.log("Dados enviados ao Pluga:" + dataToPluga);

  const authorization = req.headers['authorization'];
  const hashValida = process.env.HASH;
  const autorizado = true;

  if (authorization === hashValida) {
    try {
      const { default: conectabd } = await import('./supabase.js');
      const supabase = conectabd();
      const tb_acoes = 'acoes';
      const tb_campanha = 'campanha';
      const tb_cliente = 'cliente';
      const tb_criativo = 'criativo';
      const tb_usuario = 'usuario';


      plugaIntegration.sendToPluga(dataToPluga)
        .then((response) => {
          console.log('Dados enviados com sucesso:', response);
        })
        .catch((error) => {
          console.error('Erro ao enviar dados para o Pluga:', error);
        });




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

        if (!cliente) {
          return res.status(400).json({ error: 'O campo "nome_cliente" é obrigatório.' });
        }

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

        if (!campanha) {
          return res.status(400).json({ error: 'O campo "campanha" é obrigatório.' });
        }

        await supabase.from(tb_campanha).insert(novaCampanha);
        console.log('Nova campanha criada:', idCampanha);
      }

      // Verificar se o criativo já existe no banco
      let idCriativo = '';

      let idUsuario;
      const { data: existingUsuario } = await supabase
        .from(tb_usuario)
        .select()
        .eq('telefone', telefone)
        .eq('email', email)
        .single();

      if (existingUsuario && existingUsuario.telefone) {
        idUsuario = existingUsuario.id_usuario;
        console.log('Usuário já existe:', idUsuario + " " + telefone + " " + email);
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

      const { data: existingAcao } = await supabase
        .from(tb_acoes)
        .select()
        .eq('id_usuario', idUsuario)
        .eq('id_campanha', idCampanha)
        .single();

      if (existingAcao && existingAcao.id_acao) {
        console.log('Este usuário já está vinculado à esta campanha:', idUsuario);
        res.status(400).json({ error: 'Ação já existe para o usuário nesta campanha!' });
      } else {
        const novaAcao = {
          id_acao: uuidv4(),
          id_criativo: null,
          id_campanha: idCampanha,
          id_usuario: idUsuario,
          id_cliente: idCliente,
          data_hora: data_hora,
          local: local,
        };

        const resultAcao = await supabase.from(tb_acoes).insert(novaAcao);
        if (resultAcao.error) {
          console.log('Erro ao criar nova ação:', resultAcao.error);
          res.status(500).json({ error: 'Erro ao criar ação.' });
        } else {
          console.log('Nova ação criada:', novaAcao.id_acao);
          clienteNotification(nome, telefone, cliente, email, campanha, criativo, data_inicio, data_final, descricao, tel_cliente, res);
        }
      }
    } catch (error) {
      console.error('Erro no método de inserção e notificação:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
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
    const autorizado = autorizado;

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
          console.error('Erro ao criar cliente:', error);
          res.status(500).json({ error: 'Erro ao inserir o cliente no banco de dados.' });
        } else {
          console.log('Cliente inserido com sucesso:', idCliente);
          res.status(200).json({ success: 'Cliente inserido com sucesso!' });
        }
      }
    } catch (error) {
      console.error('Erro ao inserir cliente:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  } else {
    res.status(403).json({ error: 'Acesso negado!' });
  }
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
