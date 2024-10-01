/** @type {import('next').NextConfig} */
import dotenv from 'dotenv';

console.log('NODE_ENV', process.env.NODE_ENV);

dotenv.config();
const nextConfig = {
  basePath: process.env.NODE_ENV==='production' ? '' : '/dev',
};

export default nextConfig;
