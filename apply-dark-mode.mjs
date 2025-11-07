import fs from 'fs';

const files = [
  'src/pages/app/marketing/CashbackPage.tsx',
  'src/pages/app/marketing/CouponsPage.tsx',
  'src/pages/app/marketing/CrossSellPage.tsx',
  'src/pages/app/marketing/DiscountBannerPage.tsx',
  'src/pages/app/marketing/OrderBumpPage.tsx',
  'src/pages/app/marketing/PixelsPage.tsx',
  'src/pages/app/marketing/UpsellPage.tsx',
  'src/pages/app/orders/AllOrdersPage.tsx',
  'src/pages/app/orders/OrdersManagementPage.tsx',
  'src/pages/app/reports/AudiencePage.tsx',
  'src/pages/app/reports/ReportsOverviewPage.tsx',
  'src/pages/app/reports/UtmsPage.tsx'
];

const replacements = [
  {
    from: /bg-white\/80 backdrop-blur-xl shadow-lg"/g,
    to: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg"'
  },
  {
    from: /border-gray-200 bg-white\/80 backdrop-blur-sm"/g,
    to: 'border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm dark:text-white dark:placeholder:text-gray-500"'
  }
];

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    replacements.forEach(({ from, to }) => {
      if (from.test(content)) {
        content = content.replace(from, to);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅ ${file}`);
    } else {
      console.log(`⏭️  ${file} (sem mudanças)`);
    }
  } catch (err) {
    console.error(`❌ ${file}: ${err.message}`);
  }
});

console.log('\n✨ Dark mode aplicado!');
