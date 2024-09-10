const { exec } = require('child_process');

require('dotenv').config();

module.exports = {
    apps: [
      {
        name: 'Front_Miro',
        script: 'npm',
        instances: 'max',
        exec_mode: 'cluster',
        args: 'start',
        env: {
          NODE_ENV: 'production',
          NEXTAUTH_URL: process.env.NEXTAUTH_URL,
          NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
          NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
          GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
          GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
          NODE_TLS_REJECT_UNAUTHORIZED: process.env.NODE_TLS_REJECT_UNAUTHORIZED,
        },
      },
    ],
  };
  