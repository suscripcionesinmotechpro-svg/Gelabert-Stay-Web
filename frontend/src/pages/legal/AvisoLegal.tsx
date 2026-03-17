import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

export const AvisoLegal = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-32 pb-20 px-6 md:px-20 font-primary">
      <Helmet>
        <title>{t('legal.notice.seo_title')}</title>
      </Helmet>
      
      <div className="max-w-4xl mx-auto space-y-12">
        <h1 className="font-secondary text-5xl text-[#C9A962] border-b border-[#1F1F1F] pb-8 text-center italic">
          {t('legal.notice.title')}
        </h1>
        
        <section className="space-y-6 text-[#888888] leading-relaxed">
          <div className="bg-[#161616] p-8 border border-[#1F1F1F] rounded-sm">
            <h2 className="text-[#FAF8F5] text-xl font-bold mb-4 uppercase tracking-widest">
              {t('legal.notice.section1.title')}
            </h2>
            <p>{t('legal.notice.section1.content')}</p>
            <ul className="mt-4 space-y-2 list-disc list-inside">
              <li><strong className="text-[#C9A962]">{t('legal.notice.section1.owner')}</strong> GELABERT HOMES REAL ESTATE</li>
              <li><strong className="text-[#C9A962]">{t('legal.notice.section1.address')}</strong> {t('legal.notice.section1.address_val')}</li>
              <li><strong className="text-[#C9A962]">{t('legal.notice.section1.email')}</strong> info@gelaberthomes.es</li>
              <li><strong className="text-[#C9A962]">{t('legal.notice.section1.phone')}</strong> +34 611 89 88 27</li>
            </ul>
          </div>

          <div>
            <h2 className="text-[#FAF8F5] text-xl font-bold mb-4 uppercase tracking-widest">
              {t('legal.notice.section2.title')}
            </h2>
            <p>{t('legal.notice.section2.content')}</p>
          </div>

          <div>
            <h2 className="text-[#FAF8F5] text-xl font-bold mb-4 uppercase tracking-widest">
              {t('legal.notice.section3.title')}
            </h2>
            <p>{t('legal.notice.section3.content')}</p>
          </div>
          
          <div>
            <h2 className="text-[#FAF8F5] text-xl font-bold mb-4 uppercase tracking-widest">
              {t('legal.notice.section4.title')}
            </h2>
            <p>{t('legal.notice.section4.content')}</p>
          </div>
        </section>
      </div>
    </div>
  );
};
