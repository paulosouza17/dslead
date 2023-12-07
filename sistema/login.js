
// Middleware para verificar autenticação
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).redirect('/login');
    }
    next();
}

// Rota de Login
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const { data: user, error } = await supabase
            .from('usuarios')
            .select('id_usuario, email, senha')
            .eq('email', email)
            .single();

            if (error || !user || !bcrypt.compareSync(senha, user.senha)) {
                console.error("Erro de autenticação:", error);
                return res.status(401).render('login', { error: 'Credenciais inválidas', message: null });
            }

        req.session.user = {
            id_usuario: user.id_usuario,
            email: user.email
        };

        res.json({ message: 'Login bem-sucedido' });
    } catch (e) {
        console.error("Erro durante o login:", e);
        res.status(500).json({ error: 'Erro interno durante o login' });
    }
});

// Rota para renderizar a página de login
app.get('/login', (req, res) => {
    res.render('login', { message: null, error: null });
});


// Rota para renderizar a página de registro
app.get('/user/register', (req, res) => {
    res.render('register', { message: null }); // Pode adicionar outros dados que desejar passar para a página EJS
});

// Rota de Registro
app.post('/user/register', async (req, res) => {
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

// Exemplo de rota protegida
app.get('/profile', requireAuth, (req, res) => {
    // Rota acessível apenas para usuários autenticados
    res.render('profile', { user: req.session.user });
});
