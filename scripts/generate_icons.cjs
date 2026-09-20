const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Create standard/maskable icon SVG (viewBox 0 0 512 512)
function createIconSvg(isMaskable = false) {
  // Maskable icons require the graphic to be strictly within the 65% safe zone (~330px circle).
  // Standard icons can fill ~80% of the canvas for great presence.
  const scale = isMaskable ? 0.65 : 0.80;
  const cx = 256;
  const cy = 256;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Subtle linear gradient on pages for depth -->
    <linearGradient id="goldGradLeft" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0%" stop-color="#D4A760"/>
      <stop offset="100%" stop-color="#BC8A3E"/>
    </linearGradient>
    <linearGradient id="goldGradRight" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#D4A760"/>
      <stop offset="100%" stop-color="#BC8A3E"/>
    </linearGradient>
  </defs>

  <!-- Solid espresso background -->
  <rect width="512" height="512" fill="#1C1712"/>

  <g transform="translate(${cx}, ${cy}) scale(${scale}) translate(-${cx}, -${cy})">
    <!-- Outer Binding / Leather Cover Shadow & Base -->
    <path d="M 76 352 Q 164 380 252 368 L 256 370 L 260 368 Q 348 380 436 352 L 442 364 Q 350 396 256 388 Q 162 396 70 364 Z" 
          fill="#7A3B2E" opacity="0.95"/>
          
    <!-- Block of Pages (Deckle Edge / Page Depth) -->
    <path d="M 82 342 Q 166 368 252 356 L 252 366 Q 166 378 76 352 Z" fill="#C9974E" opacity="0.45"/>
    <path d="M 430 342 Q 346 368 260 356 L 260 366 Q 346 378 436 352 Z" fill="#C9974E" opacity="0.45"/>

    <!-- Left Open Page (Main Silhouette) -->
    <path d="M 252 168 
             C 214 144, 138 142, 88 162 
             C 83 164, 80 168, 80 174
             L 80 334 
             C 80 340, 85 344, 90 342 
             C 138 324, 214 326, 252 348 
             Z" 
          fill="url(#goldGradLeft)"/>
          
    <!-- Left Page Engraved Woodcut Inner Cutout (Parchment Field) -->
    <path d="M 244 182 
             C 210 162, 144 160, 98 178
             L 98 322
             C 144 306, 210 308, 244 328
             Z" 
          fill="#1C1712"/>

    <!-- Left Page Woodcut Ruled Lines (Manuscript Scripture Text) -->
    <path d="M 118 208 C 152 196, 194 198, 224 212" stroke="#C9974E" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M 118 238 C 152 226, 194 228, 224 242" stroke="#C9974E" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M 118 268 C 152 256, 194 258, 224 272" stroke="#C9974E" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M 118 298 C 152 286, 194 288, 224 302" stroke="#C9974E" stroke-width="7" stroke-linecap="round" fill="none"/>

    <!-- Right Open Page (Main Silhouette) -->
    <path d="M 260 168 
             C 298 144, 374 142, 424 162 
             C 429 164, 432 168, 432 174
             L 432 334 
             C 432 340, 427 344, 422 342 
             C 374 324, 298 326, 260 348 
             Z" 
          fill="url(#goldGradRight)"/>

    <!-- Right Page Engraved Woodcut Inner Cutout -->
    <path d="M 268 182 
             C 302 162, 368 160, 414 178
             L 414 322
             C 368 306, 302 308, 268 328
             Z" 
          fill="#1C1712"/>

    <!-- Right Page Woodcut Ruled Lines -->
    <path d="M 288 212 C 318 198, 360 196, 394 208" stroke="#C9974E" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M 288 242 C 318 228, 360 226, 394 238" stroke="#C9974E" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M 288 272 C 318 258, 360 256, 394 268" stroke="#C9974E" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M 288 302 C 318 288, 360 286, 394 298" stroke="#C9974E" stroke-width="7" stroke-linecap="round" fill="none"/>

    <!-- Center Binding Crease -->
    <path d="M 252 164 L 260 164 L 260 360 L 252 360 Z" fill="#C9974E"/>
    
    <!-- Burnt Sienna Spine Accent Line -->
    <path d="M 254 162 L 258 162 L 258 372 L 254 372 Z" fill="#7A3B2E"/>

    <!-- Burnt Sienna Ribbon Bookmark Hanging from Bottom of Codex -->
    <path d="M 253 350 L 259 350 L 262 422 L 256 414 L 250 422 Z" fill="#7A3B2E"/>
  </g>
</svg>`;
}

// Favicon SVG (simplified high-contrast version for 32x32 / 16x16)
function createFaviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <!-- Solid background -->
  <rect width="32" height="32" rx="6" fill="#1C1712"/>
  
  <!-- Book Cover Base (Burnt Sienna) -->
  <path d="M 4 22.5 Q 10 24.5 15 23.5 L 16 24 L 17 23.5 Q 22 24.5 28 22.5 L 28 24 Q 22 26 16 25.5 Q 10 26 4 24 Z" fill="#7A3B2E"/>

  <!-- Left Page (Solid Antique Gold) -->
  <path d="M 15 10 
           C 12.2 8.2, 7.8 8.2, 4.8 9.6 
           C 4.3 9.8, 4 10.2, 4 10.8 
           L 4 21 
           C 4 21.6, 4.5 22, 5.1 21.8 
           C 8 20.6, 12.2 20.8, 15 22.2 
           Z" 
        fill="#C9974E"/>
        
  <!-- Left Page Cutout to create the open page look -->
  <path d="M 14 11.5 C 11.8 10, 8.2 10.2, 5.8 11.2 L 5.8 20 C 8.2 19.2, 11.8 19, 14 20.5 Z" fill="#1C1712"/>
  <!-- Single manuscript horizontal bar -->
  <line x1="7.5" y1="15.5" x2="12.5" y2="15.5" stroke="#C9974E" stroke-width="1.8" stroke-linecap="round"/>

  <!-- Right Page (Solid Antique Gold) -->
  <path d="M 17 10 
           C 19.8 8.2, 24.2 8.2, 27.2 9.6 
           C 27.7 9.8, 28 10.2, 28 10.8 
           L 28 21 
           C 28 21.6, 27.5 22, 26.9 21.8 
           C 24 20.6, 19.8 20.8, 17 22.2 
           Z" 
        fill="#C9974E"/>
        
  <!-- Right Page Cutout -->
  <path d="M 18 11.5 C 20.2 10, 23.8 10.2, 26.2 11.2 L 26.2 20 C 23.8 19.2, 20.2 19, 18 20.5 Z" fill="#1C1712"/>
  <!-- Single manuscript horizontal bar -->
  <line x1="19.5" y1="15.5" x2="24.5" y2="15.5" stroke="#C9974E" stroke-width="1.8" stroke-linecap="round"/>

  <!-- Center Crease & Ribbon Bookmark -->
  <rect x="15.2" y="9.5" width="1.6" height="13.5" fill="#7A3B2E"/>
  <polygon points="15.2,23 16.8,23 16.8,26.5 16,25.7 15.2,26.5" fill="#7A3B2E"/>
</svg>`;
}

