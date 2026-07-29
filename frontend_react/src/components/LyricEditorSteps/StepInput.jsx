import React, { useState, useRef } from 'react';
import { FaCloudUploadAlt, FaFile, FaTimes, FaExchangeAlt } from 'react-icons/fa';
import { useLanguage } from '../../lang/LanguageContext';
import { generateDs } from '../../utils/auth';

const StepInput = ({ data, onChange, onNext, error }) => {
  const { locale } = useLanguage();
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState(null);
  const zhFileInputRef = useRef(null);

  const handleProUpload = async (file) => {
    if (!file || !file.name.endsWith('.pro')) {
      setParseError(locale('song.please_select_pro_file'));
      return;
    }
    if (file.size > 1024 * 1024) {
      setParseError(locale('song.file_size_exceed'));
      return;
    }

    setIsParsing(true);
    setParseError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const userId = localStorage.getItem('user_id');
      const ds = generateDs(userId);
      if (!ds) {
        setParseError(locale('auth.ds_generation_failed'));
        setIsParsing(false);
        return;
      }
      const response = await fetch(`/api/tool/lyric-editor/parse-pro?user_id=${userId}&ds=${encodeURIComponent(ds)}`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.retcode === 1) {
        onChange({
          proFile: file,
          proParsedData: result.data
        });
      } else {
        setParseError(result.message || locale('lyric_editor.parse_failed'));
      }
    } catch (error) {
      console.error('Parse pro error:', error);
      setParseError(locale('lyric_editor.parse_failed'));
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleProUpload(file);
    }
  };

  const clearProFile = () => {
    onChange({
      proFile: null,
      proParsedData: null
    });
  };

  const handleToggleProVersion = (language) => {
    const current = data.proUseFor || {};
    onChange({
      proUseFor: {
        ...current,
        [language]: !current[language]
      }
    });
  };

  const handleElementMappingChange = (lang, index) => {
    const currentMapping = data.proElementMapping || { zh: 0, en: 1 };
    onChange({
      proElementMapping: {
        ...currentMapping,
        [lang]: parseInt(index, 10)
      }
    });
  };

  const handleSwapElements = () => {
    const currentMapping = data.proElementMapping || { zh: 0, en: 1 };
    onChange({
      proElementMapping: {
        zh: currentMapping.en ?? 1,
        en: currentMapping.zh ?? 0
      }
    });
  };

  // 檢查是否有 elements 需要分配
  const hasMultipleElements = data.proParsedData?.slides?.some(s => s.elements && s.elements.length > 1);
  const maxElements = data.proParsedData?.slides?.reduce((max, s) => Math.max(max, s.elements?.length || 0), 0) || 0;

  const canProceed = (data.songNameZh?.trim() || data.songNameEn?.trim()) && (
    data.zhText?.trim() ||
    data.enText?.trim() ||
    data.proUseFor?.zh ||
    data.proUseFor?.en
  );

  return (
    <div className="space-y-6">
      {/* 歌曲名稱 - 中文 / 英文分欄 */}
      <div>
        <label className="block text-white text-sm font-medium mb-2">
          {locale('lyric_editor.song_name')} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={data.songNameZh || ''}
            onChange={(e) => onChange({ songNameZh: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder={locale('lyric_editor.song_name_zh_placeholder')}
            maxLength={100}
          />
          <input
            type="text"
            value={data.songNameEn || ''}
            onChange={(e) => onChange({ songNameEn: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder={locale('lyric_editor.song_name_en_placeholder')}
            maxLength={100}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 左側：.pro 上傳 */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            {locale('lyric_editor.upload_pro')}
          </label>
          <div
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all cursor-pointer min-h-[200px] ${
              data.proFile
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-600 bg-gray-900/50 hover:bg-gray-900 hover:border-gray-500'
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => !data.proFile && document.getElementById('proLyricInput').click()}
          >
            {data.proFile ? (
              <div className="text-center w-full">
                <FaFile className="text-blue-400 text-3xl mx-auto mb-2" />
                <p className="text-white text-sm font-medium">{data.proFile.name}</p>
                {data.proParsedData && (
                  <p className="text-gray-400 text-xs mt-1">
                    {locale('lyric_editor.pro_parsed_slides').replace('{count}', data.proParsedData.slides?.length || 0)}
                  </p>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); clearProFile(); }}
                  className="mt-3 text-red-400 hover:text-red-300 text-sm flex items-center gap-1 mx-auto"
                >
                  <FaTimes size={12} /> {locale('common.cancel')}
                </button>
              </div>
            ) : (
              <>
                <FaCloudUploadAlt className="text-gray-500 text-4xl mb-3" />
                <p className="text-gray-300 text-sm text-center font-medium">
                  {isParsing ? locale('common.processing') : locale('lyric_editor.upload_pro_drag')}
                </p>
                {parseError && (
                  <p className="text-red-400 text-xs mt-2">{parseError}</p>
                )}
              </>
            )}
            <input
              type="file"
              id="proLyricInput"
              className="hidden"
              onChange={handleFileChange}
              accept=".pro"
            />
          </div>

          {/* .pro 版本選擇 */}
          {data.proParsedData && (
            <div className="mt-3 space-y-2">
              <p className="text-gray-400 text-xs">{locale('lyric_editor.select_pro_version')}</p>
              <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.proUseFor?.zh || false}
                  onChange={() => handleToggleProVersion('zh')}
                  className="w-4 h-4"
                />
                {locale('lyric_editor.pro_version_zh')}
              </label>
              <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.proUseFor?.en || false}
                  onChange={() => handleToggleProVersion('en')}
                  className="w-4 h-4"
                />
                {locale('lyric_editor.pro_version_en')}
              </label>
            </div>
          )}

          {/* Element 分配（當 .pro 有多個 elements 時顯示） */}
          {hasMultipleElements && (data.proUseFor?.zh || data.proUseFor?.en) && (
            <div className="mt-4 bg-gray-800/70 rounded-lg p-3 border border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-300 text-xs font-medium">{locale('lyric_editor.pro_element_assignment')}</p>
                <button
                  onClick={handleSwapElements}
                  className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                >
                  <FaExchangeAlt size={10} /> {locale('lyric_editor.swap_elements')}
                </button>
              </div>
              <div className="space-y-2">
                {data.proUseFor?.zh && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs w-12">{locale('lyric_editor.zh')}:</span>
                    <select
                      value={data.proElementMapping?.zh ?? 0}
                      onChange={(e) => handleElementMappingChange('zh', e.target.value)}
                      className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 flex-1"
                    >
                      {Array.from({ length: maxElements }, (_, i) => (
                        <option key={i} value={i}>
                          Element {i + 1}
                          {data.proParsedData.slides[0]?.elements?.[i]
                            ? ` — ${data.proParsedData.slides[0].elements[i].substring(0, 30)}...`
                            : ' (空)'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {data.proUseFor?.en && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs w-12">{locale('lyric_editor.en')}:</span>
                    <select
                      value={data.proElementMapping?.en ?? 1}
                      onChange={(e) => handleElementMappingChange('en', e.target.value)}
                      className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 flex-1"
                    >
                      {Array.from({ length: maxElements }, (_, i) => (
                        <option key={i} value={i}>
                          Element {i + 1}
                          {data.proParsedData.slides[0]?.elements?.[i]
                            ? ` — ${data.proParsedData.slides[0].elements[i].substring(0, 30)}...`
                            : ' (空)'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 右側：中文 + 英文輸入 */}
        <div className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              {locale('lyric_editor.zh_lyrics')}
            </label>
            <textarea
              value={data.zhText || ''}
              onChange={(e) => onChange({ zhText: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
              rows={5}
              placeholder={locale('lyric_editor.zh_lyrics_placeholder')}
            />
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              {locale('lyric_editor.en_lyrics')}
            </label>
            <textarea
              value={data.enText || ''}
              onChange={(e) => onChange({ enText: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
              rows={5}
              placeholder={locale('lyric_editor.en_lyrics_placeholder')}
            />
          </div>
        </div>
      </div>

      {/* 底部按鈕 */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      <div className="flex justify-end pt-4 border-t border-gray-700">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`px-6 py-2 rounded-lg text-white font-medium text-sm transition-all ${
            canProceed
              ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20'
              : 'bg-gray-600 cursor-not-allowed opacity-50'
          }`}
        >
          {locale('lyric_editor.next_step')}
        </button>
      </div>
    </div>
  );
};

export default StepInput;
