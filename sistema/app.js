const express = require('express');
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');
const path = require('path');
const supabase = require('./bd');
const supabasedslead = require('./bd_dslead');
const verificarSaudeServidor = require('./health');

// const express = require('express');
const session = require('express-session');
const validator = require('validator');
const uuid = require('uuid');
const bcrypt = require('bcrypt');



const app = express();
app.use(express.json());
app.use(session({
    secret: 'proi9',
    resave: false,
    saveUninitialized: true
}));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Verifica a conexão com o Supabase
(async () => {
    try {
        const { data, error } = await supabasedslead.from('campanha').select();

        if (error) {
            console.error('Erro ao conectar ao DSLEAD:', error);
        } else {
            console.log('Conexão com o DSLEAD estabelecida com sucesso!');
        }
    } catch (error) {
        console.error('Erro ao conectar ao DSLEAD:', error);
    }
})();

let users = [];
let veiculos = [];
let anunciantes = [];
let vpsData = {};
let campanhas = [];

// Página Inicial
app.get('/', async (req, res) => {
    res.render('dash', { page: 'home', veiculos });
    console.log('Página inicial');
});

// Página Dash
app.get('/dash', requireAuth, async (req, res) => {
    try {
        // Verifica a saúde do servidor
        const healthResponse = await verificarSaudeServidor('154.49.246.214');
        console.log('Conexão com o servidor estabelecida com sucesso:', healthResponse);

        // Obtenha os dados da tabela "veiculos" do Supabase
        const { data, error } = await supabase.from('veiculos').select();

        if (error) {
            throw error;
        }

        veiculos = data; // Atribua os dados obtidos à variável veiculos

        res.render('dash', { page: 'home', veiculos });
    } catch (error) {
        console.error('Erro ao obter dados de veiculos ou verificar a saúde do servidor:', error);
        res.status(500).send('Erro ao obter dados de veiculos ou verificar a saúde do servidor');
    }
});

// Rota para exibir a lista de veículos
app.get('/veiculos/', async (req, res) => {
    try {
        // Obtenha os dados da tabela "veiculos" do Supabase
        const { data, error } = await supabase.from('veiculos').select();

        if (error) {
            throw error;
        }

        veiculos = data; // Atualiza a variável com os dados dos veículos

        res.render('list_veiculos', { page: 'list_veiculos', veiculos });
    } catch (error) {
        console.error('Erro ao obter lista de veículos:', error);
        res.status(500).send('Erro ao obter lista de veículos');
    }
});

// Rota para exibir a lista de anunciantes
app.get('/anunciantes/', (req, res) => {
    res.render('list_anunciantes', { page: 'list_anunciantes', anunciantes });
});

// Rota para exibir o formulário de adicionar veículo
app.get('/veiculos/add', (req, res) => {
    res.render('add_veiculo', { page: 'add_veiculo' });
});

// Rota para exibir o formulário de adicionar anunciante
app.get('/anunciantes/add', (req, res) => {
    res.render('add_anunciante', { page: 'add_anunciante' });
});

// Rota para exibir o formulário de adicionar campanha
app.get('/campanhas/add', (req, res) => {
    res.render('add_campanha', { page: 'add_campanha' });
});


// Rota para exibir o formulário de edição de VPS
app.get('/vps/edit/:id', (req, res) => {
    const vpsId = req.params.id;

    // Encontre a VPS correspondente com base no ID
    const vps = getVPSDataById(vpsId); // Passa o ID como parâmetro

    if (!vps) {
        res.status(404).send('VPS não encontrada');
    } else {
        res.render('edit_vps', { page: 'edit_vps', vps });
    }
});

// Função para obter dados da VPS pelo ID
async function getVPSDataById(id) {
    try {
        // Implemente a lógica para buscar as informações no banco de dados usando o ID fornecido
        // Você pode usar o supabase.from('vps').select() ou outra lógica específica para o seu caso

        // Exemplo de retorno:
        return {
            id: uuid.v4(),
            nome: req.body.nome,
            ip: req.body.ip,
            hash: req.body.hash,
            status: req.body.status
        };
    } catch (error) {
        console.error('Erro ao obter dados da VPS:', error);
        return null; // Retorna null em caso de erro
    }
}


