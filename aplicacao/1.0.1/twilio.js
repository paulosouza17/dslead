// Gatilho 1 - Whatsapp anunciante

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



// Gatilho 2 - Whatsapp usuario

function userNotification(tel_usuario, msg, res) {
    if (tel_usuario && tel_usuario.startsWith("9")) {
        tel_usuario = tel_usuario.substring(1);
    }
    const bodyTemplate = `Olá, ${usuario}! Gostaria de informar que ${mensagem_personalizada}`;

    client.messages
        .create({
            body: bodyTemplate,
            from: 'whatsapp:+' + dsleadnum,
            to: 'whatsapp:+' + tel_usuario,
            templateSid: 'user_notification'
        })
        .then((message) => {
            console.log('Mensagem enviada com sucesso:', message.sid);
            res.json({
                status: '200',
                msg: 'Mensagem ao usuário enviada com sucesso!',
                datahora: new Date(),
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






// Gatilho 3 - Email


// Gatilho 4 - API




















// Gatilho 5 - Integração Automação (Pluga)




module.exports = {
    clienteNotification,
    userNotification,
};
