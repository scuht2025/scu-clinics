#!/usr/bin/env node

/**
 * Release script to bump version and create a git tag
 * Usage: node scripts/release.js [patch|minor|major]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const versionType = process.argv[2] || 'patch';

if (!['patch', 'minor', 'major'].includes(versionType)) {
  console.error('❌ Invalid version type. Use: patch, minor, or major');
  process.exit(1);
}

try {
  // Read current version
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const oldVersion = packageJson.version;

  console.log(`📦 Current version: ${oldVersion}`);
  console.log(`🔄 Bumping ${versionType} version...`);

  // Bump version in package.json
  execSync(`npm version ${versionType} --no-git-tag-version`, { stdio: 'inherit' });

  // Read new version
  const updatedPackageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const newVersion = updatedPackageJson.version;

  console.log(`✅ New version: ${newVersion}`);
  console.log(`📝 Committing changes...`);

  // Commit the version change
  execSync('git add package.json package-lock.json', { stdio: 'inherit' });
  execSync(`git commit -m "chore: bump version to ${newVersion}"`, { stdio: 'inherit' });

  console.log(`🏷️  Creating tag v${newVersion}...`);

  // Create git tag
  execSync(`git tag v${newVersion}`, { stdio: 'inherit' });

  console.log(`\n✨ Success! Version bumped to ${newVersion}`);
  console.log(`\n📤 To trigger the build and release, run:`);
  console.log(`   git push origin main --tags`);
  console.log(`\n⏳ GitHub Actions will then:`);
  console.log(`   1. Build the app on GitHub's servers`);
  console.log(`   2. Create a release with the installer`);
  console.log(`   3. Users will get auto-updates`);

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
