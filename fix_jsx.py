#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Read file
with open('src/pages/public/NewLandingPage.tsx', 'r', encoding='utf-8') as f:
   content = f.read()

# Fix specific malformed patterns - literal string replacement
replacements = [
    ('    </div >', '    </div>'),
    ('  </section >', '  </section>'),
    ('      </section >', '      </section>'),
    ('{/* AI Multimodal Section */ }', '{/* AI Multimodal Section */}'),
    ('  < section className = "py-24 relative overflow-hidden" >', '  <section className="py-24 relative overflow-hidden">'),
    ('{/* Store Cloning Section */ }', '{/* Store Cloning Section */}'),
    ('  < section className = "py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950" >', '  <section className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">'),
    ('{/* Pricing Section */ }', '{/* Pricing Section */}'),
    ('  < section\nid = "pricing"\nclassName = "py-24 bg-gray-50 dark:bg-gray-900 relative"', '  <section\n    id="pricing"\n    className="py-24 bg-gray-50 dark:bg-gray-900 relative"'),
    ('{/* FAQ Section */ }', '{/* FAQ Section */}'),
    ('  < section id = "faq" className = "py-24 bg-white dark:bg-gray-950" >', '  <section id="faq" className="py-24 bg-white dark:bg-gray-950">'),
    ('{/* Footer */ }', '{/* Footer */}'),
    ('  < LandingFooter />', '  <LandingFooter />'),
    ('    </div >', '    </div>'),
]

for old, new in replacements:
    content = content.replace(old, new)

# Write back
with open('src/pages/public/NewLandingPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed all malformed JSX tags!")
