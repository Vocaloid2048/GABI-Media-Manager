import React, { useState, useCallback } from 'react';
import { Reorder, AnimatePresence, motion } from 'framer-motion';
import { FaPlus, FaTrash, FaLink, FaUnlink, FaMagic, FaGripLines } from 'react-icons/fa';
import { useLanguage } from '../../lang/LanguageContext';
import { GROUP_LABEL_LIST } from '../../constants/lyrics';

const TAG_OPTIONS = Object.entries(GROUP_LABEL_LIST).map(([key, val]) => ({
  key,
  label: val.zh_hk || val.en
}));

const StepReview = ({ data, onChange, onNext, onPrev }) => {
  const { locale } = useLanguage();
  const [selectedZh, setSelectedZh] = useState(null);
  const [selectedEn, setSelectedEn] = useState(null);

  const zhMap = new Map((data.zhStanzas || []).map(s => [s.id, s]));
  const enMap = new Map((data.enStanzas || []).map(s => [s.id, s]));

  // 計算已使用的段落 ID
  const usedZhIds = new Set();
  const usedEnIds = new Set();
  (data.pairings || []).forEach(p => {
    if (p.zhId) usedZhIds.add(p.zhId);
    if (p.enId) usedEnIds.add(p.enId);
  });

  const unpairedZh = (data.zhStanzas || []).filter(s => !usedZhIds.has(s.id));
  const unpairedEn = (data.enStanzas || []).filter(s => !usedEnIds.has(s.id));

  // 拖動重排主列表
  const handleReorder = useCallback((newOrder) => {
    onChange({ pairings: newOrder });
  }, [onChange]);

  // 更新段落標籤
  const handleTagChange = (language, id, newTag) => {
    const key = language === 'zh' ? 'zhStanzas' : 'enStanzas';
    const updated = data[key].map(s =>
      s.id === id ? { ...s, tag: newTag } : s
    );
    onChange({ [key]: updated });
  };

  // 更新段落內容
  const handleContentChange = (language, id, newContent) => {
    const key = language === 'zh' ? 'zhStanzas' : 'enStanzas';
    const updated = data[key].map(s =>
      s.id === id ? { ...s, content: newContent } : s
    );
    onChange({ [key]: updated });
  };

  // 刪除段落（從源數組和 pairings 中移除）
  const handleDeleteStanza = (language, id) => {
    const key = language === 'zh' ? 'zhStanzas' : 'enStanzas';
    const updated = data[key].filter(s => s.id !== id);

    // 從 pairings 中移除引用此 ID 的項目
    const updatedPairings = data.pairings
      .map(p => {
        if (language === 'zh' && p.zhId === id) {
          if (p.type === 'pair' && p.enId) {
            return { ...p, type: 'en', zhId: null };
          }
          return null;
        }
        if (language === 'en' && p.enId === id) {
          if (p.type === 'pair' && p.zhId) {
            return { ...p, type: 'zh', enId: null };
          }
          return null;
        }
        return p;
      })
      .filter(Boolean);

    onChange({ [key]: updated, pairings: updatedPairings });
  };

  // 新增段落
  const handleAddStanza = (language) => {
    const key = language === 'zh' ? 'zhStanzas' : 'enStanzas';
    const newId = Math.random().toString(36).substring(2, 10) + Date.now().toString(36).substring(0, 6);
    const newStanza = {
      id: newId,
      content: '',
      tag: null,
      order: (data[key]?.length || 0)
    };
    const newPairing = {
      id: `${language}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: language,
      [language === 'zh' ? 'zhId' : 'enId']: newId
    };
    onChange({
      [key]: [...(data[key] || []), newStanza],
      pairings: [...(data.pairings || []), newPairing]
    });
  };

  // 自動配對（未配對段落按索引配對）
  const handleAutoPair = () => {
    const zhLen = unpairedZh.length;
    const enLen = unpairedEn.length;
    if (zhLen === 0 && enLen === 0) {
      alert(locale('lyric_editor.no_unpaired_to_pair'));
      return;
    }

    const newPairings = [...(data.pairings || [])];
    const minLen = Math.min(zhLen, enLen);
    for (let i = 0; i < minLen; i++) {
      newPairings.push({
        id: `pair_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
        type: 'pair',
        zhId: unpairedZh[i].id,
        enId: unpairedEn[i].id
      });
    }
    onChange({ pairings: newPairings });
  };

  // 手動配對（選擇兩個未配對段落）
  const handleManualPair = () => {
    if (!selectedZh || !selectedEn) return;
    const newPairings = [...(data.pairings || [])];
    newPairings.push({
      id: `pair_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: 'pair',
      zhId: selectedZh,
      enId: selectedEn
    });
    onChange({ pairings: newPairings });
    setSelectedZh(null);
    setSelectedEn(null);
  };

  // 解除配對
  const handleUnpair = (pairId) => {
    const pair = data.pairings.find(p => p.id === pairId);
    if (!pair || pair.type !== 'pair') return;

    const updatedPairings = data.pairings.map(p => {
      if (p.id === pairId) {
        if (p.zhId && p.enId) {
          // 同時包含中英文，拆為兩個單段
          return [
            { id: `zh_${Date.now()}_1_${Math.random().toString(36).substr(2, 4)}`, type: 'zh', zhId: p.zhId },
            { id: `en_${Date.now()}_2_${Math.random().toString(36).substr(2, 4)}`, type: 'en', enId: p.enId }
          ];
        } else if (p.zhId) {
          return { id: `zh_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, type: 'zh', zhId: p.zhId };
        } else if (p.enId) {
          return { id: `en_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, type: 'en', enId: p.enId };
        }
      }
      return p;
    }).flat();

    onChange({ pairings: updatedPairings });
  };

  // 選擇未配對段落
  const handleSelectUnpaired = (language, id) => {
    if (language === 'zh') {
      setSelectedZh(prev => prev === id ? null : id);
    } else {
      setSelectedEn(prev => prev === id ? null : id);
    }
  };

  // 判斷是否有任何段落數據
  const hasAnyStanzas = (data.zhStanzas?.length || 0) + (data.enStanzas?.length || 0) > 0;
  const hasPairings = (data.pairings?.length || 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">{locale('lyric_editor.review_pairing')}</h3>
        <div className="flex items-center gap-2">
          {(unpairedZh.length > 0 || unpairedEn.length > 0) && (
            <button
              onClick={handleAutoPair}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <FaMagic size={14} /> {locale('lyric_editor.auto_pair')}
            </button>
          )}
        </div>
      </div>

      {/* 空數據提示 */}
      {!hasAnyStanzas && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
          <p className="text-yellow-400 text-sm">{locale('lyric_editor.please_enter_at_least_one')}</p>
        </div>
      )}

      {/* 主列表：統一 Reorder 區域（包含配對和單段） */}
      {hasPairings && (
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-xs">{locale('lyric_editor.drag_to_reorder_pairs')}</p>
          </div>
          <Reorder.Group axis="y" values={data.pairings || []} onReorder={handleReorder} className="space-y-2">
            <AnimatePresence>
              {(data.pairings || []).map((pair) => (
                <Reorder.Item
                  key={pair.id}
                  value={pair}
                  className="bg-gray-700 rounded-lg border border-gray-600 cursor-grab active:cursor-grabbing"
                >
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-gray-400">
                        <FaGripLines size={14} />
                      </div>
                      {pair.type === 'pair' && (
                        <>
                          <span className="text-xs text-blue-400 font-medium">{locale('lyric_editor.pair')}</span>
                          <button
                            onClick={() => handleUnpair(pair.id)}
                            className="ml-auto text-red-400 hover:text-red-300 text-xs flex items-center gap-1"
                          >
                            <FaUnlink size={10} /> {locale('lyric_editor.unpair')}
                          </button>
                        </>
                      )}
                      {pair.type === 'zh' && (
                        <span className="text-xs text-cyan-400 font-medium">{locale('lyric_editor.zh_only')}</span>
                      )}
                      {pair.type === 'en' && (
                        <span className="text-xs text-pink-400 font-medium">{locale('lyric_editor.en_only')}</span>
                      )}
                      <button
                        onClick={() => {
                          if (pair.type === 'pair') {
                            if (pair.zhId) handleDeleteStanza('zh', pair.zhId);
                            if (pair.enId) handleDeleteStanza('en', pair.enId);
                          } else if (pair.type === 'zh') {
                            handleDeleteStanza('zh', pair.zhId);
                          } else if (pair.type === 'en') {
                            handleDeleteStanza('en', pair.enId);
                          }
                        }}
                        className="ml-2 text-red-400 hover:text-red-300 p-1"
                        title={locale('lyric_editor.delete')}
                      >
                        <FaTrash size={10} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pair.zhId && (
                        <StanzaEditor
                          stanza={zhMap.get(pair.zhId)}
                          language="zh"
                          onTagChange={(id, tag) => handleTagChange('zh', id, tag)}
                          onContentChange={(id, content) => handleContentChange('zh', id, content)}
                        />
                      )}
                      {pair.enId && (
                        <StanzaEditor
                          stanza={enMap.get(pair.enId)}
                          language="en"
                          onTagChange={(id, tag) => handleTagChange('en', id, tag)}
                          onContentChange={(id, content) => handleContentChange('en', id, content)}
                        />
                      )}
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
        </div>
      )}

      {/* 未使用段落池 */}
      {(unpairedZh.length > 0 || unpairedEn.length > 0) && (
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-medium text-sm">{locale('lyric_editor.unpaired_pool')}</h4>
            {selectedZh && selectedEn && (
              <button
                onClick={handleManualPair}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <FaLink size={10} /> {locale('lyric_editor.pair_selected')}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-cyan-400 text-xs font-medium mb-2">{locale('lyric_editor.review_zh')} ({unpairedZh.length})</p>
              <div className="space-y-2">
                {unpairedZh.map(stanza => (
                  <div
                    key={stanza.id}
                    onClick={() => handleSelectUnpaired('zh', stanza.id)}
                    className={`bg-gray-700 rounded-lg p-2 border-2 cursor-pointer transition-all ${
                      selectedZh === stanza.id ? 'border-blue-500' : 'border-transparent hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <select
                        value={stanza.tag || ''}
                        onChange={(e) => handleTagChange('zh', stanza.id, e.target.value || null)}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-gray-600 text-white text-xs px-1 py-0.5 rounded border border-gray-500"
                      >
                        <option value="">{locale('lyric_editor.no_tag')}</option>
                        {TAG_OPTIONS.map(opt => (
                          <option key={opt.key} value={opt.key}>{opt.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteStanza('zh', stanza.id); }}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <FaTrash size={10} />
                      </button>
                    </div>
                    <p className="text-gray-300 text-xs line-clamp-2">{stanza.content || locale('lyric_editor.empty_stanza')}</p>
                  </div>
                ))}
                {unpairedZh.length === 0 && (
                  <p className="text-gray-500 text-xs text-center py-2">{locale('lyric_editor.all_zh_paired')}</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-pink-400 text-xs font-medium mb-2">{locale('lyric_editor.review_en')} ({unpairedEn.length})</p>
              <div className="space-y-2">
                {unpairedEn.map(stanza => (
                  <div
                    key={stanza.id}
                    onClick={() => handleSelectUnpaired('en', stanza.id)}
                    className={`bg-gray-700 rounded-lg p-2 border-2 cursor-pointer transition-all ${
                      selectedEn === stanza.id ? 'border-blue-500' : 'border-transparent hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <select
                        value={stanza.tag || ''}
                        onChange={(e) => handleTagChange('en', stanza.id, e.target.value || null)}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-gray-600 text-white text-xs px-1 py-0.5 rounded border border-gray-500"
                      >
                        <option value="">{locale('lyric_editor.no_tag')}</option>
                        {TAG_OPTIONS.map(opt => (
                          <option key={opt.key} value={opt.key}>{opt.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteStanza('en', stanza.id); }}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <FaTrash size={10} />
                      </button>
                    </div>
                    <p className="text-gray-300 text-xs line-clamp-2">{stanza.content || locale('lyric_editor.empty_stanza')}</p>
                  </div>
                ))}
                {unpairedEn.length === 0 && (
                  <p className="text-gray-500 text-xs text-center py-2">{locale('lyric_editor.all_en_paired')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 添加段落按鈕 */}
      <div className="flex gap-3">
        <button
          onClick={() => handleAddStanza('zh')}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-cyan-400 border border-cyan-500/30 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <FaPlus size={12} /> {locale('lyric_editor.add_zh_stanza')}
        </button>
        <button
          onClick={() => handleAddStanza('en')}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-pink-400 border border-pink-500/30 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <FaPlus size={12} /> {locale('lyric_editor.add_en_stanza')}
        </button>
      </div>

      {/* 底部導航 */}
      <div className="flex justify-between pt-4 border-t border-gray-700">
        <button
          onClick={onPrev}
          className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm font-medium"
        >
          {locale('lyric_editor.prev_step')}
        </button>
        <button
          onClick={onNext}
          disabled={!hasPairings}
          className={`px-6 py-2 rounded-lg text-white font-medium text-sm transition-all ${
            hasPairings
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

// 段落編輯器（內嵌在配對/單段中）
const StanzaEditor = ({ stanza, language, onTagChange, onContentChange }) => {
  const { locale } = useLanguage();
  if (!stanza) return null;

  const borderColor = language === 'zh' ? 'border-cyan-500/30' : 'border-pink-500/30';
  const textColor = language === 'zh' ? 'text-cyan-400' : 'text-pink-400';

  return (
    <div className={`bg-gray-800 rounded-lg p-2 border ${borderColor}`}>
      <div className="flex items-center justify-between mb-1">
        <select
          value={stanza.tag || ''}
          onChange={(e) => onTagChange(stanza.id, e.target.value || null)}
          className="bg-gray-700 text-white text-xs px-1 py-0.5 rounded border border-gray-600"
        >
          <option value="">{locale('lyric_editor.no_tag')}</option>
          {TAG_OPTIONS.map(opt => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
        <span className={`text-xs font-medium ${textColor}`}>
          {language === 'zh' ? locale('lyric_editor.zh') : locale('lyric_editor.en')}
        </span>
      </div>
      <textarea
        value={stanza.content}
        onChange={(e) => onContentChange(stanza.id, e.target.value)}
        className="w-full bg-gray-900/50 text-white text-sm rounded px-2 py-1 border border-gray-700 focus:outline-none focus:border-blue-500 resize-none"
        rows={3}
        placeholder={language === 'zh' ? locale('lyric_editor.zh_placeholder') : locale('lyric_editor.en_placeholder')}
      />
    </div>
  );
};

export default StepReview;
