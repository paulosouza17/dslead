const http = require('http');

async function verificarSaudeServidor(ip) {
  const options = {
    host: ip,
    port: 3001, // Porta do servidor alvo
    path: '/health', // Rota de saúde do servidor alvo
    timeout: 2000, // Tempo máximo de espera para resposta (em milissegundos)
    headers: {
      'Authorization': '123'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.get(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (error) {
            reject('Erro ao analisar a resposta do servidor.');
          }
        } else {
          reject(`Código de status inesperado: ${res.statusCode}`);
        }
      });
    });

    req.on('error', (err) => {
      reject(`Erro ao se conectar ao servidor alvo: ${err.message}`);
    });

    req.on('timeout', () => {
      req.abort();
      reject('Tempo limite de conexão excedido.');
    });
  });
}

module.exports = verificarSaudeServidor;
