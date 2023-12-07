
// Método de verificação de saúde da VPS
// Responsável por informar à DASH do sistema
const express = require('express');
const os = require('os');
const app = express();

// Rota para verificar a saúde do servidor
app.get('/health', (req, res) => {
  const authHeader = req.headers.authorization;

  // Verifica se o cabeçalho de autorização está presente e no formato esperado

  // Verifica se a senha está correta
  if (authHeader === '123') {
    const health = {
      status: 'OK',
      storage: {
        total: os.totalmem(),
        free: os.freemem()
      },
      cpu: os.cpus()
    };

    res.json(health);
  } else {
    res.status(401).json({ error: 'Acesso não autorizado.' });
  }
}
);

// Inicia o servidor na porta desejada
const porta = 3001; // Porta na qual o servidor irá escutar
app.listen(porta, () => {
  console.log(`Servidor em execução na porta ${porta}`);
});
