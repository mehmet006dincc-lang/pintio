const appJson = require('./app.json');

const appExtra = appJson.expo.extra ?? {};
const easExtra = appExtra.eas ?? {};
const EAS_PROJECT_ID =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
  easExtra.projectId ??
  '12b6d97b-a51b-41f6-b9ef-b4af8745b956';

/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...appJson.expo,
  ...config,
  extra: {
    ...appExtra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? appExtra.apiUrl ?? 'http://localhost:3000',
    eas: {
      ...easExtra,
      projectId: EAS_PROJECT_ID,
    },
  },
});