// Rota para atualizar uma VPS via AJAX
app.post('/vps/update/:id', async (req, res) => {
    const vpsId = req.params.id;

    // Encontre a VPS correspondente com base no ID
    const vpsIndex = vpsData.findIndex(v => v.id === vpsId);

    if (vpsIndex === -1) {
        res.status(404).json({ error: 'VPS não encontrada' });
    } else {
        const updatedVpsData = {
            id: vpsId,
            nome: req.body.nome,
            ip: req.body.ip,
            hash: req.body.hash,
            status: req.body.status
        };

        // Atualize os dados da VPS na tabela "vps" do Supabase
        const { data, error } = await supabase
            .from('vps')
            .update(updatedVpsData)
            .match({ id: vpsId });

        if (error) {
            console.error('Erro ao atualizar VPS:', error);
            res.status(500).json({ error: 'Erro ao atualizar VPS' });
        } else {
            vpsData[vpsIndex] = updatedVpsData; // Atualize vpsData com os novos dados da VPS
            console.log('VPS atualizada com sucesso:', updatedVpsData);
            res.json({ message: 'VPS atualizada com sucesso' });
        }
    }
});








// Rota para adicionar um veículo
app.post('/veiculos/register',  [
    body('nome').notEmpty().isString(),
    body('nome_fantasia').notEmpty().isString(),
    // Add validation rules for other fields
], requireAuth,  async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const veiculoData = {
            id: uuid.v4(),
            nome: req.body.nome,
            nome_fantasia: req.body.nome_fantasia,

        };

        console.log('Iniciando inserção de veículo:', veiculoData);

        // Insere o registro na tabela "veiculos" do Supabase
        const { data, error } = await supabase.from('veiculos').insert([veiculoData]);

        if (error) {
            throw error;
        }

        console.log('Veículo adicionado com sucesso:', veiculoData);
        res.send('Veículo adicionado com sucesso!');
    } catch (error) {
        console.error('Erro na rota /veiculos/register:', error);
        res.status(500).send('Erro interno ao processar a rota /veiculos/register');
    }
});

// Rota para adicionar um anunciante
app.post('/anunciantes/register', requireAuth, async (req, res) => {
    const anuncianteData = {
        id: uuid.v4(),
        nome: req.body.nome,
        email: req.body.email,
        telefone: req.body.telefone,
        cnpj: req.body.cnpj,
        status: req.body.status
    };

    console.log('Iniciando inserção de anunciante:', anuncianteData);

    anunciantes.push(anuncianteData); // Adiciona o anunciante aos dados em memória

    console.log('Anunciante adicionado com sucesso:', anuncianteData);
    res.send('Anunciante adicionado com sucesso!');
});






// Rota para exibir o formulário de adicionar VPS
app.get('/vps/add', requireAuth, async (req, res) => {
    res.render('add_vps', { page: 'add_vps' });
});


app.get('/vps/:id', async (req, res) => {
    const id = req.params.id;

    // Agora, você deve usar esse ID para buscar as informações correspondentes
    // no seu banco de dados ou outra fonte de dados.
    // Aqui, estou apenas criando um objeto de exemplo:

    const vpsData = await getVPSDataById(id); // função hipotética para buscar dados

    res.render('view_vps', { vps: vpsData, page: 'view_vps' });
});







// Rota para exibir o formulário de edição de veículo
app.get('/veiculos/edit/:id', (req, res) => {
    const veiculoId = req.params.id;

    // Encontre o veículo correspondente com base no ID
    const veiculo = veiculos.find(v => v.id === veiculoId);

    if (!veiculo) {
        res.status(404).send('Veículo não encontrado');
    } else {
        res.render('edit_veiculo', { page: 'edit_veiculo', veiculo });
    }
});

