// test-login.js - Teste direto do login
require('dotenv').config();
const { User } = require('./models/Index');

async function testLogin() {
    console.log('🔍 Testando login direto...\n');
    
    try {
        // Testar conexão com banco
        console.log('1. 🗄️ Testando conexão com banco...');
        const user = await User.findOne({ where: { email: 'admin@codeseek.com' } });
        
        if (!user) {
            console.log('   ❌ Usuário admin não encontrado');
            return;
        }
        
        console.log('   ✅ Usuário encontrado:', {
            id: user.id,
            email: user.email,
            role: user.role,
            hasPassword: !!user.password
        });
        
        // Testar verificação de senha
        console.log('\n2. 🔐 Testando verificação de senha...');
        const isValidPassword = await user.checkPassword('admin123456');
        console.log('   Senha válida:', isValidPassword);
        
        if (!isValidPassword) {
            console.log('   ❌ Senha incorreta');
            return;
        }
        
        console.log('   ✅ Senha correta');
        
        // Testar criação de hash (para debug)
        console.log('\n3. 🔒 Testando hash de senha...');
        const bcrypt = require('bcryptjs');
        const testHash = await bcrypt.hash('admin123456', 12);
        const testCompare = await bcrypt.compare('admin123456', testHash);
        console.log('   Hash funciona:', testCompare);
        
        console.log('\n✅ Todos os testes passaram - login deveria funcionar');
        
    } catch (error) {
        console.log('❌ Erro no teste:', error.message);
        console.log('Stack:', error.stack);
    }
}

testLogin();