/**
 * Environment utilities for determining development vs production
 */

import { app } from 'electron';

export const isDev = (): boolean => {
  return process.env.NODE_ENV === 'development' || !app.isPackaged;
};

export const isProduction = (): boolean => {
  return !isDev();
};

export const getAppVersion = (): string => {
  return app.getVersion();
};

export const getAppName = (): string => {
  return app.getName();
};
