import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const FilterBar = () => {
  const { t } = useTranslation();

  return (
    <div className="w-full flex md:flex-row flex-col gap-3 p-4 md:py-4 md:px-14 bg-[#0A0A0A] border-b border-[#1F1F1F]">
      <div className="flex-1 flex items-center h-11 bg-[#161616] border border-[#1F1F1F] px-4 gap-2">
        <Search size={16} className="text-[#444444]" />
        <input 
          type="text" 
          placeholder={t('search.placeholder')} 
          className="bg-transparent border-none outline-none text-[13px] font-primary w-full text-[#FAF8F5] placeholder:text-[#444444]"
        />
      </div>
      <div className="flex gap-3">
        <select className="h-11 bg-[#161616] border border-[#1F1F1F] px-4 text-[12px] font-primary text-[#666666] outline-none w-full md:w-[160px] cursor-pointer">
          <option value="">{t('search.property_type')}</option>
          <option value="piso">{t('property_types.piso')}</option>
          <option value="chalet">{t('property_types.chalet')}</option>
          <option value="local">{t('property_types.local')}</option>
        </select>
        <select className="h-11 bg-[#161616] border border-[#1F1F1F] px-4 text-[12px] font-primary text-[#666666] outline-none w-full md:w-[160px] cursor-pointer">
          <option value="">{t('search.max_price')}</option>
          <option value="500000">{t('price_filters.up_to_500k')}</option>
          <option value="1000000">{t('price_filters.up_to_1M')}</option>
          <option value="2000000">{t('price_filters.up_to_2M')}</option>
        </select>
      </div>
    </div>
  );
};
