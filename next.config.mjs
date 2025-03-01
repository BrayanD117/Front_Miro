/** @type {import('next').NextConfig} */
import dotenv from 'dotenv';

dotenv.config();
const nextConfig = {
  basePath: process.env.APP_ENV==='development' ? '/dev' : '',
};

export default nextConfig;
