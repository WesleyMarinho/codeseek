// fix-login.js - Script para corrigir o problema de login
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis');
const redis = require('redis');
const { User } = require('./backend/models/Index');

async function fixLogin() {
    console.log('🔧 Diagnosticando problema de login...\n');
    
    try {
        // 1. Testar conexão com Redis
        console.log('1. 🔴 Testando Redis...');
        const redisClient = redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined
        });
        
        redisClient.on('error', (err) => {
            console.log('   ❌ Redis error:', err.message);
        });
        
        redisClient.on('connect', () => {
            console.log('   ✅ Redis conectado');
        });
        
        await redisClient.connect();
        await redisClient.ping();
        console.log('   ✅ Redis funcionando');
        
        // 2. Testar sessão
        console.log('\n2. 🔐 Testando configuração de sessão...');
        const app = express();
        
        const store = new RedisStore({
            client: redisClient,
            prefix: 'digisess:',
        });
        
        app.use(session({
            store: store,
            secret: process.env.SESSION_SECRET || 'fallback-secret-for-test',
            resave: false,
            saveUninitialized: false,
            name: 'connect.sid',
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                sameSite: 'lax'
            }
        }));
        
        console.log('   ✅ Sessão configurada');
        
        // 3. Testar usuário admin
        console.log('\n3. 👤 Testando usuário admin...');
        const user = await User.findOne({ where: { email: 'admin@codeseek.com' } });
        
        if (!user) {
            console.log('   ❌ Usuário admin não encontrado');
            console.log('   🔧 Criando usuário admin...');
            
            const newUser = await User.create({
                username: 'admin',
                email: 'admin@codeseek.com', 
                password: 'admin123456',
                role: 'admin',
                status: 'active'
            });
            
            console.log('   ✅ Usuário admin criado:', newUser.email);
        } else {
            console.log('   ✅ Usuário admin existe:', user.email);
            
            // Testar senha
            const validPassword = await user.checkPassword('admin123456');
            console.log('   🔐 Senha válida:', validPassword);
            
            if (!validPassword) {
                console.log('   🔧 Corrigindo senha do admin...');
                const bcrypt = require('bcryptjs');
                const salt = await bcrypt.genSalt(12);
                const hashedPassword = await bcrypt.hash('admin123456', salt);
                
                await user.update({ password: hashedPassword });
                console.log('   ✅ Senha do admin corrigida');
            }
        }
        
        // 4. Testar simulação de login
        console.log('\n4. 🧪 Simulando processo de login...');
        app.use(express.json());
        
        app.post('/test-login', async (req, res) => {
            try {
                const { email, password } = req.body;
                
                const user = await User.findOne({ where: { email } });
                if (!user) {
                    return res.status(401).json({ success: false, message: 'User not found' });
                }
                
                const isValid = await user.checkPassword(password);
                if (!isValid) {
                    return res.status(401).json({ success: false, message: 'Invalid password' });
                }
                
                req.session.regenerate((err) => {
                    if (err) {
                        console.log('Session regeneration error:', err);
                        return res.status(500).json({ success: false, message: 'Session error' });
                    }
                    
                    req.session.userId = user.id;
                    req.session.user = { id: user.id, username: user.username, email: user.email, role: user.role };
                    
                    res.json({ success: true, message: 'Login successful' });
                });
                
            } catch (error) {
                console.log('Login test error:', error);
                res.status(500).json({ success: false, message: error.message });
            }
        });
        
        const server = app.listen(3001, () => {
            console.log('   ✅ Servidor de teste iniciado na porta 3001');
        });
        
        // Testar login via HTTP
        const axios = require('axios').default;
        
        setTimeout(async () => {
            try {
                const response = await axios.post('http://localhost:3001/test-login', {
                    email: 'admin@codeseek.com',
                    password: 'admin123456'
                });
                
                console.log('   ✅ Teste de login HTTP:', response.data);
                
            } catch (error) {
                console.log('   ❌ Erro no teste HTTP:', error.response?.data || error.message);
            }
            
            server.close();
            await redisClient.quit();
        }, 2000);
        
    } catch (error) {
        console.log('❌ Erro no diagnóstico:', error.message);
        console.log('Stack:', error.stack);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    fixLogin().then(() => {
        console.log('\n✅ Diagnóstico concluído');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Erro:', error);
        process.exit(1);
    });
}

module.exports = { fixLogin };