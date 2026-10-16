#!/usr/bin/env node
// Fails when the version constants the plugin reports (web, Android, iOS)
// do not match package.json. release-please bumps all four together through
// the `x-release-please-version` markers; this catches a hand edit that
// missed one.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const expected = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;

const files = [
  'src/version.ts',
  'android/src/main/kotlin/com/jongbonga/capacitor/appodeal/Version.kt',
  'ios/Sources/AppodealPlugin/Version.swift',
];

let ok = true;
for (const file of files) {
  const line = readFileSync(join(root, file), 'utf8')
    .split('\n')
    .find((l) => l.includes('x-release-please-version'));
  const found = line?.match(/["']([^"']+)["']/)?.[1];
  if (found !== expected) {
    console.error(`${file}: version is ${found ?? 'missing'}, package.json says ${expected}`);
    ok = false;
  }
}

process.exit(ok ? 0 : 1);
