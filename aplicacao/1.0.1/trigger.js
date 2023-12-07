// Importing required modules
require('dotenv').config();
const twilio = require('twilio');

// Fetching Twilio credentials from environment variables
const accountSid = process.env.ACCOUNTSID;
const authToken = process.env.AUTHTOKEN;
const dsleadnum = process.env.DSLEADNUM;
const tel_cliente = req.body.tel_cliente;
const tel_usuario = req.body.telefone;

console.log('Telefone Cliente' + tel_cliente);
console.log('Telefone Usuario' + tel_usuario);


// Ensure all required environment variables are set
if (!accountSid || !authToken || !dsleadnum) {
    console.error('Please set ACCOUNTSID, AUTHTOKEN, and DSLEADNUM environment variables.');
    process.exit(1);
}

// Initializing Twilio client
const client = twilio(accountSid, authToken);

// Gatilho 1 - Whatsapp anunciante
async function clienteNotification(nome, telefone, cliente, email, campanha, criativo, data_inicio, data_final, descricao, tel_cliente, res) {
    try {
        // Obtaining current date and time
        var dataHoraAtual = new Date();

        // Ajustando o fuso horário para UTC-3 e outros cálculos de data e hora...

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

        // Adicionando instruções de depuração
        console.log('Cliente Notification - Enviando mensagem para:', tel_cliente);
        console.log('Cliente Notification - Mensagem:', bodyTemplate);

        // Substituindo 'client' com a definição real do seu objeto Twilio


        const message = await client.messages.create({
            body: bodyTemplate,
            from: 'whatsapp:+' + dsleadnum,
            to: 'whatsapp:+' + tel_cliente,
            templateSid: 'alert_ds'
        });

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
    } catch (error) {
        console.error('Erro ao enviar mensagem via Twilio:', error);
        res.status(500).json({
            status: '500',
            msg: 'Erro na solicitação. Retorne e tente novamente.',
            dados: 'Os dados foram inseridos com sucesso!',
            twilio_status: 'error',
        });
    }
}

// Gatilho 2 - Whatsapp usuário
async function userNotification(tel_usuario, nome, urlCriativo, mensagem_personalizada, res) {
    try {
        // Obtendo data e hora atual
        var dataHoraAtual = new Date();

        // Ajustando o fuso horário para UTC-3 e outros cálculos de data e hora...

        if (tel_usuario && tel_usuario.startsWith("9")) {
            tel_usuario = tel_usuario.substring(1);
        }

        const bodyTemplate = `Olá, ${nome}! Gostaria de informar que ${mensagem_personalizada}`;

        // Verificando se urlCriativo foi fornecido
        const mediaUrl = urlCriativo ? urlCriativo : null;

        const messageOptions = {
            body: bodyTemplate,
            from: 'whatsapp:+' + dsleadnum,
            to: 'whatsapp:+' + tel_usuario,
            templateSid: 'user_notification'
        };

        // Adicionando mediaUrl apenas se estiver presente
        if (mediaUrl) {
            messageOptions.mediaUrl = mediaUrl;
        }

        // Adicionando instruções de depuração
        console.log('User Notification - Enviando mensagem para:', tel_usuario);
        console.log('User Notification - Mensagem:', bodyTemplate);

        // Substituindo 'client' com a definição real do seu objeto Twilio
        const message = await client.messages.create(messageOptions);

        console.log('Mensagem enviada com sucesso:', message.sid);
        res.json({
            status: '200',
            msg: 'Mensagem ao usuário enviada com sucesso!',
            datahora: new Date(),
            twilio_status: message.status,
        });
    } catch (error) {
        console.error('Erro ao enviar mensagem via Twilio:', error);
        res.status(500).json({
            status: '500',
            msg: 'Erro na solicitação. Retorne e tente novamente.',
            dados: 'Os dados foram inseridos com sucesso!',
            twilio_status: 'error',
        });
    }
}

// Exportando as funções
module.exports = {
    clienteNotification,
    userNotification,
};
