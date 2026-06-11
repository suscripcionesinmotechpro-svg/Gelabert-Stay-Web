import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://aumqjpqngmhpbwytpets.supabase.co',
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bXFqcHFuZ21ocGJ3eXRwZXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODgyNjMsImV4cCI6MjA4ODc2NDI2M30.OHi4bRiyFUv2lBHu3wb1IKchj2qF6rZ354uhCQeeAlU',
    VITE_GOOGLE_MAPS_API_KEY: process.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDFHHIhz6Xh-ZdFahhh-MzUoup7d25vbX0',
  },
  images: {
    loader: 'custom',
    loaderFile: './src/utils/supabaseImageLoader.ts',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.resolve.alias['react-helmet-async'] = path.resolve(__dirname, './src/components/HelmetShim.tsx');
    config.resolve.alias['react-router-dom$'] = path.resolve(__dirname, './src/components/ReactRouterDomShim.tsx');
    return config;
  },
};

export default nextConfig;
