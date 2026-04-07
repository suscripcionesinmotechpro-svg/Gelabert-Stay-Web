import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

export const AvisoLegal = () => {
  const { t } = useTranslation();

  const renderBold = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (typeof part === 'string' && part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-[#C9A962]">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const sections = t('legal.notice.sections', { returnObjects: true }) as any[];

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-32 pb-20 px-6 md:px-20 font-primary text-[#888888]">
      <Helmet>
        <title>{t('legal.notice.seo_title')}</title>
      </Helmet>
      
      <div className="max-w-4xl mx-auto space-y-12">
        <h1 className="font-secondary text-5xl text-[#C9A962] border-b border-[#1F1F1F] pb-8 text-center italic">
          {t('legal.notice.title')}
        </h1>
        
        <div className="space-y-12 leading-relaxed">
          {Array.isArray(sections) && sections.map((section, index) => (
            <section key={index} className={`${index === 0 ? 'bg-[#161616] p-8 border border-[#1F1F1F] rounded-sm' : 'space-y-4'}`}>
              <h2 className="text-[#FAF8F5] text-xl font-bold mb-4 uppercase tracking-widest">
                {section.title}
              </h2>
              
              <div className="space-y-4">
                {section.content && (
                  <p className="whitespace-pre-line">{renderBold(section.content)}</p>
                )}

                {section.items && (
                  <ul className="space-y-2">
                    {section.items.map((item: string, i: number) => (
                      <li key={i} className="flex gap-2">
                        <span>{renderBold(item)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.bullets && (
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    {section.bullets.map((bullet: string, i: number) => (
                      <li key={i}>{renderBold(bullet)}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};
