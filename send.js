// MÓDULO RESPONSÁVEL PELO MÉTODO POST /SEND DE ENVIO DE MENSAGEM WHATSAPP

// DADOS TWILIO - MOTOR DE WHATSAPP QUE USA API OFICIAL
const accountSid = 'AC8b88b3faa876a039956cd230105fd85f';
const authToken = 'fef2ceaf9b9474cef9accd6f0d1c5044';
const client = require('twilio')(accountSid, authToken);
const { v4: uuidv4 } = require('uuid');

const hashValida = 'd41d8cd98f00b204e9800998ecf8427e';

// MODULO EXPRESS
const express = require('express');
const app = express();


// MODULO BODY
const bodyParser = require('body-parser');
const { randomUUID } = require('crypto');
app.use(bodyParser.urlencoded({ extended: true }));

const db = import('./db.mjs');
const cta = "_Clique no número do lead para iniciar uma conversa_";

function tratanumero(numero) {
  if (!numero.includes("+")) {
    numero = "+" + numero;
  }
  return numero;
}

// ----------------------- //

const dsleadnum = "+14155238886";
app.post('/send/', (req, res) => {
  const hash = req.headers['hash'];

  if (hash === hashValida) {

    const nome = req.body.nome;
    const telefone = tratanumero(req.body.telefone);
    const email = req.body.email;
    const cliente = req.body.nome_cliente;
    const campanha = req.body.campanha;
    const criativo = req.body.criativo;
    const tel_cliente = req.body.tel_cliente;
    const telclienteprov = "556183783766";
    const data = req.body.datahora;
    const local = req.body.local;
    const body = req.body;

    // CONECTA BD
    const conectabd = require('./supabase.js');
    const supabase = conectabd();

    // TABELAS
    const tb_cliente = 'cliente';
    const tb_usuario = 'usuario';
    const tb_acoes = 'acoes';


    // INSERE NOVO USUARIO NA TABELA USUARIO


    const novoCliente = {
      id: uuidv4(),
      nome_cliente: cliente,
      tel_cliente: tel_cliente,
      campanha: campanha,
      criativo: criativo
    };

    const novoUsuario = {
      id: uuidv4(),
      nome_usuario: nome,
      telefone: telefone,
      email: email
    };


    // Inserir novo usuário na tabela "usuario"
    supabase.from(tb_usuario).insert(novoUsuario).then((resultUser) => {
      if (resultUser.error) {
        console.log(resultUser.error);
      } else {
        const idUsuario = resultUser.data ? resultUser.data[0].id : null;
        console.log(idUsuario);


        // Inserir novo cliente na tabela "cliente"
        supabase.from(tb_cliente).insert(novoCliente).then((resultCliente) => {
          if (resultCliente.error) {
            console.log(resultCliente.error);
          } else {
            const idCliente = novoCliente.id;
            const idUsuario = novoUsuario.id;
            console.log(idCliente);

            const novaAcao = {
              id: uuidv4(),
              id_cliente: idCliente,
              id_usuario: idUsuario,
              data_hora: req.body.data_hora,
              local: req.body.local
            };

            // Inserir nova ação na tabela "acoes"
            supabase.from(tb_acoes).insert(novaAcao).then((resultAcao) => {
              if (resultAcao.error) {
                console.log(resultAcao.error);
              } else {
                if (resultAcao.data && resultAcao.data.length > 0) {
                  console.log('Nova ação inserida com sucesso!');
                } else {
                  console.log('Erro ao inserir nova ação');
                }
              }
            }).catch((error) => {
              console.log(error);
            });
          }
        }).catch((error) => {
          console.log(error);
        });

      }
    }).catch((error) => {
      console.log(error);
    });


    // CONVERTE TIMESTAMP

    function verificaTimestamp(){
      if (req.body.data_hora < 1600000000 || req.body.data_hora == null || req.body.data_hora == 0){
        timestamp = new Date(timestamp * 1000).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        console.log(timestamp);
      }else{
        timestamp = req.body.data_hora;
        
      }
      return timestamp;
    }

    var timestamp = verificaTimestamp(); // Unix Timestamp em segundos
    var datahora = new Date(timestamp * 1000); // converte o Unix Timestamp em milissegundos e cria um objeto Date()
    var opcoes = { timeZone: 'America/Sao_Paulo' }; // define as opções de formatação

    var dataconvertida = {
      data: datahora.toLocaleDateString('pt-BR', opcoes), // converte a data em uma string no formato desejado
      hora: datahora.toLocaleTimeString('pt-BR', opcoes) // converte a hora em uma string no formato desejado
    };

    // ENVIA MSG
    client.messages.create({
      body: `*Alerta de Lead*: \n \n *Nome*: ` + nome + `\n *Telefone:* ` + telefone + `\n *Email:* ` + email + `\n *Campanha:* ` + campanha + ` \n *Peça:* ` + criativo + `\n *Data:* ` + dataconvertida.data + `\n *Hora:* ` + dataconvertida.hora + `\n \n` + cta,
      from: 'whatsapp:' + dsleadnum,
      // mediaUrl: criativo,
      to: "whatsapp:+" + telclienteprov
    })
      .then(message => {
        console.log(message.sid);
        res.json({ status: "200", msg: "Sua mensagem foi enviada com sucesso! Em breve retornaremos seu contato.", body: body, datahora: datahora });
        // console.log(req)
      })
      .catch(error => {
        console.error(error);
        res.status(500).json({ status: "500", msg: "Erro ao enviar mensagem. Volte e tente novamente." });
      });

  } else {

    // Hash inválido, retorne um erro
    res.status(400).json({ error: 'Hash inválido' });
  }
});


app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});

