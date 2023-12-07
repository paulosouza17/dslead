// plugaIntegration.js
const axios = require('axios');

// Função para enviar dados para o Pluga
async function sendToPluga(data) {
  try {
    // Substitua 'URL_DO_SEU_ENDPOINT_PLUGA' pela URL do endpoint do Pluga
    const plugaEndpoint = process.env.PLUGAENDPOINT;
    
    // Realize uma solicitação POST para o Pluga
    const response = await axios.post(plugaEndpoint, data);

    return response.data;
  } catch (error) {
    throw new Error('Erro ao enviar dados para o Pluga: ' + error.message);
  }
}

module.exports = {
  sendToPluga,
};