// Rota para atualizar um veículo via AJAX
app.post('/veiculos/update/:id', async (req, res) => {
    const veiculoId = req.params.id;

    // Encontre o veículo correspondente com base no ID
    const veiculoIndex = veiculos.findIndex(v => v.id === veiculoId);

    if (veiculoIndex === -1) {
        res.status(404).json({ error: 'Veículo não encontrado' });
    } else {
        const updatedVeiculoData = {
            id: veiculoId,
            nome: req.body.nome,
            nome_fantasia: req.body.nome_fantasia,
            email: req.body.email,
            cnpj: req.body.cnpj,
            telefone: req.body.telefone,
            nome_responsavel: req.body.nome_responsavel,
            telefone_responsavel: req.body.telefone_responsavel,
            email_responsavel: req.body.email_responsavel,
            hash: req.body.hash,
            ip_vps: req.body.ip_vps,
            status: req.body.status
        };

        // Atualize os dados do veículo na tabela "veiculos" do Supabase
        const { data, error } = await supabase
            .from('veiculos')
            .update(updatedVeiculoData)
            .match({ id: veiculoId });

        if (error) {
            console.error('Erro ao atualizar veículo:', error);
            res.status(500).json({ error: 'Erro ao atualizar veículo' });
        } else {
            console.log('Veículo atualizado com sucesso:', updatedVeiculoData);
            res.json({ message: 'Veículo atualizado com sucesso' });
        }
    }
});

// Rota para excluir um veículo
app.post('/veiculos/delete/:id', async (req, res) => {
    const veiculoId = req.params.id;

    // Encontre o veículo correspondente com base no ID
    const veiculoIndex = veiculos.findIndex(v => v.id === veiculoId);

    if (veiculoIndex === -1) {
        res.status(404).json({ error: 'Veículo não encontrado' });
    } else {
        // Remova o veículo da tabela "veiculos" do Supabase
        const { data, error } = await supabase
            .from('veiculos')
            .delete()
            .match({ id: veiculoId });

        if (error) {
            console.error('Erro ao excluir veículo:', error);
            res.status(500).json({ error: 'Erro ao excluir veículo' });
        } else {
            veiculos.splice(veiculoIndex, 1); // Remova o veículo da lista em memória
            console.log('Veículo excluído com sucesso:', veiculoId);
            res.json({ message: 'Veículo excluído com sucesso' });
        }
    }
});

veiculos.forEach(function (veiculo) {
    // Verifica o status do veículo e atribui a classe CSS correspondente
    switch (veiculo.status) {
        case 'ativo':
            veiculo.statusClass = 'active';
            break;
        case 'implementando':
            veiculo.statusClass = 'implementando';
            break;
        case 'inativo':
            veiculo.statusClass = 'inativo';
            break;
        case 'encerrado':
            veiculo.statusClass = 'encerrado';
            break;
        default:
            veiculo.statusClass = '';
            break;
    }
});



// Rota para exibir a lista de VPS
app.get('/vps/', requireAuth, async (req, res) => {
    try {
        // Obtenha os dados da tabela "vps" do Supabase
        const { data, error } = await supabase.from('vps').select();

        if (error) {
            throw error;
        }

        vpsData = data;

        res.render('list_vps', { page: 'list_vps', vps: vpsData }); // Correção: utilize vpsData em vez de vps
    } catch (error) {
        console.error('Erro ao obter lista de VPS:', error);
        res.status(500).send('Erro ao obter lista de VPS');
    }
});

// Rota para exibir o formulário de edição de VPS
app.get('/vps/edit/:id', (req, res) => {
    const vpsId = req.params.id;

    // Encontre a VPS correspondente com base no ID
    const vps = vpsData.find(v => v.id === vpsId); // Correção: utilize vpsData em vez de vps

    if (!vps) {
        res.status(404).send('VPS não encontrada');
    } else {
        res.render('edit_vps', { page: 'edit_vps', vps });
    }
});

// Rota para atualizar uma VPS via AJAX
app.post('/vps/update/:id', async (req, res) => {
    const vpsId = req.params.id;

    // Encontre a VPS correspondente com base no ID
    const vpsIndex = vpsData.findIndex(v => v.id === vpsId); // Correção: utilize vpsData em vez de vps

    if (vpsIndex === -1) {
        res.status(404).json({ error: 'VPS não encontrada' });
    } else {
        const updatedVpsData = {
            id: vpsId,
            nome: req.body.nome,
            ip: req.body.ip,
            hash: req.body.hash,
            status: req.body.status
        };

        // Atualize os dados da VPS na tabela "vps" do Supabase
        const { data, error } = await supabase
            .from('vps')
            .update(updatedVpsData)
            .match({ id: vpsId });

        if (error) {
            console.error('Erro ao atualizar VPS:', error);
            res.status(500).json({ error: 'Erro ao atualizar VPS' });
        } else {
            vpsData[vpsIndex] = updatedVpsData; // Atualize vpsData com os novos dados da VPS
            console.log('VPS atualizada com sucesso:', updatedVpsData);
            res.json({ message: 'VPS atualizada com sucesso' });
        }
    }
});

