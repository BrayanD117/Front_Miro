/** @type {import('next').NextConfig} */
import dotenv from 'dotenv';

dotenv.config();
const nextConfig = {
  basePath: process.env.NODE_ENV==='production' ? '' : '/dev',
};

export default nextConfig;
