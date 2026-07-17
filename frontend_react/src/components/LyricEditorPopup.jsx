import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaMusic } from 'react-icons/fa';
import { useLanguage } from '../lang/LanguageContext';
import { generateDs } from '../utils/auth';
import StepInput from './LyricEditorSteps/StepInput';
import StepReview from './LyricEditorSteps/StepReview';
import StepArrange from './LyricEditorSteps/StepArrange';
import StepPreview from './LyricEditorSteps/StepPreview';

const STEPS = [1, 2, 3, 4];
const STEP_TITLES = [
  'lyric_editor.step1_title',
  'lyric_editor.step2_title',
  'lyric_editor.step3_title',
  'lyric_editor.step4_title'
];

const LyricEditorPopup = ({ onClose }) => {
  const { locale } = useLanguage();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    songName: '',
    proFile: null,
    proParsedData: null,
    proElementMapping: { zh: 0, en: 1 },
    zhText: '',
    enText: '',
    zhStanzas: [],
    enStanzas: [],
    pairings: [],
    slides: [],
    layoutMode: 'center-split',
    layoutSwap: false,
    useIntroAsLabel: false,
    copyright: {
      composer: '', lyricist: '', arranger: '',
      publisher: '', year: '', album: ''
    }
  });
  const [isParsing, setIsParsing] = useState(false);
  const [step1Error, setStep1Error] = useState(null);

  // 更新數據的輔助函數
  const updateData = useCallback((updates) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  // Step 1 完成時：解析純文字並初始化段落
  const handleStep1Complete = useCallback(async () => {
    setIsParsing(true);
    setStep1Error(null);
    const newData = { ...data };
    let hasError = false;

    try {
      const userId = localStorage.getItem('user_id');
      const ds = generateDs(userId);

      if (!ds) {
        throw new Error('Auth failed: cannot generate ds');
      }

      // 解析中文歌詞
      if (data.zhText?.trim() && !data.proUseFor?.zh) {
        const response = await fetch(`/api/tool/lyric-editor/parse-text?user_id=${userId}&ds=${encodeURIComponent(ds)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: data.zhText })
        });
        const result = await response.json();
        if (result.retcode === 1) {
          newData.zhStanzas = result.data;
        } else {
          throw new Error(result.message || 'Parse Chinese failed');
        }
      }

      // 解析英文歌詞
      if (data.enText?.trim() && !data.proUseFor?.en) {
        const response = await fetch(`/api/tool/lyric-editor/parse-text?user_id=${userId}&ds=${encodeURIComponent(ds)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: data.enText })
        });
        const result = await response.json();
        if (result.retcode === 1) {
          newData.enStanzas = result.data;
        } else {
          throw new Error(result.message || 'Parse English failed');
        }
      }

      // 如果使用 .pro 作為中文
      if (data.proUseFor?.zh) {
        if (data.proParsedData?.slides) {
          const zhElementIdx = data.proElementMapping?.zh ?? 0;
          newData.zhStanzas = data.proParsedData.slides.map((s, i) => {
            const content = (s.elements && s.elements[zhElementIdx] !== undefined)
              ? s.elements[zhElementIdx]
              : s.content;
            return {
              id: `pro_zh_${i}_${Math.random().toString(36).substr(2, 6)}`,
              content: content || '',
              tag: s.tag,
              order: i
            };
          }).filter(s => s.content.trim());
        } else {
          throw new Error('No .pro file uploaded for Chinese');
        }
      }

      // 如果使用 .pro 作為英文
      if (data.proUseFor?.en) {
        if (data.proParsedData?.slides) {
          const enElementIdx = data.proElementMapping?.en ?? 1;
          newData.enStanzas = data.proParsedData.slides.map((s, i) => {
            const content = (s.elements && s.elements[enElementIdx] !== undefined)
              ? s.elements[enElementIdx]
              : s.content;
            return {
              id: `pro_en_${i}_${Math.random().toString(36).substr(2, 6)}`,
              content: content || '',
              tag: s.tag,
              order: i
            };
          }).filter(s => s.content.trim());
        } else {
          throw new Error('No .pro file uploaded for English');
        }
      }

      // 檢查是否有任何段落數據
      const totalStanzas = (newData.zhStanzas?.length || 0) + (newData.enStanzas?.length || 0);
      if (totalStanzas === 0) {
        throw new Error('No lyrics data available');
      }

      // 自動配對（新結構：pairings 包含 type 和 id 欄位）
      const zhLen = newData.zhStanzas?.length || 0;
      const enLen = newData.enStanzas?.length || 0;
      const pairings = [];
      const minLen = Math.min(zhLen, enLen);
      for (let i = 0; i < minLen; i++) {
        pairings.push({
          id: `pair_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
          type: 'pair',
          zhId: newData.zhStanzas[i].id,
          enId: newData.enStanzas[i].id
        });
      }
      if (zhLen > minLen) {
        for (let i = minLen; i < zhLen; i++) {
          pairings.push({
            id: `zh_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
            type: 'zh',
            zhId: newData.zhStanzas[i].id
          });
        }
      }
      if (enLen > minLen) {
        for (let i = minLen; i < enLen; i++) {
          pairings.push({
            id: `en_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
            type: 'en',
            enId: newData.enStanzas[i].id
          });
        }
      }
      newData.pairings = pairings;

    } catch (error) {
      console.error('Step 1 parsing error:', error);
      hasError = true;
      setStep1Error(error.message || 'Failed to parse lyrics');
    } finally {
      setIsParsing(false);
      if (!hasError) {
        setData(newData);
        setStep(2);
      }
    }
  }, [data]);

  // Step 2 完成時：生成 slides
  const handleStep2Complete = useCallback(() => {
    const zhMap = new Map(data.zhStanzas.map(s => [s.id, s]));
    const enMap = new Map(data.enStanzas.map(s => [s.id, s]));

    const slides = data.pairings.map((pair, index) => {
      if (pair.type === 'pair') {
        const zhStanza = zhMap.get(pair.zhId);
        const enStanza = enMap.get(pair.enId);
        const zhContent = zhStanza ? zhStanza.content : '';
        const enContent = enStanza ? enStanza.content : '';
        const tag = (zhStanza && zhStanza.tag) || (enStanza && enStanza.tag) || 'VERSE';
        const content = mergeContent(zhContent, enContent, data.layoutMode, data.layoutSwap);
        return { page: index + 1, tag, zhContent, enContent, content };
      } else if (pair.type === 'zh') {
        const zhStanza = zhMap.get(pair.zhId);
        const zhContent = zhStanza ? zhStanza.content : '';
        const tag = zhStanza ? zhStanza.tag : 'VERSE';
        return { page: index + 1, tag, zhContent, enContent: '', content: zhContent };
      } else if (pair.type === 'en') {
        const enStanza = enMap.get(pair.enId);
        const enContent = enStanza ? enStanza.content : '';
        const tag = enStanza ? enStanza.tag : 'VERSE';
        return { page: index + 1, tag, zhContent: '', enContent, content: enContent };
      }
      return null;
    }).filter(s => s && (s.zhContent || s.enContent));

    setData(prev => ({ ...prev, slides }));
    setStep(3);
  }, [data]);

  // Step 3 完成時：進入預覽
  const handleStep3Complete = useCallback(() => {
    setStep(4);
  }, []);

  // 合併內容輔助函數
  const mergeContent = (zhContent, enContent, layoutMode, layoutSwap) => {
    const first = layoutSwap ? enContent : zhContent;
    const second = layoutSwap ? zhContent : enContent;

    switch (layoutMode) {
      case 'interleave': {
        if (!first && !second) return '';
        if (!first) return second;
        if (!second) return first;
        const firstLines = first.split('\n').filter(l => l.trim());
        const secondLines = second.split('\n').filter(l => l.trim());
        const result = [];
        const maxLen = Math.max(firstLines.length, secondLines.length);
        for (let i = 0; i < maxLen; i++) {
          if (firstLines[i]) result.push(firstLines[i]);
          if (secondLines[i]) result.push(secondLines[i]);
        }
        return result.join('\n');
      }
      case 'top-bottom':
      case 'center-split':
      default:
        if (first && second) {
          return first + '\n\n' + second;
        }
        return first || second || '';
    }
  };

  // 當排版模式或對調狀態改變時，重新生成 slides
  useEffect(() => {
    if (step >= 3 && data.slides.length > 0) {
      const updatedSlides = data.slides.map(slide => ({
        ...slide,
        content: mergeContent(slide.zhContent, slide.enContent, data.layoutMode, data.layoutSwap)
      }));
      setData(prev => ({ ...prev, slides: updatedSlides }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.layoutMode, data.layoutSwap]);

  const handleComplete = () => {
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(75, 85, 99, 0.5);
          border-radius: 20px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.8);
        }
      `}</style>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-gray-800 w-full sm:max-w-4xl rounded-t-2xl sm:rounded-2xl border-t sm:border border-gray-700 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 pb-2 shrink-0">
          <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mb-6 sm:hidden"></div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FaMusic className="text-purple-500 text-xl" />
              <h2 className="text-lg font-bold text-white">{locale('tool.multi_lang_lyric_title')}</h2>
            </div>
            <div className="flex items-center gap-4">
              {/* Step 指示器 */}
              <div className="flex items-center gap-2">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        step === s
                          ? 'bg-blue-600 text-white'
                          : step > s
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {step > s ? '✓' : s}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`w-4 h-0.5 mx-1 ${step > s + 1 ? 'bg-green-600' : 'bg-gray-700'}`} />
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            {locale('lyric_editor.step')} {step} / 4: {locale(STEP_TITLES[step - 1])}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-2 pr-2 mr-1">
          <AnimatePresence mode="wait">
            {isParsing ? (
              <motion.div
                key="parsing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center py-20"
              >
                <div className="text-white text-lg">{locale('common.processing')}</div>
              </motion.div>
            ) : (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {step === 1 && (
                  <StepInput
                    data={data}
                    onChange={updateData}
                    onNext={handleStep1Complete}
                    error={step1Error}
                  />
                )}
                {step === 2 && (
                  <StepReview
                    data={data}
                    onChange={updateData}
                    onNext={handleStep2Complete}
                    onPrev={() => setStep(1)}
                  />
                )}
                {step === 3 && (
                  <StepArrange
                    data={data}
                    onChange={updateData}
                    onNext={handleStep3Complete}
                    onPrev={() => setStep(2)}
                  />
                )}
                {step === 4 && (
                  <StepPreview
                    data={data}
                    onChange={updateData}
                    onPrev={() => setStep(3)}
                    onComplete={handleComplete}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LyricEditorPopup;