// Rota para excluir uma VPS
app.post('/vps/delete/:id', async (req, res) => {
    const vpsId = req.params.id;

    // Encontre a VPS correspondente com base no ID
    const vpsIndex = vpsData.findIndex(v => v.id === vpsId);

    if (vpsIndex === -1) {
        res.status(404).json({ error: 'VPS não encontrada' });
    } else {
        // Remova a VPS da tabela "vps" do Supabase
        const { data, error } = await supabase
            .from('vps')
            .delete()
            .match({ id: vpsId });

        if (error) {
            console.error('Erro ao excluir VPS:', error);
            res.status(500).json({ error: 'Erro ao excluir VPS' });
        } else {
            vpsData.splice(vpsIndex, 1); // Remova a VPS de vpsData
            console.log('VPS excluída com sucesso:', vpsId);
            res.json({ message: 'VPS excluída com sucesso' });
        }
    }
});


app.get('/campanhas/', requireAuth, async (req, res) => {
    try {
        const { data: campanhas, error } = await supabasedslead
            .from('campanha')
            .select();

        if (error) {
            console.error('Erro ao obter lista de campanhas no Supabase:', error);
            res.status(500).send('Erro ao obter lista de campanhas');
        } else {
            res.render('list_campanhas', { page: 'list_campanhas', campanhas });
        }
    } catch (error) {
        console.error('Erro desconhecido ao obter lista de campanhas:', error);
        res.status(500).send('Erro ao obter lista de campanhas');
    }
});


