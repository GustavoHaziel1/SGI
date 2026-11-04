const express = require('express');
const path = require('path');
const pool = require('./database');
const app = express();
const nodemailer = require("nodemailer");
const bcrypt = require('bcrypt');
const session = require('express-session');
const { createHash, randomBytes } = require('crypto');
const multer = require('multer');

require('dotenv').config();

// Configuração do motor de views e arquivos estáticos
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

// Rota Principal (Renderiza o formulário)
app.get('/', (req, res) => {
    res.render('formUser.ejs');
});

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

// Inicialização do Servidor
app.listen(3000, () => {
    console.log('rodando em: http://localhost:3000');
});