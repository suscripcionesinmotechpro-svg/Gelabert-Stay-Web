import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

export const Privacidad = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-32 pb-20 px-6 md:px-20 font-primary">
      <Helmet>
        <title>{t('legal.privacy.seo_title')}</title>
      </Helmet>
      
      <div className="max-w-4xl mx-auto space-y-12">
        <h1 className="font-secondary text-5xl text-[#C9A962] border-b border-[#1F1F1F] pb-8 text-center italic">
          {t('legal.privacy.title')}
        </h1>
        
        <section className="space-y-8 text-[#888888] leading-relaxed">
          <div className="bg-[#161616] p-8 border border-[#1F1F1F] rounded-sm">
            <h2 className="text-[#FAF8F5] text-xl font-bold mb-4 uppercase tracking-widest">
              {t('legal.privacy.section1.title')}
            </h2>
            <p>{t('legal.privacy.section1.content')}</p>
            <p className="mt-2">
              <strong className="text-[#C9A962]">{t('legal.privacy.section1.responsible')}</strong> GELABERT HOMES REAL ESTATE<br />
              <strong className="text-[#C9A962]">{t('legal.privacy.section1.purpose')}</strong> {t('legal.privacy.section1.purpose_val')}
            </p>
          </div>

          <div>
            <h2 className="text-[#FAF8F5] text-xl font-bold mb-4 uppercase tracking-widest">
              {t('legal.privacy.section2.title')}
            </h2>
            <p>{t('legal.privacy.section2.content')}</p>
          </div>

          <div>
            <h2 className="text-[#FAF8F5] text-xl font-bold mb-4 uppercase tracking-widest">
              {t('legal.privacy.section3.title')}
            </h2>
            <p>{t('legal.privacy.section3.content')}</p>
            <ul className="mt-4 space-y-2 list-disc list-inside">
              {(t('legal.privacy.section3.rights', { returnObjects: true }) as string[]).map((right, index) => (
                <li key={index}>{right}</li>
              ))}
            </ul>
            <p className="mt-4">
              {t('legal.privacy.section3.exercise')}
            </p>
          </div>

          <div>
            <h2 className="text-[#FAF8F5] text-xl font-bold mb-4 uppercase tracking-widest">
              {t('legal.privacy.section4.title')}
            </h2>
            <p>{t('legal.privacy.section4.content')}</p>
          </div>
        </section>
      </div>
    </div>
  );
};