async function buildAll() {
  const iconsDir = path.resolve(__dirname, '../public/icons');
  const publicDir = path.resolve(__dirname, '../public');

  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Save master SVG files for reference
  fs.writeFileSync(path.join(iconsDir, 'icon-master.svg'), createIconSvg(false));
  fs.writeFileSync(path.join(iconsDir, 'icon-maskable-master.svg'), createIconSvg(true));
  fs.writeFileSync(path.join(iconsDir, 'favicon-master.svg'), createFaviconSvg());

  console.log('Generating PNG icons...');

  // 1. icon-512.png (512x512)
  await sharp(Buffer.from(createIconSvg(false)))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-512.png'));
  console.log('✓ icon-512.png (512x512)');

  // 2. icon-192.png (192x192)
  await sharp(Buffer.from(createIconSvg(false)))
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-192.png'));
  console.log('✓ icon-192.png (192x192)');

  // 3. icon-maskable-512.png (512x512 with safe zone scaling)
  await sharp(Buffer.from(createIconSvg(true)))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-maskable-512.png'));
  console.log('✓ icon-maskable-512.png (512x512 maskable)');

  // 4. icon-maskable-192.png (192x192 with safe zone scaling)
  await sharp(Buffer.from(createIconSvg(true)))
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-maskable-192.png'));
  console.log('✓ icon-maskable-192.png (192x192 maskable)');

  // 5. apple-touch-icon.png (180x180)
  await sharp(Buffer.from(createIconSvg(false)))
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png (180x180)');

  // 6. favicon-32.png (32x32 from optimized favicon SVG)
  await sharp(Buffer.from(createFaviconSvg()))
    .resize(32, 32)
    .png()
    .toFile(path.join(iconsDir, 'favicon-32.png'));
  console.log('✓ favicon-32.png (32x32)');

  // 7. Also create a 16x16 PNG and convert/save favicon.ico in public/
  // A standard ICO file header containing 32x32 PNG data
  const favicon32Buf = await sharp(Buffer.from(createFaviconSvg()))
    .resize(32, 32)
    .png()
    .toBuffer();

  // Create valid .ico file containing the 32x32 PNG image
  // ICO header: 6 bytes (Reserved=0, Type=1 for icon, Count=1)
  // Directory entry: 16 bytes (Width=32, Height=32, Colors=0, Reserved=0, Planes=1, BPP=32, Size, Offset=22)
  const icoHeader = Buffer.alloc(22);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // Type 1 = ICO
  icoHeader.writeUInt16LE(1, 4); // 1 image
  icoHeader.writeUInt8(32, 6);   // Width 32
  icoHeader.writeUInt8(32, 7);   // Height 32
  icoHeader.writeUInt8(0, 8);    // Color count (0 = >=8bpp)
  icoHeader.writeUInt8(0, 9);    // Reserved
  icoHeader.writeUInt16LE(1, 10); // Color planes
  icoHeader.writeUInt16LE(32, 12); // Bits per pixel
  icoHeader.writeUInt32LE(favicon32Buf.length, 14); // Image size in bytes
  icoHeader.writeUInt32LE(22, 18); // Offset to image data

  const icoFile = Buffer.concat([icoHeader, favicon32Buf]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoFile);
  console.log('✓ favicon.ico (32x32 embedded in public/)');
}

buildAll().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
