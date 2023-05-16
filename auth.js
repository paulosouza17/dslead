const crypto = require('crypto');

function gerarHash(mensagem) {
  const hash = crypto.createHash('sha256');
  hash.update(mensagem);
  return hash.digest('hex');
}


const hashEsperada = "d41d8cd98f00b204e9800998ecf8427e";