// Rota para registrar uma nova campanha
app.post('/campanhas/register', async (req, res) => {
    try {
        // Verifique se o cliente já existe na tabela 'cliente' pelo nome
        const existingCliente = await supabasedslead
            .from('cliente')
            .select('id_cliente')
            .eq('nome_cliente', req.body.nome_cliente);

        let id_cliente;

        let cliente; // Declare cliente variable here

        if (existingCliente.data && existingCliente.data.length > 0) {
            // Se o cliente existe, use o ID existente
            id_cliente = existingCliente.data[0].id_cliente;
        } else {
            // Se o cliente não existe, gere um novo UUID
            id_cliente = uuid.v4();

            // Insira dados na tabela 'cliente'
            const { data, error } = await supabasedslead
                .from('cliente')
                .insert({
                    id_cliente: id_cliente,
                    nome_cliente: req.body.nome_cliente,
                    tel_cliente: req.body.telefone_cliente
                });

            if (error) {
                throw error;
            }

            cliente = data; // Set the value of cliente here
        }

        // Gere UUID para o ID da campanha
        const id_campanha = uuid.v4();

        const campanhaData = {
            id_campanha: id_campanha,
            id_cliente: id_cliente,
            campanha: req.body.nome_campanha,
            gatilho: req.body.gatilho,
            url_criativo: req.body.url_criativo,
            mensagem_personalizada: req.body.mensagem_personalizada
        };

        // Insira dados na tabela 'campanha'
        const { data: campanha, error: campanhaError } = await supabasedslead
            .from('campanha')
            .insert(campanhaData);

        if (campanhaError) {
            throw campanhaError;
        }

        res.status(201).json({ success: true, cliente: cliente || null, campanha: campanhaData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
});

app.get('/campanhas/edit/:id', async (req, res) => {
    const campanhaId = req.params.id;

    try {
        // Encontre a campanha correspondente no Supabase com base no ID
        const { data: campanha, error } = await supabasedslead
            .from('campanha')
            .select('*')
            .eq('id_campanha', campanhaId)
            .single();

        if (error || !campanha) {
            console.error('Erro ao buscar campanha:', error);
            return res.status(404).send('Campanha não encontrada');
        }

        // Agora, vamos buscar as informações do cliente relacionado
        const { data: cliente, error: clienteError } = await supabasedslead
            .from('cliente')
            .select('nome_cliente')
            .eq('id_cliente', campanha.id_cliente)
            .single();

        if (clienteError || !cliente) {
            console.error('Erro ao buscar informações do cliente:', clienteError);
            return res.status(500).send('Erro ao buscar informações do cliente');
        }

        // Adicionando o nome do cliente aos dados da campanha
        campanha.nome_cliente = cliente.nome;

        res.render('edit_campanha', { page: 'edit_campanha', campanha, cliente });

        console.log('Editando campanha ' + campanhaId);
    } catch (e) {
        console.error('Erro na rota /campanhas/edit/:id:', e);
        res.status(500).send('Erro interno');
    }
});

app.post('/campanhas/update/:id', async (req, res) => {
    const campanhaId = req.params.id;

    try {
        // Substitua as linhas removidas pelo código abaixo
        const { data: existingCampanha, error: existingCampanhaError } = await supabasedslead
            .from('campanha')
            .select('*')
            .eq('id_campanha', campanhaId)
            .single();

        if (existingCampanhaError || !existingCampanha) {
            console.error('Campanha não encontrada:', existingCampanhaError);
            return res.status(404).json({ error: 'Campanha não encontrada' });
        }

        const updatedCampanhaData = {
            id_campanha: campanhaId,
            campanha: req.body.campanha,
            nome_cliente: req.body.nome_cliente,
            status: req.body.status,
            gatilho: req.body.gatilho,
            url_criativo: req.body.url_criativo,
            mensagem_personalizada: req.body.mensagem_personalizada
        };

        // Atualize os dados da campanha na tabela "campanha" do Supabase
        const { data, error } = await supabasedslead
            .from('campanha')
            .update(updatedCampanhaData)
            .match({ id_campanha: campanhaId });

        if (error) {
            console.error('Erro ao atualizar campanha:', error);
            return res.status(500).json({ error: 'Erro ao atualizar campanha' });
        }

        console.log('Campanha atualizada com sucesso:', updatedCampanhaData);
        res.json({ message: 'Campanha atualizada com sucesso' });
    } catch (e) {
        console.error('Erro na rota /campanhas/update/:id:', e);
        res.status(500).json({ error: 'Erro interno' });
    }
});








// Rota para excluir um veículo
app.post('/campanhas/delete/:id', async (req, res) => {
    const campanhaId = req.params.id;

    // Encontre o veículo correspondente com base no ID
    const campanhaIndex = campanha.findIndex(v => v.id === campanhaId);

    if (campanhaIndex === -1) {
        res.status(404).json({ error: 'Veículo não encontrado' });
    } else {
        // Remova o campanha da tabela "campanha" do Supabase
        const { data, error } = await supabasedslead
            .from('campanha')
            .delete()
            .match({ id: campanhaId });

        if (error) {
            console.error('Erro ao excluir campanha:', error);
            res.status(500).json({ error: 'Erro ao excluir campanha' });
        } else {
            veiculos.splice(campanhaIndex, 1); // Remova a campanha da lista em memória
            console.log('Campanha excluída com sucesso:', campanhaId);
            res.json({ message: 'Campanha excluída com sucesso' });
        }
    }
});






app.get('/usuarios', async (req, res) => {
    const authorization = req.headers['authorization'];
    const hashValida = process.env.HASH;
    try {
        function conectabd() {
            const { createClient } = require('@supabase/supabase-js');
            const supabaseUrl = 'https://vwevbdowmjoyrrcqicpq.supabase.co';
            const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3ZXZiZG93bWpveXJyY3FpY3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODEzMTMwMjQsImV4cCI6MTk5Njg4OTAyNH0.uLg0v5Knh0EKvz-kJIPFKF3d3fCLvwU_utE6vWEjUZM';

            const dslead = createClient(supabaseUrl, supabaseKey);

            return dslead;
        }

        const dslead = conectabd();

        const { data: acoesData, error: acoesError } = await dslead
            .from('acoes')
            .select('id_acao, id_cliente, id_campanha, id_usuario, data_hora')
            .order('data_hora', { ascending: false });


        if (acoesError) {
            throw acoesError;
        }

        const resultados = await Promise.all(
            acoesData.map(async (acao) => {
                const [clienteData, campanhaData, usuarioData] = await Promise.all([
                    dslead.from('cliente').select('nome_cliente').eq('id_cliente', acao.id_cliente).single(),
                    dslead.from('campanha').select('campanha').eq('id_campanha', acao.id_campanha).single(),
                    dslead.from('usuario').select('nome_usuario, telefone, email').eq('id_usuario', acao.id_usuario).single(),

                ]);

                const data_hora = new Date(acao.data_hora);
                data_hora.setHours(data_hora.getHours() + 3);
                const data_hora_formatada = data_hora.toLocaleString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

                return {
                    nome_cliente: clienteData.data?.nome_cliente,
                    campanha: campanhaData.data?.campanha,
                    nome_usuario: usuarioData.data?.nome_usuario,
                    telefone: usuarioData.data?.telefone,
                    email: usuarioData.data?.email,
                    data_hora_acao: data_hora_formatada
                };
            })
        );

        res.render('list_usuarios', { page: 'Listar Usuários', usuarios: resultados });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Erro interno do servidor.', details: error.message });
    }
});



// Rota de Login
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const { data: user, error } = await supabase
            .from('usuarios')
            .select('id, email, senha, nome')
            .eq('email', email)
            .single();

        if (error) {
            console.error("Erro ao buscar usuário no banco de dados:", error);
            return res.status(500).json({ error: 'Erro interno durante o login' });
        }

        if (!user || !bcrypt.compareSync(senha, user.senha)) {
            console.error("Credenciais inválidas para o email:", email);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        req.session.user = {
            id_usuario: user.id,
            email: user.email,
            nome: user.nome
        };
        console.log(user.nome)
        console.log(`Login bem-sucedido para o usuário: ${user.email}`);
        
        // Check if it's an AJAX request
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({ message: 'Login bem-sucedido' });
        }

        // Redirecionar para a página inicial após o login bem-sucedido
        res.redirect('/campanhas');
        
    } catch (e) {
        console.error("Erro durante o login:", e);

        // Check if it's an AJAX request
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(500).json({ error: 'Erro interno durante o login' });
        }

        res.status(500).json({ error: 'Erro interno durante o login' });
    }
});



