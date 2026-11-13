//Importações de módulos
const express = require('express');
const path = require('path');
const pool = require('./database');
const app = express();
const nodemailer = require("nodemailer");
const bcrypt = require('bcrypt');
const session = require('express-session');
const { createHash, randomBytes } = require('crypto');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

require('dotenv').config();

// Middlewares para ler dados de formulários e cookies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuração do motor de views e arquivos estáticos
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Função para verificar o token JWT
function verifyToken(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Salva os dados do usuário no request
        next();
    } catch (err) {
        res.clearCookie('token');
        return res.redirect('/login');
    }
}

// Rotas
app.get('/', (req, res) => {
    res.render('login.ejs')
});
app.get('/registro',(req, res) =>{
    res.render('registro.ejs')
})
app.get('/formUser', (req,res) =>{
    res.render('formUser.ejs');
})


// 1. Configuração do Multer para salvar os arquivos recebidos na pasta 'public/uploads'
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        // Gera um nome único para o arquivo para evitar sobreposição
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });



// 2. Rota POST para receber o formulário e salvar no Banco de Dados
// Obs: O nome 'arquivo' em upload.single('arquivo') deve ser o mesmo do atributo name do input do arquivo no HTML.
app.post('/envia', upload.single('arquivo'), async (req, res) => {
    try {
        // Captura os dados enviados pelos campos do formulário
        const { nome, matricula, email, periodo, turma, quantidade } = req.body;
        
        // Pega o nome do arquivo salvo na pasta uploads (se existir)
        const arquivoPath = req.file ? req.file.filename : null;

        // Comando SQL para inserir na tabela impressoes
        const sql = `
            INSERT INTO impressoes (nome, matricula, email, periodo, turma, quantidade, arquivo) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [nome, matricula, email, periodo, turma, quantidade, arquivoPath];

        // 3. Executa a query no MySQL utilizando o pool
        await pool.query(sql, values);

        res.send('Solicitação de impressão realizada com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar no banco de dados:', error);
        res.status(500).send('Erro ao processar a solicitação.');
    }
});

app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Criptografar a senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Salvar no banco de dados (exemplo simplificado)
        // await db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword]);

        res.redirect('/login');
    } catch (err) {
        res.status(500).send('Erro ao cadastrar usuário');
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;


    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: '1h'
    });


    res.cookie('token', token, {
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        maxAge: 3600000
    });

    res.redirect('/formUser');
});

//Rota de Logout
app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});


// Inicialização do Servidor
app.listen(3000, () => {
    console.log('rodando em: http://localhost:3000');
});