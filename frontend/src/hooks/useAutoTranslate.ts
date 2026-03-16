import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const useAutoTranslate = (esText: string | null | undefined, enText: string | null | undefined) => {
  const { i18n } = useTranslation();
  const [translatedText, setTranslatedText] = useState<string>(enText || esText || '');
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const translate = async () => {
      // Si estamos en español, o ya tenemos texto en inglés, no hacemos nada
      if (!i18n.language.startsWith('en') || enText || !esText || esText.length < 3) {
        setTranslatedText(enText || esText || '');
        return;
      }

      setIsTranslating(true);
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(esText)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Translation failed');
        
        const data = await response.json();
        if (data && data[0]) {
          const result = data[0].map((item: any) => item[0]).join("");
          setTranslatedText(result);
        }
      } catch (error) {
        console.error('AutoTranslate Error:', error);
        setTranslatedText(esText); // Fallback al español
      } finally {
        setIsTranslating(false);
      }
    };

    translate();
  }, [esText, enText, i18n.language]);

  return { translatedText, isTranslating };
};

export const useAutoTranslateArray = (esArray: string[] | null | undefined, enArray: string[] | null | undefined) => {
  const { i18n } = useTranslation();
  const [translatedArray, setTranslatedArray] = useState<string[]>(enArray && enArray.length > 0 ? enArray : (esArray || []));
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const translateAll = async () => {
      if (!i18n.language.startsWith('en') || (enArray && enArray.length > 0) || !esArray || esArray.length === 0) {
        setTranslatedArray(enArray && enArray.length > 0 ? enArray : (esArray || []));
        return;
      }

      setIsTranslating(true);
      try {
        const results = await Promise.all(esArray.map(async (text) => {
          if (text.length < 3) return text;
          const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(text)}`;
          const response = await fetch(url);
          if (!response.ok) return text;
          const data = await response.json();
          return (data && data[0]) ? data[0].map((item: any) => item[0]).join("") : text;
        }));
        setTranslatedArray(results);
      } catch (error) {
        console.error('AutoTranslateArray Error:', error);
        setTranslatedArray(esArray);
      } finally {
        setIsTranslating(false);
      }
    };

    translateAll();
  }, [esArray, enArray, i18n.language]);

  return { translatedArray, isTranslating };
};
