// test-codeseek.js - Testes automatizados para CodeSeek V1
const { chromium } = require('playwright');

async function testCodeSeek() {
    console.log('🧪 Iniciando testes do CodeSeek V1...\n');
    
    let browser;
    let testsPassed = 0;
    let testsFailed = 0;
    const testResults = [];
    
    try {
        // Inicializar browser
        browser = await chromium.launch({ 
            headless: false, // Mostrar browser para debug
            slowMo: 500 // Delay entre ações
        });
        
        const context = await browser.newContext({
            viewport: { width: 1280, height: 720 }
        });
        
        const page = await context.newPage();
        
        // URL base - ajustar conforme necessário
        const baseUrl = 'http://localhost:3000';
        
        console.log(`🌐 Testando URL: ${baseUrl}`);
        
        // Teste 1: Verificar se a página inicial carrega
        try {
            console.log('📋 Teste 1: Carregamento da página inicial');
            await page.goto(baseUrl, { waitUntil: 'networkidle' });
            await page.waitForTimeout(2000);
            
            const title = await page.title();
            console.log(`   ✅ Título da página: ${title}`);
            
            // Verificar se elementos básicos existem
            const hasHeader = await page.locator('header, nav, .navbar, .header').count() > 0;
            const hasMainContent = await page.locator('main, .main, .content, body').count() > 0;
            
            if (hasHeader && hasMainContent) {
                console.log('   ✅ Elementos básicos da página encontrados');
                testsPassed++;
                testResults.push({ test: 'Página inicial', status: 'PASSOU', details: `Título: ${title}` });
            } else {
                throw new Error('Elementos básicos não encontrados');
            }
            
        } catch (error) {
            console.log(`   ❌ Falhou: ${error.message}`);
            testsFailed++;
            testResults.push({ test: 'Página inicial', status: 'FALHOU', details: error.message });
        }
        
        // Teste 2: Verificar página de login
        try {
            console.log('\n📋 Teste 2: Página de login');
            
            // Tentar encontrar link/botão de login
            const loginSelectors = [
                'a[href*="login"]',
                'button:has-text("Login")',
                'a:has-text("Login")',
                '.login',
                '[data-testid="login"]'
            ];
            
            let loginFound = false;
            let loginUrl = '';
            
            for (const selector of loginSelectors) {
                try {
                    const loginElement = page.locator(selector).first();
                    if (await loginElement.count() > 0) {
                        if (await loginElement.getAttribute('href')) {
                            loginUrl = await loginElement.getAttribute('href');
                        } else {
                            // Se é um botão, tentar clicar
                            await loginElement.click();
                            await page.waitForTimeout(1000);
                            loginUrl = page.url();
                        }
                        loginFound = true;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            // Se não encontrou, tentar URLs comuns de login
            if (!loginFound) {
                const commonLoginPaths = ['/login', '/signin', '/auth/login', '/admin/login'];
                for (const path of commonLoginPaths) {
                    try {
                        await page.goto(baseUrl + path);
                        await page.waitForTimeout(1000);
                        
                        // Verificar se há campos de login
                        const hasEmailField = await page.locator('input[type="email"], input[name="email"], input[id="email"]').count() > 0;
                        const hasPasswordField = await page.locator('input[type="password"], input[name="password"]').count() > 0;
                        
                        if (hasEmailField && hasPasswordField) {
                            loginUrl = baseUrl + path;
                            loginFound = true;
                            break;
                        }
                    } catch (e) {
                        continue;
                    }
                }
            }
            
            if (loginFound) {
                console.log(`   ✅ Página de login encontrada: ${loginUrl}`);
                testsPassed++;
                testResults.push({ test: 'Página de login', status: 'PASSOU', details: loginUrl });
            } else {
                throw new Error('Página de login não encontrada');
            }
            
        } catch (error) {
            console.log(`   ❌ Falhou: ${error.message}`);
            testsFailed++;
            testResults.push({ test: 'Página de login', status: 'FALHOU', details: error.message });
        }
        
        // Teste 3: Testar login administrativo
        try {
            console.log('\n📋 Teste 3: Login administrativo');
            
            // Navegar para página de login se necessário
            if (!page.url().includes('login')) {
                await page.goto(baseUrl + '/login');
                await page.waitForTimeout(1000);
            }
            
            // Tentar fazer login
            const emailField = page.locator('input[type="email"], input[name="email"], input[id="email"]').first();
            const passwordField = page.locator('input[type="password"], input[name="password"]').first();
            const submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("Login")').first();
            
            if (await emailField.count() > 0 && await passwordField.count() > 0) {
                await emailField.fill('admin@codeseek.com');
                await passwordField.fill('admin123456');
                
                if (await submitButton.count() > 0) {
                    await submitButton.click();
                    await page.waitForTimeout(3000);
                    
                    // Verificar se login foi bem-sucedido
                    const currentUrl = page.url();
                    const hasLogoutOption = await page.locator('a:has-text("Logout"), button:has-text("Logout"), a:has-text("Sair")').count() > 0;
                    const hasAdminContent = await page.locator('.admin, .dashboard, [data-role="admin"]').count() > 0;
                    const hasWelcomeMessage = await page.locator(':has-text("admin"), :has-text("Dashboard"), :has-text("Painel")').count() > 0;
                    
                    if (hasLogoutOption || hasAdminContent || hasWelcomeMessage || !currentUrl.includes('login')) {
                        console.log('   ✅ Login administrativo bem-sucedido');
                        console.log(`   📍 Redirecionado para: ${currentUrl}`);
                        testsPassed++;
                        testResults.push({ test: 'Login admin', status: 'PASSOU', details: `Redirecionado para: ${currentUrl}` });
                    } else {
                        throw new Error('Login falhou - não foi redirecionado ou não há indicação de sucesso');
                    }
                } else {
                    throw new Error('Botão de submit não encontrado');
                }
            } else {
                throw new Error('Campos de email/senha não encontrados');
            }
            
        } catch (error) {
            console.log(`   ❌ Falhou: ${error.message}`);
            testsFailed++;
            testResults.push({ test: 'Login admin', status: 'FALHOU', details: error.message });
        }
        
        // Teste 4: Verificar funcionalidades básicas após login
        try {
            console.log('\n📋 Teste 4: Funcionalidades pós-login');
            
            // Verificar se há menus/navegação administrativa
            const adminMenus = await page.locator('nav a, .menu a, .sidebar a').count();
            const adminSections = await page.locator('.admin, .dashboard, .panel').count();
            
            console.log(`   📊 Menus encontrados: ${adminMenus}`);
            console.log(`   📊 Seções administrativas: ${adminSections}`);
            
            if (adminMenus > 0 || adminSections > 0) {
                console.log('   ✅ Funcionalidades administrativas disponíveis');
                testsPassed++;
                testResults.push({ test: 'Funcionalidades admin', status: 'PASSOU', details: `${adminMenus} menus, ${adminSections} seções` });
            } else {
                throw new Error('Nenhuma funcionalidade administrativa encontrada');
            }
            
        } catch (error) {
            console.log(`   ❌ Falhou: ${error.message}`);
            testsFailed++;
            testResults.push({ test: 'Funcionalidades admin', status: 'FALHOU', details: error.message });
        }
        
        // Teste 5: Verificar responsividade
        try {
            console.log('\n📋 Teste 5: Responsividade mobile');
            
            // Testar viewport mobile
            await page.setViewportSize({ width: 375, height: 667 });
            await page.waitForTimeout(1000);
            
            // Verificar se a página se adapta
            const bodyWidth = await page.locator('body').boundingBox();
            const hasHorizontalScroll = bodyWidth.width > 375;
            
            if (!hasHorizontalScroll) {
                console.log('   ✅ Página se adapta ao mobile');
                testsPassed++;
                testResults.push({ test: 'Responsividade', status: 'PASSOU', details: 'Sem scroll horizontal' });
            } else {
                throw new Error('Scroll horizontal detectado no mobile');
            }
            
        } catch (error) {
            console.log(`   ❌ Falhou: ${error.message}`);
            testsFailed++;
            testResults.push({ test: 'Responsividade', status: 'FALHOU', details: error.message });
        }
        
    } catch (error) {
        console.log(`❌ Erro geral nos testes: ${error.message}`);
        testsFailed++;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
    
    // Relatório final
    console.log('\n' + '='.repeat(50));
    console.log('📊 RELATÓRIO FINAL DOS TESTES');
    console.log('='.repeat(50));
    
    testResults.forEach(result => {
        const icon = result.status === 'PASSOU' ? '✅' : '❌';
        console.log(`${icon} ${result.test}: ${result.status}`);
        if (result.details) {
            console.log(`   ${result.details}`);
        }
    });
    
    console.log('\n📈 RESUMO:');
    console.log(`   ✅ Testes Passou: ${testsPassed}`);
    console.log(`   ❌ Testes Falharam: ${testsFailed}`);
    console.log(`   📊 Total: ${testsPassed + testsFailed}`);
    
    const successRate = ((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1);
    console.log(`   🎯 Taxa de Sucesso: ${successRate}%`);
    
    if (testsFailed === 0) {
        console.log('\n🎉 TODOS OS TESTES PASSARAM! CodeSeek está funcionando perfeitamente.');
    } else {
        console.log(`\n⚠️  ${testsFailed} teste(s) falharam. Verifique os problemas acima.`);
    }
    
    return { passed: testsPassed, failed: testsFailed, results: testResults };
}

// Executar testes se chamado diretamente
if (require.main === module) {
    testCodeSeek().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    }).catch(error => {
        console.error('Erro ao executar testes:', error);
        process.exit(1);
    });
}

module.exports = { testCodeSeek };