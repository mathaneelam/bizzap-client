import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper for absolute paths
const resolvePath = (...segments) => path.resolve(__dirname, '..', ...segments);

// 1. Parse Arguments
const siteJsonArg = process.argv[2];
if (!siteJsonArg) {
  console.error('\x1b[31mError: No site.json path provided.\x1b[0m');
  console.log('Usage: node build.js <path-to-site.json>');
  console.log('Example: node build.js sites/sri-vinayak-cotsyn/site.json');
  process.exit(1);
}

const siteJsonPath = path.resolve(process.cwd(), siteJsonArg);
if (!fs.existsSync(siteJsonPath)) {
  console.error(`\x1b[31mError: site.json not found at "${siteJsonPath}"\x1b[0m`);
  process.exit(1);
}

console.log(`\x1b[36m[Bizzap Builder] Loading site config: ${siteJsonArg}\x1b[0m`);

// 2. Validate against Schema
const schemaPath = resolvePath('schema', 'site.schema.json');
if (!fs.existsSync(schemaPath)) {
  console.error(`\x1b[31mError: Schema not found at "${schemaPath}"\x1b[0m`);
  process.exit(1);
}

try {
  const siteConfig = JSON.parse(fs.readFileSync(siteJsonPath, 'utf8'));
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

  const ajv = new Ajv({ allErrors: true, useDefaults: true });
  addFormats(ajv);

  const validate = ajv.compile(schema);
  const valid = validate(siteConfig);

  if (!valid) {
    console.error('\x1b[31m[Bizzap Builder] Schema Validation Failed:\x1b[0m');
    validate.errors.forEach(err => {
      console.error(`  - \x1b[33m${err.instancePath || 'root'}\x1b[0m: ${err.message}`);
      if (err.params) {
        console.error(`    Details: ${JSON.stringify(err.params)}`);
      }
    });
    process.exit(1);
  }
  console.log('\x1b[32m[Bizzap Builder] JSON Schema validation passed.\x1b[0m');

  // 3. Write site config into React src folder
  const currentSiteDest = path.join(__dirname, 'src', 'current-site.json');
  fs.writeFileSync(currentSiteDest, JSON.stringify(siteConfig, null, 2), 'utf8');
  console.log(`[Bizzap Builder] Copied configuration to ${currentSiteDest}`);

  // 4. Handle Custom Assets
  const businessDir = path.dirname(siteJsonPath);
  const assetsSrcDir = path.join(businessDir, 'assets');
  const publicAssetsDestDir = path.join(__dirname, 'public', 'assets');

  // Ensure clean target directories
  if (fs.existsSync(publicAssetsDestDir)) {
    fs.rmSync(publicAssetsDestDir, { recursive: true, force: true });
  }

  if (fs.existsSync(assetsSrcDir)) {
    fs.mkdirSync(publicAssetsDestDir, { recursive: true });
    
    // Copy all assets
    const copyRecursive = (src, dest) => {
      const exists = fs.existsSync(src);
      const stats = exists && fs.statSync(src);
      const isDirectory = exists && stats.isDirectory();
      if (isDirectory) {
        fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach((childItemName) => {
          copyRecursive(path.join(src, childItemName), path.join(dest, childItemName));
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    };
    
    copyRecursive(assetsSrcDir, publicAssetsDestDir);
    console.log(`[Bizzap Builder] Copied business assets from ${assetsSrcDir} to ${publicAssetsDestDir}`);
  } else {
    console.log('[Bizzap Builder] No business assets directory found. Skipping asset copy.');
  }

  // 5. Trigger Vite Build
  console.log('\x1b[36m[Bizzap Builder] Running static compiler...\x1b[0m');
  execSync('npx vite build', {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  // 6. Post-process dist/index.html to inject SEO tags statically for search engines
  const distHtmlPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(distHtmlPath)) {
    let htmlContent = fs.readFileSync(distHtmlPath, 'utf8');

    // Replace Title
    const titleRegex = /<title>[\s\S]*?<\/title>/i;
    const newTitle = `<title>${siteConfig.seo.title}</title>`;
    htmlContent = htmlContent.replace(titleRegex, newTitle);

    // Build Meta & JSON-LD Tags (GEO Optimized)
    let seoTags = `\n    <meta name="description" content="${siteConfig.seo.meta_description}" />`;
    if (siteConfig.seo.keywords && siteConfig.seo.keywords.length > 0) {
      seoTags += `\n    <meta name="keywords" content="${siteConfig.seo.keywords.join(', ')}" />`;
    }
    // GEO meta tags for AI crawlers
    seoTags += `\n    <meta name="generative-engine-optimization" content="enabled; version=1.0" />`;
    seoTags += `\n    <meta name="ai-optimized" content="true" />`;

    // Determine Schema Type
    let schemaType = 'LocalBusiness';
    if (siteConfig.template === 'manufacturer') {
      schemaType = 'ManufacturingBusiness';
    } else if (siteConfig.template === 'clinic') {
      schemaType = 'MedicalBusiness';
    } else if (siteConfig.template === 'food') {
      schemaType = 'FoodEstablishment';
    }

    // Extract capabilities for knowsAbout
    const capSection = siteConfig.sections.find(s => s.type === 'capabilities');
    const capabilities = capSection && Array.isArray(capSection.items) ? capSection.items : [];

    // Extract priceRange
    const catSection = siteConfig.sections.find(s => s.type === 'catalog');
    const catalogItems = catSection && Array.isArray(catSection.items) ? catSection.items : [];
    const priceList = catalogItems.map(i => i.price).filter(Boolean);
    const priceRange = priceList.length > 0 ? '$$' : '$$';

    // Socials sameAs
    const sameAs = [];
    if (siteConfig.contact.socials) {
      if (siteConfig.contact.socials.instagram) sameAs.push(siteConfig.contact.socials.instagram);
      if (siteConfig.contact.socials.facebook) sameAs.push(siteConfig.contact.socials.facebook);
    }

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': schemaType,
      'name': siteConfig.meta.name,
      'description': siteConfig.meta.description,
      'telephone': siteConfig.contact.phone,
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': siteConfig.contact.address,
        'addressLocality': 'Tiruppur',
        'addressRegion': 'Tamil Nadu',
        'addressCountry': 'IN',
      },
      'areaServed': [
        { '@type': 'AdministrativeArea', 'name': 'Tiruppur' },
        { '@type': 'AdministrativeArea', 'name': 'Tamil Nadu' }
      ],
      'priceRange': priceRange,
      'knowsAbout': capabilities,
      'sameAs': sameAs.length > 0 ? sameAs : undefined
    };

    seoTags += `\n    <script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n    </script>`;

    // Insert right after <head>
    htmlContent = htmlContent.replace(/<head>/i, `<head>${seoTags}`);

    fs.writeFileSync(distHtmlPath, htmlContent, 'utf8');
    console.log('[Bizzap Builder] Post-processed dist/index.html to inject static SEO & JSON-LD tags.');
  }

  console.log('\x1b[32m\x1b[1m[Bizzap Builder] Static build completed successfully!\x1b[0m');
  console.log(`Output files are in: ${path.join(__dirname, 'dist')}`);

} catch (err) {
  console.error('\x1b[31mError during build pipeline execution:\x1b[0m');
  console.error(err);
  process.exit(1);
}
