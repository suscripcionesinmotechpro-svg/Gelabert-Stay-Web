import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

export const Cookies = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-32 pb-20 px-6 md:px-20 font-primary">
      <Helmet>
        <title>{t('legal.cookies.seo_title')}</title>
      </Helmet>
      
      <div className="max-w-4xl mx-auto space-y-12">
        <h1 className="font-secondary text-5xl text-[#C9A962] border-b border-[#1F1F1F] pb-8 text-center italic">
          {t('legal.cookies.title')}
        </h1>
        
        <section className="space-y-8 text-[#888888] leading-relaxed">
          <div className="bg-[#161616] p-8 border border-[#1F1F1F] rounded-sm">
            <h2 className="text-[#FAF8F5] text-xl font-bold mb-4 uppercase tracking-widest">
              {t('legal.cookies.section1.title')}
            </h2>
            <p>{t('legal.cookies.section1.content')}</p>
          </div>

          <div>
            <h2 className="text-[#FAF8F5] text-xl font-bold mb-4 uppercase tracking-widest">
              {t('legal.cookies.section2.title')}
            </h2>
            <p>{t('legal.cookies.section2.content')}</p>
            <ul className="mt-4 space-y-4">
              <li>
                <strong className="text-[#FAF8F5]">{t('legal.cookies.section2.types.technical.title')}</strong> {t('legal.cookies.section2.types.technical.content')}
              </li>
              <li>
                <strong className="text-[#FAF8F5]">{t('legal.cookies.section2.types.analysis.title')}</strong> {t('legal.cookies.section2.types.analysis.content')}
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-[#FAF8F5] text-xl font-bold mb-4 uppercase tracking-widest">
              {t('legal.cookies.section3.title')}
            </h2>
            <p>{t('legal.cookies.section3.content')}</p>
            <ul className="mt-4 space-y-2 list-disc list-inside">
              {(t('legal.cookies.section3.browsers', { returnObjects: true }) as string[]).map((browser, index) => (
                <li key={index}>{browser}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};
