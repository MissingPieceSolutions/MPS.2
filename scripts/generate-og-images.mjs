/**
 * Generate OG images (1200x630) for each page.
 * Brand aesthetic: dark background, accent purple, page title text.
 * Run: node scripts/generate-og-images.mjs
 */
import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'og');
mkdirSync(outDir, { recursive: true });

const WIDTH = 1200;
const HEIGHT = 630;

// Brand colors
const BG = '#0a0a0f';
const SURFACE = '#131320';
const ACCENT = '#8b5cf6';
const ACCENT_DIM = 'rgba(139, 92, 246, 0.15)';
const TEXT_PRIMARY = '#f0f0f5';
const TEXT_MUTED = '#9ca3af';

const pages = [
  { file: 'home.png', title: 'Build AI That Delivers', subtitle: 'Missing Piece Solutions' },
  { file: 'services.png', title: 'Our Services', subtitle: 'AI Workflow Automation | Custom AI Development | Strategy' },
  { file: 'portfolio.png', title: 'Portfolio', subtitle: 'Real projects. Measurable outcomes.' },
  { file: 'about.png', title: 'About Us', subtitle: 'The team behind Missing Piece Solutions' },
  { file: 'contact.png', title: 'Get in Touch', subtitle: 'Start a conversation about your next project' },
  { file: 'privacy.png', title: 'Privacy Policy', subtitle: 'How we handle your data' },
  { file: 'default.png', title: 'Missing Piece Solutions', subtitle: 'AI agency building systems that deliver' },
];

function drawOgImage(page) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Subtle gradient overlay from bottom-left
  const grad = ctx.createRadialGradient(200, HEIGHT, 50, 200, HEIGHT, 500);
  grad.addColorStop(0, ACCENT_DIM);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Second gradient from top-right
  const grad2 = ctx.createRadialGradient(WIDTH - 200, 100, 30, WIDTH - 200, 100, 400);
  grad2.addColorStop(0, 'rgba(139, 92, 246, 0.08)');
  grad2.addColorStop(1, 'transparent');
  ctx.fillStyle = grad2;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Energy ring (simplified circle)
  ctx.beginPath();
  ctx.arc(WIDTH - 250, HEIGHT / 2, 180, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.12)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner ring
  ctx.beginPath();
  ctx.arc(WIDTH - 250, HEIGHT / 2, 140, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.08)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Accent bar on the left
  ctx.fillStyle = ACCENT;
  ctx.fillRect(80, 200, 4, 120);

  // Title text
  ctx.fillStyle = TEXT_PRIMARY;
  ctx.font = 'bold 56px sans-serif';
  ctx.textBaseline = 'middle';

  // Word-wrap title if needed
  const maxWidth = 750;
  const words = page.title.split(' ');
  let lines = [];
  let currentLine = '';
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);

  const lineHeight = 68;
  const titleStartY = lines.length > 1 ? 240 : 270;

  lines.forEach((line, i) => {
    ctx.fillText(line, 110, titleStartY + i * lineHeight);
  });

  // Subtitle
  ctx.fillStyle = TEXT_MUTED;
  ctx.font = '24px sans-serif';
  const subtitleY = titleStartY + lines.length * lineHeight + 20;
  ctx.fillText(page.subtitle, 110, subtitleY);

  // Bottom bar with brand name
  ctx.fillStyle = SURFACE;
  ctx.fillRect(0, HEIGHT - 60, WIDTH, 60);
  ctx.fillStyle = TEXT_MUTED;
  ctx.font = '16px sans-serif';
  ctx.fillText('mps-2.pages.dev', 80, HEIGHT - 25);

  // Accent dot next to URL
  ctx.beginPath();
  ctx.arc(68, HEIGHT - 28, 4, 0, Math.PI * 2);
  ctx.fillStyle = ACCENT;
  ctx.fill();

  // Top border accent line
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, 0, WIDTH, 3);

  return canvas.toBuffer('image/png');
}

for (const page of pages) {
  const buf = drawOgImage(page);
  const outPath = join(outDir, page.file);
  writeFileSync(outPath, buf);
  console.log(`Created: ${outPath} (${buf.length} bytes)`);
}

console.log(`\nDone! Generated ${pages.length} OG images.`);
