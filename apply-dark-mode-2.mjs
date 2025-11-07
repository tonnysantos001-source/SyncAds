import fs from 'fs';

const files = [
  'src/pages/app/marketing/DiscountBannerPage.tsx',
  'src/pages/app/marketing/PixelsPage.tsx',
  'src/pages/app/marketing/UpsellPage.tsx',
  'src/pages/app/orders/OrdersManagementPage.tsx',
  'src/pages/app/orders/AbandonedCartsPage.tsx',
  'src/pages/app/orders/PixRecoveredPage.tsx',
  'src/pages/app/products/CollectionsPage.tsx',
  'src/pages/app/products/KitsPage.tsx',
  'src/pages/app/reports/AdsPage.tsx',
  'src/pages/app/DashboardPage.tsx',
  'src/pages/app/BillingPage.tsx',
  'src/pages/app/ShippingPage.tsx',
  'src/pages/app/TeamPage.tsx'
];

const replacements = [
  {
    from: /(className="[^"]*)(bg-white)(\s|")/g,
    to: '$1bg-white dark:bg-gray-900$3'
  },
  {
    from: /(className="[^"]*)(bg-gray-50)(\s|")/g,
    to: '$1bg-gray-50 dark:bg-gray-950$3'
  },
  {
    from: /(className="[^"]*)(text-gray-900)(\s|")/g,
    to: '$1text-gray-900 dark:text-white$3'
  },
  {
    from: /(className="[^"]*)(text-gray-600)(\s|")/g,
    to: '$1text-gray-600 dark:text-gray-300$3'
  }
];

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    replacements.forEach(({ from, to }) => {
      const newContent = content.replace(from, to);
      if (newContent !== content) {
        content = newContent;
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

console.log('\n✨ Dark mode aplicado em mais páginas!');
