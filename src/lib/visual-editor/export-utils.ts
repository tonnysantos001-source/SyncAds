/**
 * Export Utilities - Advanced Export Features
 * Sistema avançado de export com ZIP download, deploy e share
 */

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Export project as ZIP with proper structure
 */
export async function exportAsZip(
    htmlCode: string,
    cssCode: string,
    jsCode: string,
    projectName: string = 'my-website'
): Promise<void> {
    const zip = new JSZip();

    // Add files
    zip.file('index.html', htmlCode);

    if (cssCode.trim()) {
        zip.file('styles.css', cssCode);
    }

    if (jsCode.trim()) {
        zip.file('script.js', jsCode);
    }

    // Add README
    zip.file('README.md', generateReadme(projectName));

    // Generate and download
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${projectName}.zip`);
}

/**
 * Export with complete project structure
 */
export async function exportAsFullProject(
    htmlCode: string,
    cssCode: string,
    jsCode: string,
    projectName: string = 'my-website'
): Promise<void> {
    const zip = new JSZip();

    // Create folders
    const srcFolder = zip.folder('src');
    const publicFolder = zip.folder('public');

    // Add source files
    srcFolder?.file('index.html', htmlCode);
    srcFolder?.file('styles.css', cssCode);
    srcFolder?.file('script.js', jsCode);

    // Add package.json
    zip.file('package.json', generatePackageJson(projectName));

    // Add README
    zip.file('README.md', generateAdvancedReadme(projectName));

    // Add .gitignore
    zip.file('.gitignore', generateGitignore());

    //  Generate and download
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${projectName}.zip`);
}

/**
 * Generate basic README
 */
function generateReadme(projectName: string): string {
    return `# ${projectName}

Website criado com Visual Editor Pro

## Como Usar

1. Abra o arquivo \`index.html\` no navegador
2. Para desenvolvimento local, use um servidor HTTP:
   \`\`\`bash
   npx serve .
   \`\`\`

## Deploy

### Vercel
\`\`\`bash
npx vercel
\`\`\`

### Netlify
Arraste a pasta para https://app.netlify.com/drop

## Tecnologias

- HTML5
- Tailwind CSS
- JavaScript (Vanilla)

---

Criado com ❤️ usando Visual Editor Pro
`;
}

/**
 * Generate advanced README
 */
function generateAdvancedReadme(projectName: string): string {
    return `# ${projectName}

> Website profissional criado com Visual Editor Pro

## 🚀 Quick Start

\`\`\`bash
# Servir localmente
npx serve src

# ou
python -m http.server 8000
\`\`\`

Abra http://localhost:8000

## 📁 Estrutura

\`\`\`
${projectName}/
├── src/
│   ├── index.html      # Página principal
│   ├── styles.css      # Estilos personalizados
│   └── script.js       # JavaScript
├── public/             # Assets (images, fonts)
├── README.md
└── package.json
\`\`\`

## 🌐 Deploy

### Vercel (Recomendado)
\`\`\`bash
npm install -g vercel
vercel
\`\`\`

### Netlify
1. Acesse https://app.netlify.com
2. Arraste a pasta \`src/\`
3. Pronto!

### GitHub Pages
1. Crie um repositório no GitHub
2. Push dos arquivos
3. Ative GitHub Pages nas configurações

## 🛠️ Tecnologias

- **HTML5** - Estrutura semântica
- **Tailwind CSS** - Estilização moderna
- **JavaScript** - Interatividade

## 📝 Licença

MIT

---

**Criado com** [Visual Editor Pro](https://syncads.com)
`;
}

/**
 * Generate package.json
 */
function generatePackageJson(projectName: string): string {
    return JSON.stringify({
        name: projectName.toLowerCase().replace(/\s+/g, '-'),
        version: '1.0.0',
        description: `Website criado com Visual Editor Pro`,
        scripts: {
            dev: 'npx serve src',
            build: 'echo "No build step needed"',
        },
        keywords: ['website', 'tailwind', 'html'],
        author: '',
        license: 'MIT',
    }, null, 2);
}

/**
 * Generate .gitignore
 */
function generateGitignore(): string {
    return `# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
build/
dist/

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
`;
}

/**
 * Copy code to clipboard
 */
export async function copyToClipboard(code: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(code);
        return true;
    } catch (error) {
        console.error('Failed to copy:', error);
        return false;
    }
}

/**
 * Share preview link (would need backend implementation)
 */
export async function sharePreviewLink(
    htmlCode: string,
    cssCode: string,
    jsCode: string
): Promise<string | null> {
    // This would need a backend service to store the preview
    // For now, return null - to be implemented later
    console.log('Share preview not implemented yet');
    return null;
}
