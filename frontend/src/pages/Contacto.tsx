import { GeneralContactForm } from '../components/GeneralContactForm';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

export const Contacto = () => {
  const { t } = useTranslation();

  return (
    <div className="w-full flex-1 flex flex-col md:flex-row bg-[#0A0A0A]">
      <Helmet>
        <title>{t('contact_page.seo.title')}</title>
        <meta name="description" content={t('contact_page.seo.description')} />
      </Helmet>
      <div className="flex-1 p-6 md:p-14 lg:p-24 flex flex-col justify-center">
        <span className="font-primary text-[#C9A962] text-sm uppercase tracking-widest font-bold mb-4">
          {t('contact_page.hero.badge')}
        </span>
        <h1 className="font-secondary text-5xl md:text-6xl text-[#FAF8F5] mb-8">
          {t('contact_page.hero.title')}
        </h1>
        <p className="font-primary text-lg text-[#888888] font-light max-w-lg mb-12">
          {t('contact_page.hero.description')}
        </p>

        <div className="flex flex-col gap-8 font-primary text-[#FAF8F5]">
          <div>
            <span className="block text-[#666666] text-sm mb-1 uppercase">{t('contact_page.hero.email')}</span>
            <a href="mailto:info@gelabertstay.es" className="text-xl hover:text-[#C9A962] transition-colors">info@gelabertstay.es</a>
          </div>
          <div>
            <span className="block text-[#666666] text-sm mb-1 uppercase">{t('contact_page.hero.phone')}</span>
            <a href="tel:+34611898827" className="text-xl hover:text-[#C9A962] transition-colors block mb-4">+34 611 89 88 27</a>
            
            <WhatsAppButton 
              phoneNumber="34611898827" 
              message={t('contact_page.hero.whatsapp_message')}
              label={t('contact_page.hero.whatsapp_label')}
            />
          </div>
        </div>
      </div>
      
      {/* Visual / Form area */}
      <div className="flex-1 min-h-[500px] md:min-h-full">
        <GeneralContactForm />
      </div>
    </div>
  )
}
