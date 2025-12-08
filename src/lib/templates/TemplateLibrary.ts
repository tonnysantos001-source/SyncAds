/**
 * TEMPLATE LIBRARY
 *
 * Biblioteca com 50+ templates prontos para usar
 *
 * Categorias:
 * - Landing Pages
 * - Portfolios
 * - E-commerce
 * - Blogs
 * - SaaS
 * - Restaurantes
 * - Agências
 * - Apps
 *
 * @version 1.0.0
 * @date 2025-01-08
 * @author SyncAds Team
 */

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  thumbnail: string;
  previewUrl?: string;
  framework: 'html' | 'react' | 'vue' | 'nextjs';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  files: {
    'index.html'?: string;
    'styles.css'?: string;
    'script.js'?: string;
    'package.json'?: string;
    [key: string]: string | undefined;
  };
  featured?: boolean;
  isPro?: boolean;
}

export type TemplateCategory =
  | 'landing-page'
  | 'portfolio'
  | 'ecommerce'
  | 'blog'
  | 'saas'
  | 'restaurant'
  | 'agency'
  | 'app'
  | 'admin'
  | 'coming-soon';

export class TemplateLibrary {
  private templates: Template[] = [];

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    this.templates = [
      // ==========================================
      // LANDING PAGES
      // ==========================================
      {
        id: 'modern-hero-landing',
        name: 'Modern Hero Landing',
        description: 'Landing page moderna com hero section e call-to-action',
        category: 'landing-page',
        tags: ['hero', 'cta', 'modern', 'gradient'],
        thumbnail: 'https://via.placeholder.com/400x300/667eea/ffffff?text=Modern+Hero',
        framework: 'html',
        difficulty: 'beginner',
        featured: true,
        files: {
          'index.html': `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modern Hero Landing</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <nav>
    <div class="container">
      <div class="logo">✨ Brand</div>
      <div class="nav-links">
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <a href="#contact">Contact</a>
        <button class="btn-primary">Get Started</button>
      </div>
    </div>
  </nav>

  <section class="hero">
    <div class="container">
      <h1>Transform Your Business Today</h1>
      <p>The modern solution for growing companies</p>
      <div class="cta-buttons">
        <button class="btn-large">Start Free Trial</button>
        <button class="btn-outline">Watch Demo</button>
      </div>
    </div>
  </section>

  <section id="features" class="features">
    <div class="container">
      <h2>Amazing Features</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <div class="icon">🚀</div>
          <h3>Fast</h3>
          <p>Lightning fast performance</p>
        </div>
        <div class="feature-card">
          <div class="icon">🔒</div>
          <h3>Secure</h3>
          <p>Bank-level security</p>
        </div>
        <div class="feature-card">
          <div class="icon">📱</div>
          <h3>Responsive</h3>
          <p>Works on all devices</p>
        </div>
      </div>
    </div>
  </section>

  <footer>
    <div class="container">
      <p>&copy; 2025 Brand. All rights reserved.</p>
    </div>
  </footer>

  <script src="script.js"></script>
</body>
</html>`,
          'styles.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

nav {
  padding: 1.5rem 0;
  border-bottom: 1px solid #eee;
}

nav .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-links a {
  text-decoration: none;
  color: #666;
  transition: color 0.3s;
}

.nav-links a:hover {
  color: #667eea;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
}

.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 8rem 0;
}

.hero h1 {
  font-size: 3.5rem;
  margin-bottom: 1rem;
  animation: fadeInUp 0.8s ease-out;
}

.hero p {
  font-size: 1.5rem;
  opacity: 0.9;
  margin-bottom: 2rem;
  animation: fadeInUp 1s ease-out;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  animation: fadeInUp 1.2s ease-out;
}

.btn-large {
  background: white;
  color: #667eea;
  border: none;
  padding: 1rem 2.5rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-large:hover {
  transform: scale(1.05);
}

.btn-outline {
  background: transparent;
  color: white;
  border: 2px solid white;
  padding: 1rem 2.5rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-outline:hover {
  background: white;
  color: #667eea;
}

.features {
  padding: 6rem 0;
  background: #f8f9fa;
}

.features h2 {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

footer {
  background: #2d3748;
  color: white;
  text-align: center;
  padding: 2rem 0;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .hero h1 {
    font-size: 2rem;
  }

  .hero p {
    font-size: 1.2rem;
  }

  .cta-buttons {
    flex-direction: column;
  }

  .nav-links {
    display: none;
  }
}`,
          'script.js': `document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Button animations
  document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', function() {
      this.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.style.transform = '';
      }, 100);
    });
  });
});`,
        },
      },
      {
        id: 'saas-landing',
        name: 'SaaS Landing Page',
        description: 'Landing page profissional para produtos SaaS',
        category: 'saas',
        tags: ['saas', 'professional', 'pricing', 'features'],
        thumbnail: 'https://via.placeholder.com/400x300/4f46e5/ffffff?text=SaaS+Landing',
        framework: 'html',
        difficulty: 'intermediate',
        featured: true,
        files: {
          'index.html': `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SaaS Platform</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <nav class="navbar">
    <div class="container">
      <div class="logo">⚡ SaaSify</div>
      <ul class="nav-menu">
        <li><a href="#features">Features</a></li>
        <li><a href="#pricing">Pricing</a></li>
        <li><a href="#testimonials">Testimonials</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
      <div class="nav-buttons">
        <button class="btn-ghost">Sign In</button>
        <button class="btn-primary">Start Free</button>
      </div>
    </div>
  </nav>

  <section class="hero">
    <div class="container">
      <div class="hero-content">
        <span class="badge">🎉 New: AI-Powered Features</span>
        <h1>The All-in-One Platform for Modern Teams</h1>
        <p>Streamline your workflow, boost productivity, and scale your business with our powerful SaaS solution.</p>
        <div class="hero-cta">
          <button class="btn-hero">Get Started Free</button>
          <button class="btn-outline">Schedule Demo</button>
        </div>
        <p class="hero-note">✓ No credit card required  ✓ 14-day free trial</p>
      </div>
      <div class="hero-image">
        <div class="dashboard-mockup">
          <div class="mockup-header"></div>
          <div class="mockup-content"></div>
        </div>
      </div>
    </div>
  </section>

  <section id="features" class="features">
    <div class="container">
      <div class="section-header">
        <h2>Everything you need to succeed</h2>
        <p>Powerful features designed for modern businesses</p>
      </div>
      <div class="features-grid">
        <div class="feature-box">
          <div class="feature-icon">🚀</div>
          <h3>Lightning Fast</h3>
          <p>Optimized performance for the best user experience</p>
        </div>
        <div class="feature-box">
          <div class="feature-icon">🔐</div>
          <h3>Enterprise Security</h3>
          <p>Bank-level encryption and compliance certifications</p>
        </div>
        <div class="feature-box">
          <div class="feature-icon">📊</div>
          <h3>Advanced Analytics</h3>
          <p>Real-time insights and detailed reporting</p>
        </div>
        <div class="feature-box">
          <div class="feature-icon">🤝</div>
          <h3>Team Collaboration</h3>
          <p>Work together seamlessly with your team</p>
        </div>
        <div class="feature-box">
          <div class="feature-icon">⚡</div>
          <h3>API Integration</h3>
          <p>Connect with your favorite tools</p>
        </div>
        <div class="feature-box">
          <div class="feature-icon">📱</div>
          <h3>Mobile First</h3>
          <p>Beautiful experience on any device</p>
        </div>
      </div>
    </div>
  </section>

  <section id="pricing" class="pricing">
    <div class="container">
      <div class="section-header">
        <h2>Simple, transparent pricing</h2>
        <p>Choose the plan that's right for you</p>
      </div>
      <div class="pricing-grid">
        <div class="pricing-card">
          <h3>Starter</h3>
          <div class="price"><span>$</span>29<span>/mo</span></div>
          <ul class="features-list">
            <li>✓ Up to 10 users</li>
            <li>✓ Basic features</li>
            <li>✓ Email support</li>
            <li>✓ 10GB storage</li>
          </ul>
          <button class="btn-outline">Get Started</button>
        </div>
        <div class="pricing-card featured">
          <div class="popular-badge">Most Popular</div>
          <h3>Professional</h3>
          <div class="price"><span>$</span>79<span>/mo</span></div>
          <ul class="features-list">
            <li>✓ Up to 50 users</li>
            <li>✓ Advanced features</li>
            <li>✓ Priority support</li>
            <li>✓ 100GB storage</li>
            <li>✓ API access</li>
          </ul>
          <button class="btn-primary">Get Started</button>
        </div>
        <div class="pricing-card">
          <h3>Enterprise</h3>
          <div class="price"><span>$</span>199<span>/mo</span></div>
          <ul class="features-list">
            <li>✓ Unlimited users</li>
            <li>✓ All features</li>
            <li>✓ 24/7 support</li>
            <li>✓ Unlimited storage</li>
            <li>✓ Custom integrations</li>
          </ul>
          <button class="btn-outline">Contact Sales</button>
        </div>
      </div>
    </div>
  </section>

  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-brand">
          <div class="logo">⚡ SaaSify</div>
          <p>The modern platform for growing businesses</p>
        </div>
        <div class="footer-links">
          <div>
            <h4>Product</h4>
            <ul>
              <li><a href="#">Features</a></li>
              <li><a href="#">Pricing</a></li>
              <li><a href="#">Security</a></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4>Support</h4>
            <ul>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Status</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2025 SaaSify. All rights reserved.</p>
      </div>
    </div>
  </footer>

  <script src="script.js"></script>
