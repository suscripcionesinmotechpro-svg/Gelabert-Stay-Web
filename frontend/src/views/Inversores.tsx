"use client";

import { motion } from 'framer-motion';
import { InvestorServices } from '../components/InvestorServices';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const Inversores = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#121212]">
      <Helmet>
        <title>Gelabert Homes | {t('nav.investors')}</title>
        <meta name="description" content={t('investors_page.seo.description')} />
      </Helmet>

      {/* Page Hero - Simple and elegant */}
      <section className="relative w-full pt-32 pb-16 px-6 md:px-14 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 max-w-3xl"
        >
          <span className="font-primary text-[#C9A962] text-sm uppercase tracking-[0.3em] font-bold">
            {t('nav.investors')}
          </span>
          <h1 className="font-secondary text-5xl md:text-7xl text-[#FAF8F5] leading-[0.9]">
            {t('investors_page.hero.title_1')}<span className="text-[#C9A962] italic">{t('investors_page.hero.title_highlight')}</span>
          </h1>
        </motion.div>
      </section>

      {/* Main Component */}
      <InvestorServices />

      {/* Additional value proposition or contact focus could go here */}
    </div>
  );
};

export default Inversores;
