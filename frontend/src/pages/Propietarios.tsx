import { PropertyContactForm } from '../components/PropertyContactForm';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

export const Propietarios = () => {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full min-h-[90vh] bg-[#0F0F0F] p-6 md:p-20 relative overflow-hidden">
      <Helmet>
        <title>{t('owners_page.seo.title')}</title>
        <meta name="description" content={t('owners_page.seo.description')} />
        <meta property="og:title" content={t('owners_page.seo.og_title')} />
        <link rel="alternate" hrefLang="es" href="https://gelaberthomes.es/propietarios/" />
        <link rel="alternate" hrefLang="en" href="https://gelaberthomes.es/en/propietarios/" />
        <link rel="alternate" hrefLang="x-default" href="https://gelaberthomes.es/propietarios/" />
      </Helmet>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-[#C9A962]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10 items-center">
        <div className="flex flex-col items-start text-left gap-8">
          <span className="font-primary text-[#C9A962] text-sm uppercase tracking-[0.3em] font-bold">
            {t('owners_page.hero.badge')}
          </span>
          <h1 className="font-secondary text-5xl md:text-7xl text-[#FAF8F5] leading-tight">
            {t('owners_page.hero.title')}
          </h1>
          <p className="font-primary text-xl text-[#888888] font-light leading-relaxed max-w-xl">
            {t('owners_page.hero.description')}
          </p>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 text-[#FAF8F5]">
              <div className="w-8 h-[1px] bg-[#C9A962]"></div>
              <span className="font-primary text-sm uppercase tracking-widest">
                {t('owners_page.hero.features.valuation')}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[#FAF8F5]">
              <div className="w-8 h-[1px] bg-[#C9A962]"></div>
              <span className="font-primary text-sm uppercase tracking-widest">
                {t('owners_page.hero.features.promotion')}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[#FAF8F5]">
              <div className="w-8 h-[1px] bg-[#C9A962]"></div>
              <span className="font-primary text-sm uppercase tracking-widest">
                {t('owners_page.hero.features.legal')}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <WhatsAppButton 
              phoneNumber="34611898827" 
              message={t('owners_page.hero.whatsapp_message')}
              label={t('owners_page.hero.whatsapp_label')}
            />
          </div>
        </div>

        <div className="w-full">
          <PropertyContactForm />
        </div>
      </div>
    </div>
  )
}
