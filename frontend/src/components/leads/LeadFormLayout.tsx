import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

interface LeadFormLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  badge: string;
  backgroundImage?: string;
}

const LeadFormLayout: React.FC<LeadFormLayoutProps> = ({
  children,
  title,
  description,
  badge,
  backgroundImage = "https://images.unsplash.com/photo-1600585154340-be6199f3e209?auto=format&fit=crop&q=80"
}) => {
  return (
    <div className="min-h-screen relative pt-24 pb-12 overflow-x-hidden flex flex-col items-center">
      <Helmet>
        <title>{title} | Gelabert Homes</title>
        <meta name="description" content={description} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content="https://gelaberthomes.es/logo-og.png?v=2" />
        <meta property="og:image:alt" content="Gelabert Homes Real Estate" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content="https://gelaberthomes.es/logo-og.png?v=2" />
      </Helmet>

      {/* Background with overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      </div>

      <div className="container relative z-10 max-w-4xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 flex flex-col items-center"
        >
          <Link to="/">
            <img 
              src="/logo-hd-perfect.png" 
              alt="Gelabert Homes" 
              className="h-20 md:h-24 w-auto object-contain mb-8 hover:opacity-80 transition-opacity"
            />
          </Link>
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-semibold tracking-wider uppercase mb-4 backdrop-blur-md border border-accent/30">
            {badge}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {title}
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-12 border border-white/20 shadow-2xl"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default LeadFormLayout;
