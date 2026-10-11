/**
 * Pre-build: rename Cinny / Prinny / Bestie → SIMP.Chat across the entire project.
 *
 * Runs as beforeBuildCommand. Modifies source in-place so the Tauri build
 * compiles with "SIMP.Chat" branding. Also renames Android package directory.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, renameSync, unlinkSync } from 'node:fs';
import { join, extname, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT_PATH = fileURLToPath(import.meta.url);

const TEXT_EXTS = new Set([
  '.rs', '.toml', '.json', '.json5',
  '.ts', '.tsx', '.js', '.jsx', '.mjs',
  '.html', '.css', '.svg', '.xml',
  '.kt', '.kts', '.gradle', '.properties',
  '.md',
]);

const SKIP_DIRS = new Set([
  'node_modules', 'target', '.git', 'dist',
  'build',    // Android build intermediates
  'icons',    // icon files
  'scripts',  // don't self-rename
]);

const SKIP_FILES = new Set([
  'accountData.ts', // Matrix protocol constant
  'About.tsx',      // Handled cleanly by patch-all-translations
]);

// ── Phase 0: rename Android package directory ──────────────────────

function renameAndroidPackageDir() {
  const javaRoot = join(ROOT, 'src-tauri', 'gen', 'android', 'app', 'src', 'main', 'java', 'in');
  const oldDirCinny = join(javaRoot, 'cinny');
  const oldDirPrinny = join(javaRoot, 'prinny');
  const oldDirBestie = join(javaRoot, 'bestie');
  const newDir = join(javaRoot, 'simp');
  
  if (existsSync(oldDirBestie) && !existsSync(newDir)) {
    renameSync(oldDirBestie, newDir);
    console.log(`  [dir] in/bestie → in/simp`);
  } else if (existsSync(oldDirCinny) && !existsSync(newDir)) {
    renameSync(oldDirCinny, newDir);
    console.log(`  [dir] in/cinny → in/simp`);
  } else if (existsSync(oldDirPrinny) && !existsSync(newDir)) {
    renameSync(oldDirPrinny, newDir);
    console.log(`  [dir] in/prinny → in/simp`);
  }
  
  // Remove stale assets tauri.conf.json so it's regenerated fresh
  const staleAssets = join(ROOT, 'src-tauri', 'gen', 'android', 'app', 'src', 'main', 'assets', 'tauri.conf.json');
  if (existsSync(staleAssets)) {
    unlinkSync(staleAssets);
    console.log(`  [del] stale assets/tauri.conf.json`);
  }
}

// ── Phase 1: file content replacements ─────────────────────────────

function replaceInFile(filePath) {
  if (filePath === SCRIPT_PATH) return false;
  try {
    let content = readFileSync(filePath, 'utf8');
    let original = content;

    // Repo URLs
    content = content.replace(
      /(coffeegrind123\/cinny-desktop|coffeegrind123\/prinny-client|cristianapas\/prinny-client|cristianapas\/Bestie)/g,
      'cristianapas/SIMP.Chat'
    );

    // Android notification channel IDs
    content = content.replace(/\b(cinny|prinny|bestie)_foreground\b/g, 'simpchat_foreground');
    content = content.replace(/\b(cinny|prinny|bestie)_messages\b/g, 'simpchat_messages');

    // Android theme
    content = content.replace(/Theme\.(cinny|prinny|bestie)\b/g, 'Theme.simpchat');

    // Kotlin APK filename
    content = content.replace(/"(cinny|prinny|bestie)-v\$/g, '"simp-chat-v$');

    // SVGs
    content = content.replace(/bestie\.svg/g, 'simp.svg');
    content = content.replace(/bestie-unread\.svg/g, 'simp-unread.svg');
    content = content.replace(/bestie-highlight\.svg/g, 'simp-highlight.svg');

    // Tauri config
    content = content.replace(/"productName"\s*:\s*"(Cinny|Prinny|Bestie)"/g, '"productName": "SIMP.Chat"');
    content = content.replace(/"mainBinaryName"\s*:\s*"(cinny|prinny|bestie)"/g, '"mainBinaryName": "simp-chat"');

    // General case-sensitive replacements
    content = content.replace(/\bBestie\b/g, 'SIMP.Chat');
    content = content.replace(/\bBESTIE\b/g, 'SIMP.CHAT');
    content = content.replace(/\bPrinny\b/g, 'SIMP.Chat');
    content = content.replace(/\bPRINNY\b/g, 'SIMP.CHAT');
    content = content.replace(/\bCinny\b/g, 'SIMP.Chat');
    content = content.replace(/\bCINNY\b/g, 'SIMP.CHAT');

    if (content !== original) {
      writeFileSync(filePath, content, 'utf8');
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ── Walk ────────────────────────────────────────────────────────────

function walk(dir) {
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.gitmodules') continue;
    if (SKIP_DIRS.has(entry.name)) continue;

    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      count += walk(path);
    } else if (entry.isFile()) {
      if (SKIP_FILES.has(entry.name)) continue;
      if (TEXT_EXTS.has(extname(entry.name).toLowerCase())) {
        if (replaceInFile(path)) {
          console.log(`  ${relative(ROOT, path)}`);
          count++;
        }
      }
    }
  }
  return count;
}

// ── Main ────────────────────────────────────────────────────────────

console.log('[simp] Renaming to SIMP.Chat...');
renameAndroidPackageDir();
const changed = walk(ROOT);
console.log(`[simp] Done — ${changed} files changed.`);
