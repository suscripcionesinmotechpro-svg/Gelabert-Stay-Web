import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Footer = () => {
  const { t, i18n } = useTranslation();
  const langPrefix = i18n.language.startsWith('en') ? '/en' : '';
  return (
    <footer className="w-full bg-[#0A0A0A] border-t border-[#1F1F1F] py-16 px-6 md:px-14 flex flex-col md:flex-row justify-between gap-12 mt-auto">
      <div className="flex flex-col gap-6 max-w-sm">
        <img
          src="/logo.png"
          alt="Gelabert Homes Real Estate"
          className="h-28 w-auto object-contain self-start"
        />
        <p className="font-primary text-sm text-[#888888] leading-relaxed">
          {t('footer.description')}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <h4 className="font-primary text-[15px] font-bold text-[#FAF8F5]">{t('footer.services')}</h4>
        <Link to={`${langPrefix}/propiedades?operation=alquiler`} className="font-primary text-sm text-[#888888] hover:text-[#C9A962] transition-colors">{t('footer.rent')}</Link>
        <Link to={`${langPrefix}/propiedades?operation=venta`} className="font-primary text-sm text-[#888888] hover:text-[#C9A962] transition-colors">{t('footer.sale')}</Link>
        <Link to={`${langPrefix}/propiedades?operation=traspaso`} className="font-primary text-sm text-[#888888] hover:text-[#C9A962] transition-colors">{t('footer.transfers')}</Link>
        <Link to={`${langPrefix}/servicios`} className="font-primary text-sm text-[#888888] hover:text-[#C9A962] transition-colors">{t('footer.all_services')}</Link>
      </div>

      <div className="flex flex-col gap-4">
        <h4 className="font-primary text-[15px] font-bold text-[#FAF8F5]">{t('footer.contact')}</h4>
        <p className="font-primary text-sm text-[#888888]">{t('footer.location')}</p>
        <p className="font-primary text-sm text-[#C9A962] font-semibold">{t('footer.online_estate')}</p>
        <p className="font-primary text-sm text-[#888888]">+34 611 89 88 27</p>
        <p className="font-primary text-sm text-[#888888]">info@gelaberthomes.es</p>
      </div>

      <div className="flex flex-col gap-4">
        <h4 className="font-primary text-[15px] font-bold text-[#FAF8F5]">{t('footer.legal')}</h4>
        <Link to={`${langPrefix}/aviso-legal`} className="font-primary text-sm text-[#888888] hover:text-[#C9A962] transition-colors">{t('footer.legal_notice')}</Link>
        <Link to={`${langPrefix}/privacidad`} className="font-primary text-sm text-[#888888] hover:text-[#C9A962] transition-colors">{t('footer.privacy_policy')}</Link>
        <Link to={`${langPrefix}/cookies`} className="font-primary text-sm text-[#888888] hover:text-[#C9A962] transition-colors">{t('footer.cookies_policy')}</Link>
      </div>
    </footer>
  );
};