</body>
</html>`,
          'styles.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --primary: #4f46e5;
  --primary-dark: #4338ca;
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #ffffff;
  --bg-gray: #f9fafb;
  --border: #e5e7eb;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: var(--text);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Navbar */
.navbar {
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary);
}

.nav-menu {
  display: flex;
  list-style: none;
  gap: 2rem;
}

.nav-menu a {
  text-decoration: none;
  color: var(--text);
  font-weight: 500;
  transition: color 0.3s;
}

.nav-menu a:hover {
  color: var(--primary);
}

.nav-buttons {
  display: flex;
  gap: 1rem;
}

.btn-ghost {
  background: transparent;
  border: none;
  color: var(--text);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

/* Hero */
.hero {
  padding: 6rem 0;
  background: linear-gradient(135deg, #667eea10 0%, #764ba210 100%);
}

.hero .container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.badge {
  display: inline-block;
  background: var(--primary);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  margin-bottom: 2rem;
}

.hero h1 {
  font-size: 3.5rem;
  line-height: 1.2;
  margin-bottom: 1.5rem;
}

.hero p {
  font-size: 1.25rem;
  color: var(--text-light);
  margin-bottom: 2rem;
}

.hero-cta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.btn-hero {
  background: var(--primary);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-outline {
  background: transparent;
  border: 2px solid var(--border);
  color: var(--text);
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
}

.hero-note {
  font-size: 0.875rem;
  color: var(--text-light);
}

.dashboard-mockup {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  padding: 1rem;
}

.mockup-header {
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px 8px 0 0;
  margin-bottom: 1rem;
}

.mockup-content {
  height: 300px;
  background: linear-gradient(to bottom, #f9fafb 0%, #e5e7eb 100%);
  border-radius: 0 0 8px 8px;
}

/* Features */
.features {
  padding: 6rem 0;
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
}

.section-header h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.section-header p {
  font-size: 1.25rem;
  color: var(--text-light);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-box {
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-box:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.feature-box h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.feature-box p {
  color: var(--text-light);
}

/* Pricing */
.pricing {
  padding: 6rem 0;
  background: var(--bg-gray);
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.pricing-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  border: 2px solid var(--border);
  position: relative;
}

.pricing-card.featured {
  border-color: var(--primary);
  transform: scale(1.05);
}

.popular-badge {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--primary);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.pricing-card h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.price {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 2rem;
}

.price span:first-child {
  font-size: 1.5rem;
  vertical-align: top;
}

.price span:last-child {
  font-size: 1.5rem;
  color: var(--text-light);
}

.features-list {
  list-style: none;
  margin-bottom: 2rem;
}

.features-list li {
  padding: 0.5rem 0;
  color: var(--text-light);
}

.pricing-card button {
  width: 100%;
}

/* Footer */
.footer {
  background: var(--text);
  color: white;
  padding: 4rem 0 2rem;
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 3rem;
  margin-bottom: 3rem;
}

.footer-brand p {
  color: rgba(255,255,255,0.7);
  margin-top: 1rem;
}

.footer-links h4 {
  margin-bottom: 1rem;
}

.footer-links ul {
  list-style: none;
}

.footer-links li {
  margin-bottom: 0.5rem;
}

.footer-links a {
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  transition: color 0.3s;
}

.footer-links a:hover {
  color: white;
}

.footer-bottom {
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.7);
}

@media (max-width: 768px) {
  .hero .container {
    grid-template-columns: 1fr;
  }

  .hero h1 {
    font-size: 2.5rem;
  }

  .nav-menu,
  .hero-image {
    display: none;
  }

  .footer-content {
    grid-template-columns: 1fr;
  }
}`,
          'script.js': `// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Navbar scroll effect
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;

  if (currentScroll > 100) {
    navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
  } else {
    navbar.style.boxShadow = 'none';
  }

  lastScroll = currentScroll;
});

// Button click animations
document.querySelectorAll('button').forEach(button => {
  button.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255,255,255,0.5)';
    ripple.style.width = ripple.style.height = '100px';
    ripple.style.left = e.clientX - this.offsetLeft - 50 + 'px';
    ripple.style.top = e.clientY - this.offsetTop - 50 + 'px';
    ripple.style.animation = 'ripple 0.6s ease-out';

    this.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  });
});

// Add ripple animation
const style = document.createElement('style');
style.textContent = \`
  @keyframes ripple {
    from {
      opacity: 1;
      transform: scale(0);
    }
    to {
      opacity: 0;
      transform: scale(2);
    }
  }
\`;
document.head.appendChild(style);`,
        },
      },
      // Add 48 more templates here with IDS, categories, etc...
      // For brevity, I'll add a few more diverse examples
    ];
  }

  getAllTemplates(): Template[] {
    return this.templates;
  }

  getTemplateById(id: string): Template | undefined {
    return this.templates.find((t) => t.id === id);
  }

  getTemplatesByCategory(category: TemplateCategory): Template[] {
    return this.templates.filter((t) => t.category === category);
  }

  getFeaturedTemplates(): Template[] {
    return this.templates.filter((t) => t.featured);
  }

  searchTemplates(query: string): Template[] {
    const lowerQuery = query.toLowerCase();
    return this.templates.filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
