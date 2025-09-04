// test-js-console.js - Testar se JavaScript está executando e capturar erros de console
const { chromium } = require('playwright');

async function testJSConsole() {
    console.log('🔍 Testando problemas de JavaScript e CSP...\n');
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const consoleMessages = [];
    const networkErrors = [];
    const jsErrors = [];
    
    // Capturar mensagens de console
    page.on('console', msg => {
        consoleMessages.push({
            type: msg.type(),
            text: msg.text(),
            location: msg.location()
        });
    });
    
    // Capturar erros de rede
    page.on('response', response => {
        if (!response.ok()) {
            networkErrors.push({
                url: response.url(),
                status: response.status(),
                statusText: response.statusText()
            });
        }
    });
    
    // Capturar erros JavaScript
    page.on('pageerror', error => {
        jsErrors.push(error.message);
    });
    
    try {
        console.log('1. 🌐 Acessando página de login...');
        await page.goto('https://codeseek.shop/login', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        
        console.log('\n2. 📋 Verificando se auth.js foi carregado...');
        const authJsLoaded = await page.evaluate(() => {
            return typeof window.Auth !== 'undefined' || 
                   document.querySelector('script[src*="auth.js"]') !== null;
        });
        
        console.log(`   Auth.js carregado: ${authJsLoaded}`);
        
        console.log('\n3. 🔍 Verificando listeners do formulário...');
        const formHasListener = await page.evaluate(() => {
            const form = document.getElementById('login-form');
            if (!form) return false;
            
            // Verificar se tem event listeners
            const listeners = window.getEventListeners ? window.getEventListeners(form) : {};
            return Object.keys(listeners).includes('submit');
        });
        
        console.log(`   Formulário tem listener: ${formHasListener}`);
        
        console.log('\n4. 🧪 Teste manual de submit...');
        
        // Preencher formulário
        await page.fill('#email', 'admin@codeseek.com');
        await page.fill('#password', 'admin123456');
        
        // Tentar submeter e monitorar requisições
        const requestPromise = page.waitForRequest(request => 
            request.url().includes('login') && request.method() === 'POST'
        ).catch(() => null);
        
        await page.click('button[type="submit"]');
        
        const request = await Promise.race([
            requestPromise,
            new Promise(resolve => setTimeout(() => resolve(null), 5000))
        ]);
        
        if (request) {
            console.log(`   ✅ Requisição enviada para: ${request.url()}`);
            console.log(`   📤 Payload: ${request.postData()}`);
        } else {
            console.log('   ❌ Nenhuma requisição foi enviada');
        }
        
        console.log('\n5. 📊 Resumo dos problemas encontrados:');
        
        if (consoleMessages.length > 0) {
            console.log('   🔴 Mensagens de console:');
            consoleMessages.forEach(msg => {
                console.log(`      ${msg.type.toUpperCase()}: ${msg.text}`);
            });
        }
        
        if (networkErrors.length > 0) {
            console.log('   🌐 Erros de rede:');
            networkErrors.forEach(error => {
                console.log(`      ${error.status} ${error.statusText} - ${error.url}`);
            });
        }
        
        if (jsErrors.length > 0) {
            console.log('   ⚠️  Erros JavaScript:');
            jsErrors.forEach(error => {
                console.log(`      ${error}`);
            });
        }
        
        if (consoleMessages.length === 0 && networkErrors.length === 0 && jsErrors.length === 0) {
            console.log('   ✅ Nenhum erro evidente encontrado');
        }
        
        console.log('\n⏸️  Pausando para inspeção manual (10s)...');
        await page.waitForTimeout(10000);
        
    } catch (error) {
        console.log(`❌ Erro durante teste: ${error.message}`);
    } finally {
        await browser.close();
    }
}

testJSConsole().then(() => {
    console.log('\n✅ Teste de JavaScript concluído');
}).catch(error => {
    console.error('❌ Erro no teste:', error);
});