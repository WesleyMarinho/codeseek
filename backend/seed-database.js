require('dotenv').config();
const { User, Category, Product, License, Subscription, Activation, Invoice, WebhookLog, Setting } = require('./models/Index');
const crypto = require('crypto');

async function seedDatabase() {
  try {
    console.log('🌱 Starting comprehensive database seed...');

    // ====== STEP 1: CATEGORIAS ======
    console.log('📂 Creating categories...');
    const categories = await Category.bulkCreate([
      { 
        name: 'Software', 
        description: 'Professional software applications and development tools' 
      },
      { 
        name: 'Games', 
        description: 'Digital games and entertainment software' 
      },
      { 
        name: 'E-books', 
        description: 'Digital books, guides and educational materials' 
      },
      { 
        name: 'Courses', 
        description: 'Online courses and learning materials' 
      }
    ], { 
      ignoreDuplicates: true,
      returning: true 
    });

    const softwareCategory = await Category.findOne({ where: { name: 'Software' } });
    const gamesCategory = await Category.findOne({ where: { name: 'Games' } });
    const ebooksCategory = await Category.findOne({ where: { name: 'E-books' } });
    const coursesCategory = await Category.findOne({ where: { name: 'Courses' } });

    console.log(`✅ Created ${categories.length} categories`);

    // ====== STEP 2: USUÁRIOS ======
    console.log('👤 Creating users...');
    
    // Admin user
    const [adminUser] = await User.findOrCreate({
      where: { email: 'admin@codeseek.com' },
      defaults: { 
        username: 'admin', 
        password: 'admin123456', 
        role: 'admin',
        status: 'active',
        emailVerified: true,
        lastLogin: new Date()
      }
    });

    // Test users
    const [testUser] = await User.findOrCreate({
      where: { email: 'teste@codeseek.com' },
      defaults: { 
        username: 'testuser', 
        password: 'teste123456', 
        role: 'user',
        status: 'active',
        emailVerified: true,
        lastLogin: new Date()
      }
    });

    const [premiumUser] = await User.findOrCreate({
      where: { email: 'premium@codeseek.com' },
      defaults: { 
        username: 'premiumuser', 
        password: 'premium123456', 
        role: 'user',
        status: 'active',
        emailVerified: true,
        lastLogin: new Date()
      }
    });

    const [demoUser] = await User.findOrCreate({
      where: { email: 'demo@codeseek.com' },
      defaults: { 
        username: 'demouser', 
        password: 'demo123456', 
        role: 'user',
        status: 'active',
        emailVerified: false
      }
    });

    console.log(`✅ Created 4 users (1 admin, 3 regular users)`);

    // ====== STEP 3: PRODUTOS COMPLETOS ======
    console.log('📦 Creating comprehensive product catalog...');
    
    // Produto All Access (especial)
    const allAccessProduct = await Product.create({
      name: 'All Access Pass',
      description: `
        <h3>🎯 Complete Access to Our Digital Marketplace</h3>
        <p>Get unlimited access to our entire catalog of premium digital products including:</p>
        <ul>
          <li>✅ All current software applications</li>
          <li>✅ All future releases and updates</li>
          <li>✅ Priority customer support</li>
          <li>✅ Exclusive beta access</li>
          <li>✅ Commercial usage rights</li>
        </ul>
        <p><strong>Save up to 70% compared to individual purchases!</strong></p>
      `,
      shortDescription: 'Unlimited access to all premium products with lifetime updates',
      price: 29.99,
      monthlyPrice: 29.99,
      annualPrice: 299.99,
      categoryId: softwareCategory.id,
      files: [
        { name: 'all-access-guide.pdf', size: '2.5MB', type: 'guide' },
        { name: 'activation-instructions.txt', size: '1KB', type: 'instructions' }
      ],
      downloadFile: '/uploads/products/all-access-package.zip',
      changelog: `
        v2.0.0 (2025-08-19):
        - Added access to all new game releases
        - Improved activation system
        - Extended commercial license terms
        
        v1.5.0 (2025-07-15):
        - Added e-book collection access
        - New course materials included
        
        v1.0.0 (2025-06-01):
        - Initial All Access release
      `,
      featuredMedia: '/uploads/products/all-access-featured.jpg',
      mediaFiles: [
        { type: 'image', url: '/uploads/products/all-access-preview1.jpg', caption: 'Dashboard Overview' },
        { type: 'image', url: '/uploads/products/all-access-preview2.jpg', caption: 'Product Catalog' },
        { type: 'video', url: '/uploads/products/all-access-demo.mp4', caption: 'Product Demo Video' }
      ],
      isActive: true,
      isAllAccessIncluded: false, // Este produto não está incluído em si mesmo
      maxActivations: 999
    });

    // Software Products
    const proTextEditor = await Product.create({
      name: 'DigiCode Pro',
      description: `
        <h3>🚀 Professional Code Editor</h3>
        <p>Advanced text editor designed for developers and power users:</p>
        <ul>
          <li>✨ Syntax highlighting for 200+ languages</li>
          <li>🔍 Intelligent code completion</li>
          <li>🎨 Customizable themes and layouts</li>
          <li>📁 Advanced file management</li>
          <li>🔧 Plugin ecosystem with 500+ extensions</li>
          <li>⚡ Lightning-fast performance</li>
        </ul>
        <p><strong>Used by 50,000+ developers worldwide!</strong></p>
      `,
      shortDescription: 'Professional code editor with advanced features for developers',
      price: 19.99,
      monthlyPrice: 4.99,
      annualPrice: 49.99,
      categoryId: softwareCategory.id,
      files: [
        { name: 'DigiCode-Pro-Setup.exe', size: '45.2MB', type: 'installer' },
        { name: 'DigiCode-Pro-Portable.zip', size: '38.1MB', type: 'portable' },
        { name: 'user-manual.pdf', size: '3.2MB', type: 'documentation' },
        { name: 'plugin-development-guide.pdf', size: '1.8MB', type: 'documentation' }
      ],
      downloadFile: '/uploads/products/digicode-pro-v2.1.0.zip',
      changelog: `
        v2.1.0 (2025-08-19):
        - Added AI-powered code suggestions
        - New dark theme variants
        - Performance improvements (30% faster)
        - Bug fixes in syntax highlighting
        
        v2.0.0 (2025-07-01):
        - Major UI overhaul
        - New plugin system
        - Git integration
        
        v1.5.2 (2025-06-15):
        - Security updates
        - New language support
      `,
      featuredMedia: '/uploads/products/digicode-featured.jpg',
      mediaFiles: [
        { type: 'image', url: '/uploads/products/digicode-screenshot1.jpg', caption: 'Main Interface' },
        { type: 'image', url: '/uploads/products/digicode-screenshot2.jpg', caption: 'Plugin Manager' },
        { type: 'image', url: '/uploads/products/digicode-screenshot3.jpg', caption: 'Theme Customization' },
        { type: 'video', url: '/uploads/products/digicode-demo.mp4', caption: 'Feature Overview' }
      ],
      isActive: true,
      isAllAccessIncluded: true,
      maxActivations: 5
    });

    // Game Product
    const retroGame = await Product.create({
      name: 'RetroQuest Adventures',
      description: `
        <h3>🎮 Classic RPG Adventure</h3>
        <p>Embark on an epic journey in this retro-styled RPG:</p>
        <ul>
          <li>🗺️ Vast open world with 50+ locations</li>
          <li>⚔️ Turn-based combat system</li>
          <li>🧙‍♂️ Character customization and skill trees</li>
          <li>📖 Rich storyline with multiple endings</li>
          <li>🎵 Original chiptune soundtrack</li>
          <li>🏆 Steam achievements and trading cards</li>
        </ul>
        <p><strong>Over 40 hours of gameplay content!</strong></p>
      `,
      shortDescription: 'Epic retro RPG adventure with 40+ hours of content',
      price: 14.99,
      monthlyPrice: null, // Games typically don't have monthly pricing
      annualPrice: null,
      categoryId: gamesCategory.id,
      files: [
        { name: 'RetroQuest-Setup.exe', size: '128.5MB', type: 'installer' },
        { name: 'RetroQuest-Steam-Key.txt', size: '1KB', type: 'steam-key' },
        { name: 'game-manual.pdf', size: '5.2MB', type: 'manual' },
        { name: 'soundtrack.zip', size: '25.1MB', type: 'bonus' }
      ],
      downloadFile: '/uploads/products/retroquest-complete-v1.2.zip',
      changelog: `
        v1.2.0 (2025-08-10):
        - New Game+ mode added
        - 3 new side quests
        - Balance improvements
        - Bug fixes
        
        v1.1.0 (2025-07-20):
        - Added difficulty settings
        - New boss battles
        - Quality of life improvements
        
        v1.0.0 (2025-06-30):
        - Initial release
      `,
      featuredMedia: '/uploads/products/retroquest-featured.jpg',
      mediaFiles: [
        { type: 'image', url: '/uploads/products/retroquest-gameplay1.jpg', caption: 'Combat System' },
        { type: 'image', url: '/uploads/products/retroquest-gameplay2.jpg', caption: 'World Map' },
        { type: 'image', url: '/uploads/products/retroquest-gameplay3.jpg', caption: 'Character Stats' },
        { type: 'video', url: '/uploads/products/retroquest-trailer.mp4', caption: 'Game Trailer' }
      ],
      isActive: true,
      isAllAccessIncluded: true,
      maxActivations: 3
    });

    // E-book Product
    const webDevGuide = await Product.create({
      name: 'Complete Web Development Masterclass',
      description: `
        <h3>📚 Comprehensive Web Development Guide</h3>
        <p>Master modern web development from zero to hero:</p>
        <ul>
          <li>🌐 HTML5, CSS3, and JavaScript fundamentals</li>
          <li>⚛️ React, Vue.js, and modern frameworks</li>
          <li>🔧 Node.js and backend development</li>
          <li>💾 Database design and management</li>
          <li>🚀 Deployment and DevOps basics</li>
          <li>📱 Responsive design and mobile-first approach</li>
        </ul>
        <p><strong>500+ pages of practical examples and projects!</strong></p>
      `,
      shortDescription: 'Complete guide to modern web development with practical projects',
      price: 24.99,
      monthlyPrice: null,
      annualPrice: null,
      categoryId: ebooksCategory.id,
      files: [
        { name: 'web-dev-masterclass.pdf', size: '15.8MB', type: 'ebook' },
        { name: 'web-dev-masterclass.epub', size: '12.2MB', type: 'ebook' },
        { name: 'source-code-examples.zip', size: '45.6MB', type: 'source-code' },
        { name: 'bonus-cheatsheets.pdf', size: '2.1MB', type: 'bonus' }
      ],
      downloadFile: '/uploads/products/web-dev-masterclass-complete.zip',
      changelog: `
        v3.0.0 (2025-08-01):
        - Added React 18 and Next.js 13 content
        - New section on TypeScript
        - Updated deployment strategies
        
        v2.5.0 (2025-06-15):
        - Added Vue 3 Composition API
        - GraphQL integration examples
        
        v2.0.0 (2025-05-01):
        - Complete restructure
        - Added modern CSS techniques
      `,
      featuredMedia: '/uploads/products/webdev-featured.jpg',
      mediaFiles: [
        { type: 'image', url: '/uploads/products/webdev-preview1.jpg', caption: 'Table of Contents' },
        { type: 'image', url: '/uploads/products/webdev-preview2.jpg', caption: 'Code Examples' },
        { type: 'image', url: '/uploads/products/webdev-preview3.jpg', caption: 'Project Showcase' },
        { type: 'video', url: '/uploads/products/webdev-overview.mp4', caption: 'Course Overview' }
      ],
      isActive: true,
      isAllAccessIncluded: true,
      maxActivations: 2
    });

    console.log(`✅ Created 4 comprehensive products`);

    // ====== STEP 4: LICENÇAS REALISTAS ======
    console.log('🎫 Creating realistic license distribution...');
    
    const licenses = [];
    
    // testUser: All Access + Pro Text Editor individual
    licenses.push(
      await License.create({
        productId: allAccessProduct.id,
        userId: testUser.id,
        key: 'ALLACC-' + crypto.randomBytes(8).toString('hex').toUpperCase(),
        status: 'active',
        activatedOn: new Date(),
        expiresOn: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        maxActivations: 999
      }),
      await License.create({
        productId: proTextEditor.id,
        userId: testUser.id,
        key: 'DCODE-' + crypto.randomBytes(8).toString('hex').toUpperCase(),
        status: 'active',
        activatedOn: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        expiresOn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        maxActivations: 5
      })
    );

    // premiumUser: Multiple individual products
    licenses.push(
      await License.create({
        productId: proTextEditor.id,
        userId: premiumUser.id,
        key: 'DCODE-' + crypto.randomBytes(8).toString('hex').toUpperCase(),
        status: 'active',
        activatedOn: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        expiresOn: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
        maxActivations: 5
      }),
      await License.create({
        productId: retroGame.id,
        userId: premiumUser.id,
        key: 'RETRO-' + crypto.randomBytes(8).toString('hex').toUpperCase(),
        status: 'active',
        activatedOn: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        expiresOn: null, // Games typically don't expire
        maxActivations: 3
      }),
      await License.create({
        productId: webDevGuide.id,
        userId: premiumUser.id,
        key: 'WEBDEV-' + crypto.randomBytes(8).toString('hex').toUpperCase(),
        status: 'active',
        activatedOn: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        expiresOn: null, // E-books typically don't expire
        maxActivations: 2
      })
    );

    // demoUser: One expired license and one pending
    licenses.push(
      await License.create({
        productId: proTextEditor.id,
        userId: demoUser.id,
        key: 'DCODE-' + crypto.randomBytes(8).toString('hex').toUpperCase(),
        status: 'expired',
        activatedOn: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        expiresOn: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Expired 15 days ago
        maxActivations: 5
      }),
      await License.create({
        productId: retroGame.id,
        userId: demoUser.id,
        key: 'RETRO-' + crypto.randomBytes(8).toString('hex').toUpperCase(),
        status: 'pending',
        activatedOn: null,
        expiresOn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        maxActivations: 3
      })
    );

    console.log(`✅ Created ${licenses.length} licenses with realistic distribution`);

    // ====== STEP 5: ATIVAÇÕES DE LICENÇAS ======
    console.log('🔗 Creating license activations...');
    
    const activeLicenses = licenses.filter(license => license.status === 'active');
    const activations = [];

    // testUser activations (All Access)
    const testUserAllAccess = licenses.find(l => l.userId === testUser.id && l.productId === allAccessProduct.id);
    if (testUserAllAccess) {
      activations.push(
        await Activation.create({
          licenseId: testUserAllAccess.id,
          domain: 'mycompany-website.com',
          activatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
          lastSeen: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          isActive: true
        }),
        await Activation.create({
          licenseId: testUserAllAccess.id,
          domain: 'development-server.local',
          activatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          lastSeen: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          isActive: true
        })
      );
    }

    // premiumUser activations
    const premiumUserEditor = licenses.find(l => l.userId === premiumUser.id && l.productId === proTextEditor.id);
    if (premiumUserEditor) {
      activations.push(
        await Activation.create({
          licenseId: premiumUserEditor.id,
          domain: 'premium-dev-studio.com',
          activatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
          lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
          isActive: true
        }),
        await Activation.create({
          licenseId: premiumUserEditor.id,
          domain: 'client-project-alpha.com',
          activatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          lastSeen: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          isActive: true
        })
      );
    }

    console.log(`✅ Created ${activations.length} license activations`);

    // ====== STEP 6: ASSINATURAS ======
    console.log('📋 Creating subscriptions...');
    
    // testUser: Active All Access subscription
    const testUserSubscription = await Subscription.create({
      userId: testUser.id,
      plan: 'all_access',
      status: 'active',
      price: 197.00,
      chargebeeSubscriptionId: 'sub_' + crypto.randomBytes(12).toString('hex'),
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 360 * 24 * 60 * 60 * 1000),
      currentPeriodStart: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    });

    // premiumUser: Cancelled subscription
    const premiumUserSubscription = await Subscription.create({
      userId: premiumUser.id,
      plan: 'premium',
      status: 'cancelled',
      price: 49.99,
      stripeSubscriptionId: 'sub_' + crypto.randomBytes(12).toString('hex'),
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      currentPeriodStart: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
    });

    console.log(`✅ Created 2 subscriptions (1 active, 1 cancelled)`);

    // ====== STEP 7: FATURAS REALISTAS ======
    console.log('🧾 Creating comprehensive invoices...');
    
    const invoices = [];

    // testUser invoices (monthly All Access)
    for (let i = 0; i < 3; i++) {
      const invoiceDate = new Date(Date.now() - (i * 30 + 5) * 24 * 60 * 60 * 1000);
      invoices.push(
        await Invoice.create({
          userId: testUser.id,
          subscriptionId: testUserSubscription.id,
          chargebeeInvoiceId: 'in_' + crypto.randomBytes(12).toString('hex'),
          invoiceNumber: `INV-2025-${String(100 + i).padStart(3, '0')}`,
          amount: 29.99,
          currency: 'USD',
          status: 'paid',
          issueDate: invoiceDate,
          dueDate: new Date(invoiceDate.getTime() + 15 * 24 * 60 * 60 * 1000),
          paidAt: new Date(invoiceDate.getTime() + 2 * 24 * 60 * 60 * 1000),
          createdAt: invoiceDate,
          updatedAt: new Date(invoiceDate.getTime() + 2 * 24 * 60 * 60 * 1000)
        })
      );
    }

    // premiumUser invoices (individual purchases)
    invoices.push(
      await Invoice.create({
        userId: premiumUser.id,
        subscriptionId: null, // Individual purchase
        chargebeeInvoiceId: 'in_' + crypto.randomBytes(12).toString('hex'),
        invoiceNumber: 'INV-2025-150',
        amount: 19.99,
        currency: 'USD',
        status: 'paid',
        issueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        paidAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      }),
      await Invoice.create({
        userId: premiumUser.id,
        subscriptionId: null,
        chargebeeInvoiceId: 'in_' + crypto.randomBytes(12).toString('hex'),
        invoiceNumber: 'INV-2025-151',
        amount: 14.99,
        currency: 'USD',
        status: 'paid',
        issueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      })
    );

    // demoUser: Failed payment
    invoices.push(
      await Invoice.create({
        userId: demoUser.id,
        subscriptionId: null,
        chargebeeInvoiceId: 'in_' + crypto.randomBytes(12).toString('hex'),
        invoiceNumber: 'INV-2025-200',
        amount: 19.99,
        currency: 'USD',
        status: 'failed',
        issueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        paidAt: null,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      })
    );

    console.log(`✅ Created ${invoices.length} invoices with various statuses`);

    console.log(`✅ Created ${invoices.length} invoices with various statuses`);

    // ====== STEP 8: WEBHOOK LOGS REALISTAS ======
    console.log('📬 Creating comprehensive webhook logs...');
    
    const webhookLogs = [];

    // Successful payment webhooks
    webhookLogs.push(
      await WebhookLog.create({
        provider: 'chargebee',
        eventType: 'invoice.payment_succeeded',
        payload: {
          id: 'evt_' + crypto.randomBytes(12).toString('hex'),
          object: 'event',
          type: 'invoice.payment_succeeded',
          created: Math.floor(Date.now() / 1000),
          data: {
            object: {
              id: invoices[0].chargebeeInvoiceId,
              amount_paid: Math.round(invoices[0].amount * 100),
              customer: 'cus_' + crypto.randomBytes(8).toString('hex'),
              status: 'paid',
              subscription: testUserSubscription.chargebeeSubscriptionId
            }
          }
        },
        status: 'processed',
        processedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }),

      await WebhookLog.create({
        provider: 'stripe',
        eventType: 'customer.subscription.created',
        payload: {
          id: 'evt_' + crypto.randomBytes(12).toString('hex'),
          object: 'event',
          type: 'customer.subscription.created',
          created: Math.floor((Date.now() - 5 * 24 * 60 * 60 * 1000) / 1000),
          data: {
            object: {
              id: testUserSubscription.chargebeeSubscriptionId,
              customer: 'cus_' + crypto.randomBytes(8).toString('hex'),
              status: 'active',
              current_period_start: Math.floor(testUserSubscription.currentPeriodStart.getTime() / 1000),
              current_period_end: Math.floor(testUserSubscription.currentPeriodEnd.getTime() / 1000),
              plan: {
                id: 'plan_all_access_monthly',
                amount: 2999,
                currency: 'usd',
                interval: 'month'
              }
            }
          }
        },
        status: 'processed',
        processedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      })
    );

    // Failed payment webhook
    const failedInvoice = invoices.find(inv => inv.status === 'failed');
    if (failedInvoice) {
      webhookLogs.push(
        await WebhookLog.create({
          provider: 'stripe',
          eventType: 'invoice.payment_failed',
          payload: {
            id: 'evt_' + crypto.randomBytes(12).toString('hex'),
            object: 'event',
            type: 'invoice.payment_failed',
            created: Math.floor((Date.now() - 3 * 24 * 60 * 60 * 1000) / 1000),
            data: {
              object: {
                id: failedInvoice.chargebeeInvoiceId,
                amount_due: Math.round(failedInvoice.amount * 100),
                customer: 'cus_' + crypto.randomBytes(8).toString('hex'),
                status: 'open',
                attempt_count: 3,
                next_payment_attempt: Math.floor((Date.now() + 2 * 24 * 60 * 60 * 1000) / 1000)
              }
            }
          },
          status: 'failed',
          errorMessage: 'Customer card was declined - insufficient funds',
          processedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        })
      );
    }

    // Subscription cancellation webhook
    webhookLogs.push(
      await WebhookLog.create({
        provider: 'stripe',
        eventType: 'customer.subscription.deleted',
        payload: {
          id: 'evt_' + crypto.randomBytes(12).toString('hex'),
          object: 'event',
          type: 'customer.subscription.deleted',
          created: Math.floor((Date.now() - 25 * 24 * 60 * 60 * 1000) / 1000),
          data: {
            object: {
              id: premiumUserSubscription.chargebeeSubscriptionId,
              customer: 'cus_' + crypto.randomBytes(8).toString('hex'),
              status: 'canceled',
              canceled_at: Math.floor((Date.now() - 25 * 24 * 60 * 60 * 1000) / 1000),
              cancellation_details: {
                reason: 'cancellation_requested',
                comment: 'Customer requested cancellation via support'
              }
            }
          }
        },
        status: 'processed',
        processedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
      })
    );

    // Custom system webhooks
    webhookLogs.push(
      await WebhookLog.create({
        provider: 'system',
        eventType: 'license.activated',
        payload: {
          licenseId: activeLicenses[0]?.id,
          userId: testUser.id,
          productId: allAccessProduct.id,
          domain: 'mycompany-website.com',
          activatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          ipAddress: '192.168.1.100',
          userAgent: 'CodeSeek-Client/1.0.0'
        },
        status: 'processed',
        processedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
      }),

      await WebhookLog.create({
        provider: 'system',
        eventType: 'license.verification',
        payload: {
          licenseKey: activeLicenses[1]?.key,
          domain: 'premium-dev-studio.com',
          verificationResult: 'valid',
          productName: 'DigiCode Pro',
          requestTimestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          clientVersion: '2.1.0'
        },
        status: 'processed',
        processedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      })
    );

    // Pending webhook (simulating processing delay)
    webhookLogs.push(
      await WebhookLog.create({
        provider: 'stripe',
        eventType: 'invoice.upcoming',
        payload: {
          id: 'evt_' + crypto.randomBytes(12).toString('hex'),
          object: 'event',
          type: 'invoice.upcoming',
          created: Math.floor(Date.now() / 1000),
          data: {
            object: {
              id: 'in_upcoming_' + crypto.randomBytes(8).toString('hex'),
              customer: 'cus_' + crypto.randomBytes(8).toString('hex'),
              subscription: testUserSubscription.chargebeeSubscriptionId,
              amount_due: 2999,
              currency: 'usd',
              period_start: Math.floor((Date.now() + 25 * 24 * 60 * 60 * 1000) / 1000),
              period_end: Math.floor((Date.now() + 55 * 24 * 60 * 60 * 1000) / 1000)
            }
          }
        },
        status: 'pending',
        processedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    );

    console.log(`✅ Created ${webhookLogs.length} webhook logs with various statuses and providers`);

    // ====== STEP 9: CONFIGURAÇÕES COMPLETAS ======
    console.log('⚙️ Creating comprehensive system settings...');
    
    await Setting.bulkCreate([
      // Site Settings
      { key: 'site_name', value: { value: 'CodeSeek' } },
      { key: 'site_description', value: { value: 'Professional Digital Marketplace for Software, Games, and Educational Content' } },
      { key: 'site_logo', value: { value: '/public/images/logo.svg' } },
      { key: 'site_favicon', value: { value: '/public/images/favicon.ico' } },
      { key: 'site_footer_text', value: { value: '© 2025 CodeSeek. All rights reserved.' } },
      { key: 'site_maintenance_mode', value: { value: false } },
      { key: 'site_maintenance_message', value: { value: 'We are currently performing scheduled maintenance. Please check back soon!' } },

      // Payment Settings (Chargebee)
    { key: 'chargebee_site', value: { value: process.env.CHARGEBEE_SITE || '' } },
    { key: 'chargebee_api_key', value: { value: process.env.CHARGEBEE_API_KEY || '' } },
      { key: 'payment_currency', value: { value: 'USD' } },
      { key: 'payment_tax_rate', value: { value: 0.00 } },
      { key: 'payment_processing_fee', value: { value: 0.029 } }, // 2.9%

      // SMTP Settings
      { key: 'smtp_host', value: { value: process.env.SMTP_HOST || 'smtp.gmail.com' } },
      { key: 'smtp_port', value: { value: process.env.SMTP_PORT || '587' } },
      { key: 'smtp_secure', value: { value: false } },
      { key: 'smtp_user', value: { value: process.env.SMTP_USER || '' } },
      { key: 'smtp_pass', value: { value: process.env.SMTP_PASS || '' } },
      { key: 'smtp_from_name', value: { value: 'CodeSeek Pro' } },
      { key: 'smtp_from_email', value: { value: 'noreply@codeseek.com' } },

      // Email Templates - Purchase
      { key: 'email_purchase_subject', value: { value: '🎉 Welcome to CodeSeek Pro - Your Purchase is Complete!' } },
      { key: 'email_purchase_body', value: { 
        value: 
          `<h2>Thank you for your purchase!</h2>
          <p>Hi \{{username\}},</p>
          <p>Your purchase of <strong>\{{productName\}}</strong> has been completed successfully.</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📄 Purchase Details:</h3>
            <p><strong>Product:</strong> \{{productName\}}</p>
            <p><strong>License Key:</strong> <code>\{{licenseKey\}}</code></p>
            <p><strong>Amount:</strong> $\{{amount\}}</p>
            <p><strong>Purchase Date:</strong> \{{purchaseDate\}}</p>
          </div>
          <p>You can download your product and manage your licenses at: <a href="\{{dashboardUrl\}}">Your Dashboard</a></p>
          <p>If you need any assistance, feel free to contact our support team.</p>
          <p>Best regards,<br>The CodeSeek Pro Team</p>` 
      }},

      // Email Templates - Renewal
      { key: 'email_renewal_subject', value: { value: '🔄 Your CodeSeek Pro Subscription Has Been Renewed' } },
      { key: 'email_renewal_body', value: { 
        value: 
          `<h2>Subscription Renewed Successfully!</h2>
          <p>Hi \{{username\}},</p>
          <p>Your <strong>\{{planName\}}</strong> subscription has been renewed automatically.</p>
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📋 Renewal Details:</h3>
            <p><strong>Plan:</strong> \{{planName\}}</p>
            <p><strong>Amount:</strong> $\{{amount\}}</p>
            <p><strong>Next Billing Date:</strong> \{{nextBillingDate\}}</p>
            <p><strong>Billing Period:</strong> \{{currentPeriodStart\}} - \{{currentPeriodEnd\}}</p>
          </div>
          <p>Continue enjoying unlimited access to our premium products at: <a href="\{{dashboardUrl\}}">Your Dashboard</a></p>
          <p>Best regards,<br>The CodeSeek Pro Team</p>`
      }},

      // Email Templates - Welcome
      { key: 'email_welcome_subject', value: { value: '👋 Welcome to CodeSeek Pro!' } },
      { key: 'email_welcome_body', value: { 
        value: 
          `<h2>Welcome to CodeSeek Pro!</h2>
          <p>Hi \{{username\}},</p>
          <p>Thank you for joining CodeSeek Pro - your premium digital marketplace!</p>
          <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>🚀 Get Started:</h3>
            <ul>
              <li>Browse our <a href="\{{productsUrl\}}">Product Catalog</a></li>
              <li>Check out our <a href="\{{pricingUrl\}}">Subscription Plans</a></li>
              <li>Manage your account in your <a href="\{{dashboardUrl\}}">Dashboard</a></li>
            </ul>
          </div>
          <p>If you have any questions, our support team is here to help!</p>
          <p>Best regards,<br>The CodeSeek Pro Team</p>`
      }},

      // Email Templates - License Expiry Warning
      { key: 'email_expiry_warning_subject', value: { value: '⚠️ Your License Will Expire Soon' } },
      { key: 'email_expiry_warning_body', value: { 
        value: 
          `<h2>License Expiry Notice</h2>
          <p>Hi \{{username\}},</p>
          <p>Your license for <strong>\{{productName\}}</strong> will expire in \{{daysUntilExpiry\}} days.</p>
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📄 License Details:</h3>
            <p><strong>Product:</strong> \{{productName\}}</p>
            <p><strong>License Key:</strong> <code>\{{licenseKey\}}</code></p>
            <p><strong>Expiry Date:</strong> \{{expiryDate\}}</p>
          </div>
          <p>To continue using this product, please renew your license or consider our All Access subscription.</p>
          <p><a href="\{{renewUrl\}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Renew License</a></p>
          <p>Best regards,<br>The CodeSeek Pro Team</p>`
      }},

      // Security Settings
      { key: 'security_password_min_length', value: { value: 8 } },
      { key: 'security_require_email_verification', value: { value: true } },
      { key: 'security_session_timeout', value: { value: 86400 } }, // 24 hours
      { key: 'security_max_login_attempts', value: { value: 5 } },
      { key: 'security_lockout_duration', value: { value: 1800 } }, // 30 minutes

      // License Settings
      { key: 'license_default_duration', value: { value: 365 } }, // days
      { key: 'license_grace_period', value: { value: 7 } }, // days after expiry
      { key: 'license_verification_cache', value: { value: 300 } }, // 5 minutes
      { key: 'license_max_activations_default', value: { value: 3 } },

      // System Settings
      { key: 'system_timezone', value: { value: 'UTC' } },
      { key: 'system_date_format', value: { value: 'YYYY-MM-DD' } },
      { key: 'system_log_level', value: { value: 'info' } },
      { key: 'system_backup_enabled', value: { value: true } },
      { key: 'system_backup_frequency', value: { value: 'daily' } },

      // Upload Settings
      { key: 'upload_max_file_size', value: { value: 104857600 } }, // 100MB
      { key: 'upload_allowed_types', value: { value: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'zip', 'rar', 'pdf'] } },
      { key: 'upload_path', value: { value: './uploads' } },
      { key: 'upload_cleanup_temp_files', value: { value: true } },

      // API Settings
      { key: 'api_rate_limit_enabled', value: { value: true } },
      { key: 'api_rate_limit_requests', value: { value: 100 } },
      { key: 'api_rate_limit_window', value: { value: 900 } }, // 15 minutes
      { key: 'api_version', value: { value: '1.0' } }

    ], { ignoreDuplicates: true });

    console.log(`✅ Created comprehensive system settings`);

    // ====== SUMMARY REPORT ======
    console.log('\n📊 === DATABASE SEED SUMMARY ===');
    console.log(`👥 Users: 4 (1 admin, 3 users with different status)`);
    console.log(`📂 Categories: 4 (Software, Games, E-books, Courses)`);
    console.log(`📦 Products: 4 comprehensive products with full details`);
    console.log(`🎫 Licenses: ${licenses.length} (various statuses and expiry dates)`);
    console.log(`🔗 Activations: ${activations.length} (realistic usage patterns)`);
    console.log(`📋 Subscriptions: 2 (1 active All Access, 1 cancelled)`);
    console.log(`🧾 Invoices: ${invoices.length} (paid, failed, various amounts)`);
    console.log(`📬 Webhooks: ${webhookLogs.length} (Chargebee + custom events)`);
    console.log(`⚙️ Settings: Comprehensive system configuration`);
    console.log('\n✅ Database seed completed successfully with realistic test data!');

  } catch (error) {
    console.error('❌ Error during comprehensive seed:', error);
    throw error;
  }
}

if (require.main === module) {
  seedDatabase().then(() => {
    console.log('🎉 Comprehensive seed finished!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Comprehensive seed failed:', error);
    process.exit(1);
  });
}

module.exports = { seedDatabase };