// Middleware para verificar autenticação
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).redirect('/login');
        
    }
    next();
}
// Rota para renderizar a página de login
app.get('/login', (req, res) => {
    res.render('login', { message: null });

});

// Rota para renderizar a página de registro
app.get('/user/cadastro', (req, res) => {
    res.render('cadastro', { message: null });
});

// Rota de Registro
app.post('/user/cadastro', async (req, res) => {
    const { email, senha } = req.body;

    try {
        // Exemplo de validação de e-mail
        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: 'E-mail inválido' });
        }

        // Exemplo de validação de senha
        if (senha.length < 8) {
            return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres' });
        }

        const { data: existingUser, error } = await supabase
            .from('usuarios')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            console.error("E-mail já está em uso.");
            return res.status(400).json({ error: 'E-mail já está em uso' });
        }

        const hashedPassword = bcrypt.hashSync(senha, 10);

        const { data: newUser, error: newUserError } = await supabase
            .from('usuarios')
            .insert({
                id: uuid.v4(),
                email: email,
                senha: hashedPassword,
                tipo: 'admin',
                status: true
                // Adicione outros campos conforme necessário
            });

        if (newUserError) {
            console.error("Erro ao registrar o usuário:", newUserError);
            return res.status(500).json({ error: 'Erro ao registrar o usuário' });
        }

        // Registro bem-sucedido, renderize a view 'register.ejs'
        res.render('register', { title: 'Registro bem-sucedido', user: newUser, userId: newUser.id });
    } catch (e) {
        console.error("Erro durante o registro:", e);
        res.status(500).json({ error: 'Erro interno durante o registro' });
    }
});


// Rota de Logout
app.get('/logout', (req, res) => {
    // Verifique se o usuário está autenticado
    if (req.session.user) {
        // Destrua a sessão do usuário
        req.session.destroy((err) => {
            if (err) {
                console.error("Erro ao destruir sessão durante o logout:", err);
                return res.status(500).json({ error: 'Erro interno durante o logout' });
            }
            // Redirecione para a página de login ou qualquer outra página desejada
            res.redirect('/login');
        });
    } else {
        // Caso o usuário não esteja autenticado, redirecione para a página de login
        res.redirect('/login');
    }
});




app.listen(3001, () => {
    console.log('Servidor iniciado na porta 3001');
});