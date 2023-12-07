
exports.template = function (param) {

    //Template 1 é o modelo  que chegará ao cliente
    if (param == 1) {
        body = `Olá, ${cliente}! Gostaria de informar que recebemos mais um lead para você. Abaixo estão os dados que foram registrados:

        🎯 ${campanha}
        👤 ${nome}
        📞 ${telefone}
        ✉️ ${email}
        🕒 ${dataHoraFormatada}
        
        -- 
        ${descricao}`
    }
    return body;
}
