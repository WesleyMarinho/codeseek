// test-server-basic.js - Teste básico do servidor sem dependências externas
const express = require('express');
const path = require('path');

// Criar um servidor de teste simplificado
const app = express();
const PORT = 3001; // Usar porta diferente para teste

// Middleware básico
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simular rotas principais
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>CodeSeek V1 - Test Server</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
            <header>
                <h1>CodeSeek V1 - Digital Marketplace</h1>
                <nav>
                    <a href="/login">Login</a>
                    <a href="/products">Products</a>
                    <a href="/admin">Admin</a>
                </nav>
            </header>
            <main>
                <h2>Welcome to CodeSeek</h2>
                <p>Digital marketplace platform for selling digital products.</p>
                <div class="features">
                    <div class="feature">Product Management</div>
                    <div class="feature">License System</div>
                    <div class="feature">User Management</div>
                </div>
            </main>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                header { background: #333; color: white; padding: 20px; margin: -20px -20px 20px -20px; }
                nav a { color: white; margin-right: 15px; text-decoration: none; }
                .features { display: flex; gap: 10px; flex-wrap: wrap; }
                .feature { background: #f0f0f0; padding: 10px; border-radius: 5px; }
                @media (max-width: 768px) {
                    .features { flex-direction: column; }
                }
            </style>
        </body>
        </html>
    `);
});

app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Login - CodeSeek V1</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
            <header>
                <h1>Login</h1>
            </header>
            <main>
                <form id="loginForm" action="/api/login" method="POST">
                    <div>
                        <label for="email">Email:</label>
                        <input type="email" id="email" name="email" value="admin@codeseek.com" required>
                    </div>
                    <div>
                        <label for="password">Password:</label>
                        <input type="password" id="password" name="password" value="admin123456" required>
                    </div>
                    <button type="submit">Login</button>
                </form>
                <div id="message"></div>
            </main>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                header { background: #333; color: white; padding: 20px; margin: -20px -20px 20px -20px; }
                form { max-width: 300px; }
                div { margin-bottom: 15px; }
                label { display: block; margin-bottom: 5px; }
                input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
                button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
                button:hover { background: #0056b3; }
                #message { margin-top: 15px; padding: 10px; border-radius: 4px; }
                .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
                .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
            </style>
            <script>
                document.getElementById('loginForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData.entries());
                    
                    try {
                        const response = await fetch('/api/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                        });
                        
                        const result = await response.json();
                        const messageDiv = document.getElementById('message');
                        
                        if (result.success) {
                            messageDiv.innerHTML = '<div class="success">Login successful! Redirecting...</div>';
                            setTimeout(() => window.location.href = '/admin', 1500);
                        } else {
                            messageDiv.innerHTML = '<div class="error">Login failed: ' + (result.message || 'Invalid credentials') + '</div>';
                        }
                    } catch (error) {
                        document.getElementById('message').innerHTML = '<div class="error">Error: ' + error.message + '</div>';
                    }
                });
            </script>
        </body>
        </html>
    `);
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    // Simular validação de login
    if (email === 'admin@codeseek.com' && password === 'admin123456') {
        res.json({ success: true, message: 'Login successful', redirect: '/admin' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.get('/admin', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Admin - CodeSeek V1</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
            <header class="admin">
                <h1>Admin Dashboard</h1>
                <nav>
                    <a href="/">Home</a>
                    <a href="/admin/users">Users</a>
                    <a href="/admin/products">Products</a>
                    <button onclick="logout()">Logout</button>
                </nav>
            </header>
            <main class="dashboard">
                <h2>Welcome, Administrator</h2>
                <div class="admin-panels">
                    <div class="panel">
                        <h3>Users</h3>
                        <p>Manage user accounts</p>
                    </div>
                    <div class="panel">
                        <h3>Products</h3>
                        <p>Manage digital products</p>
                    </div>
                    <div class="panel">
                        <h3>Orders</h3>
                        <p>View and manage orders</p>
                    </div>
                </div>
            </main>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .admin { background: #28a745; color: white; padding: 20px; margin: -20px -20px 20px -20px; }
                nav a, nav button { color: white; margin-right: 15px; text-decoration: none; background: none; border: none; cursor: pointer; }
                .admin-panels { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px; }
                .panel { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; }
            </style>
            <script>
                function logout() {
                    alert('Logout successful');
                    window.location.href = '/';
                }
            </script>
        </body>
        </html>
    `);
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        service: 'CodeSeek V1 Test Server'
    });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
    console.log(`🚀 CodeSeek Test Server rodando em http://localhost:${PORT}`);
    console.log(`🔍 Teste em: http://localhost:${PORT}`);
    console.log(`🔑 Login: admin@codeseek.com / admin123456`);
    console.log(`⏹️  Para parar: Ctrl+C`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Encerrando servidor...');
    server.close(() => {
        console.log('Servidor encerrado.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\nEncerrando servidor...');
    server.close(() => {
        console.log('Servidor encerrado.');
        process.exit(0);
    });
});

module.exports = app;