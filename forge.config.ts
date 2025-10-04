import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { PublisherGithub } from '@electron-forge/publisher-github';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    prune: true,
    // App icon configuration
    // Use .ico for Windows to ensure the installed app uses the correct icon
    icon: 'assets/logo.ico',
    // Ensure CSV asset is available in production builds under resources/
    // electron-packager option name is extraResource (singular)
    extraResource: [
      'src/database/meds_1.csv',
      'src/database/procedure-codes.csv',
      // Include the app icon so we can reference it at runtime if needed
      'assets/logo.ico',
      // Include app-update.yml for electron-updater
      'app-update.yml',
    ],
  },
  rebuildConfig: {
    // Rebuild native modules for the target Electron version
    onlyModules: ['better-sqlite3'],
  },
  makers: [
    new MakerSquirrel({
      // Windows installer icon (for Setup.exe UI and file icon)
      setupIcon: 'assets/logo.ico',
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({
      // Linux RPM with custom icon
      options: {
        icon: 'assets/icon-512.png',
      },
    }),
    new MakerDeb({
      // Linux DEB with custom icon
      options: {
        icon: 'assets/icon-512.png',
      },
    }),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: 'scuht2025',
        name: 'scu-clinics',
      },
      draft: false,
      prerelease: false,
    }),
  ],
};

export default config;
