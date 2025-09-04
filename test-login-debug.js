// test-login-debug.js - Debug detalhado do login
const { chromium } = require('playwright');

async function debugLogin() {
    console.log('🔍 Investigando problema de login em detalhes...\n');
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const baseUrl = 'https://codeseek.shop';
    
    try {
        console.log('1. 🌐 Acessando página inicial...');
        await page.goto(baseUrl);
        await page.waitForTimeout(2000);
        console.log('   ✅ Página inicial carregada');
        
        console.log('\n2. 🔐 Navegando para login...');
        await page.goto(baseUrl + '/login');
        await page.waitForTimeout(2000);
        
        // Verificar elementos da página de login
        console.log('   📋 Elementos encontrados na página:');
        const emailField = page.locator('input[type="email"], input[name="email"], input[id="email"]');
        const passwordField = page.locator('input[type="password"], input[name="password"]');
        const submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Entrar")');
        
        console.log(`   📧 Campo email: ${await emailField.count()} encontrado(s)`);
        console.log(`   🔒 Campo senha: ${await passwordField.count()} encontrado(s)`);
        console.log(`   🔘 Botão submit: ${await submitButton.count()} encontrado(s)`);
        
        if (await emailField.count() > 0 && await passwordField.count() > 0) {
            console.log('\n3. 🔑 Tentando fazer login...');
            
            // Preencher campos
            await emailField.first().fill('admin@codeseek.com');
            await passwordField.first().fill('admin123456');
            
            console.log('   ✅ Campos preenchidos');
            
            // Capturar requests de rede
            const responses = [];
            page.on('response', response => {
                if (response.url().includes('login') || response.url().includes('auth')) {
                    responses.push({
                        url: response.url(),
                        status: response.status(),
                        statusText: response.statusText()
                    });
                }
            });
            
            // Submeter formulário
            if (await submitButton.count() > 0) {
                await submitButton.first().click();
                console.log('   🚀 Formulário submetido');
                
                // Aguardar resposta
                await page.waitForTimeout(3000);
                
                console.log('\n4. 📡 Respostas da rede:');
                responses.forEach(resp => {
                    console.log(`   ${resp.status} ${resp.statusText} - ${resp.url}`);
                });
                
                // Verificar se houve redirecionamento
                const currentUrl = page.url();
                console.log(`\n5. 🌍 URL atual: ${currentUrl}`);
                
                // Verificar se há mensagens de erro na página
                console.log('\n6. 🔍 Verificando mensagens na página:');
                
                const errorMessages = await page.locator('.error, .alert-danger, [class*="error"], [data-error]').allTextContents();
                const successMessages = await page.locator('.success, .alert-success, [class*="success"], [data-success]').allTextContents();
                
                if (errorMessages.length > 0) {
                    console.log('   ❌ Mensagens de erro encontradas:');
                    errorMessages.forEach(msg => console.log(`      "${msg}"`));
                }
                
                if (successMessages.length > 0) {
                    console.log('   ✅ Mensagens de sucesso encontradas:');
                    successMessages.forEach(msg => console.log(`      "${msg}"`));
                }
                
                // Verificar se apareceu algum elemento indicativo de login bem-sucedido
                const logoutButtons = await page.locator('a:has-text("Logout"), button:has-text("Logout"), a:has-text("Sair")').count();
                const adminElements = await page.locator('.admin, .dashboard, [data-role="admin"], [class*="admin"]').count();
                const welcomeMessages = await page.locator(':has-text("Bem-vindo"), :has-text("Welcome"), :has-text("Dashboard"), :has-text("Painel")').count();
                
                console.log('\n7. 🔍 Elementos pós-login:');
                console.log(`   🚪 Botões de logout: ${logoutButtons}`);
                console.log(`   👑 Elementos admin: ${adminElements}`);
                console.log(`   👋 Mensagens de boas-vindas: ${welcomeMessages}`);
                
                // Tentar capturar conteúdo da página para análise
                const pageContent = await page.content();
                const hasLoginForm = pageContent.includes('type="password"') || pageContent.includes('name="password"');
                const hasAdminContent = pageContent.toLowerCase().includes('admin') || pageContent.toLowerCase().includes('dashboard');
                
                console.log(`   📝 Ainda tem formulário de login: ${hasLoginForm}`);
                console.log(`   👑 Tem conteúdo administrativo: ${hasAdminContent}`);
                
                // Verificar cookies/sessão
                const cookies = await context.cookies();
                const sessionCookies = cookies.filter(cookie => 
                    cookie.name.toLowerCase().includes('session') || 
                    cookie.name.toLowerCase().includes('auth') ||
                    cookie.name.toLowerCase().includes('token')
                );
                
                console.log(`\n8. 🍪 Cookies de sessão: ${sessionCookies.length} encontrado(s)`);
                sessionCookies.forEach(cookie => {
                    console.log(`   ${cookie.name}: ${cookie.value.substring(0, 50)}...`);
                });
                
            } else {
                console.log('   ❌ Botão de submit não encontrado');
            }
        } else {
            console.log('   ❌ Campos de login não encontrados');
        }
        
        // Fazer uma pausa para inspecionar manualmente se necessário
        console.log('\n⏸️  Pausando por 10 segundos para inspeção manual...');
        await page.waitForTimeout(10000);
        
    } catch (error) {
        console.log(`❌ Erro durante debug: ${error.message}`);
    } finally {
        await browser.close();
    }
}

// Executar debug
debugLogin().then(() => {
    console.log('\n✅ Debug do login concluído');
}).catch(error => {
    console.error('❌ Erro no debug:', error);
});