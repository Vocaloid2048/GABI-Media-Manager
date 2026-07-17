import React, { useState, useEffect } from 'react';
import { FaArrowUp, FaArrowDown, FaLink, FaUnlink, FaPlus, FaTrash, FaMagic } from 'react-icons/fa';
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

  // 自動配對
  const handleAutoPair = () => {
    const zhLen = data.zhStanzas?.length || 0;
    const enLen = data.enStanzas?.length || 0;
    if (zhLen === 0 && enLen === 0) {
      alert(locale('lyric_editor.please_enter_at_least_one'));
      return;
    }
    const maxLen = Math.max(zhLen, enLen);
    const newPairings = [];
    for (let i = 0; i < maxLen; i++) {
      newPairings.push({
        zhId: data.zhStanzas?.[i]?.id || null,
        enId: data.enStanzas?.[i]?.id || null
      });
    }
    onChange({ pairings: newPairings });
  };

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

  // 刪除段落
  const handleDeleteStanza = (language, id) => {
    const key = language === 'zh' ? 'zhStanzas' : 'enStanzas';
    const updated = data[key].filter(s => s.id !== id);
    // 同步更新 pairings
    const updatedPairings = data.pairings
      .filter(p => (language === 'zh' ? p.zhId !== id : p.enId !== id))
      .map(p => ({
        ...p,
        [language === 'zh' ? 'zhId' : 'enId']: p[language === 'zh' ? 'zhId' : 'enId'] === id ? null : p[language === 'zh' ? 'zhId' : 'enId']
      }));
    onChange({ [key]: updated, pairings: updatedPairings });
  };

  // 新增段落
  const handleAddStanza = (language) => {
    const key = language === 'zh' ? 'zhStanzas' : 'enStanzas';
    const newStanza = {
      id: Math.random().toString(36).substring(2, 10) + Date.now().toString(36).substring(0, 6),
      content: '',
      tag: null,
      order: (data[key]?.length || 0)
    };
    onChange({ [key]: [...(data[key] || []), newStanza] });
  };

  // 選擇段落進行配對
  const handleSelectStanza = (language, id) => {
    if (language === 'zh') {
      setSelectedZh(id);
      if (selectedEn) {
        // 自動配對這兩個
        const existingPairIndex = data.pairings.findIndex(p => p.zhId === id || p.enId === selectedEn);
        if (existingPairIndex >= 0) {
          // 更新現有配對
          const updated = [...data.pairings];
          updated[existingPairIndex] = { zhId: id, enId: selectedEn };
          onChange({ pairings: updated });
        } else {
          onChange({ pairings: [...data.pairings, { zhId: id, enId: selectedEn }] });
        }
        setSelectedEn(null);
        setSelectedZh(null);
      }
    } else {
      setSelectedEn(id);
      if (selectedZh) {
        const existingPairIndex = data.pairings.findIndex(p => p.zhId === selectedZh || p.enId === id);
        if (existingPairIndex >= 0) {
          const updated = [...data.pairings];
          updated[existingPairIndex] = { zhId: selectedZh, enId: id };
          onChange({ pairings: updated });
        } else {
          onChange({ pairings: [...data.pairings, { zhId: selectedZh, enId: id }] });
        }
        setSelectedZh(null);
        setSelectedEn(null);
      }
    }
  };

  // 解除配對
  const handleUnpair = (pairIndex) => {
    const updated = data.pairings.filter((_, i) => i !== pairIndex);
    onChange({ pairings: updated });
  };

  // 移動段落
  const handleMove = (language, id, direction) => {
    const key = language === 'zh' ? 'zhStanzas' : 'enStanzas';
    const arr = [...data[key]];
    const idx = arr.findIndex(s => s.id === id);
    if (idx < 0) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    onChange({ [key]: arr });
  };

  const zhMap = new Map((data.zhStanzas || []).map(s => [s.id, s]));
  const enMap = new Map((data.enStanzas || []).map(s => [s.id, s]));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">{locale('lyric_editor.review_pairing')}</h3>
        <button
          onClick={handleAutoPair}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <FaMagic size={14} /> {locale('lyric_editor.auto_pair')}
        </button>
      </div>

      {/* 空數據提示 */}
      {(data.zhStanzas?.length === 0 && data.enStanzas?.length === 0) && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
          <p className="text-yellow-400 text-sm">{locale('lyric_editor.please_enter_at_least_one')}</p>
        </div>
      )}

      {/* 配對列表 */}
      <div className="space-y-2">
        {data.pairings?.map((pair, idx) => {
          const zhStanza = zhMap.get(pair.zhId);
          const enStanza = enMap.get(pair.enId);
          if (!zhStanza && !enStanza) return null;

          return (
            <div key={idx} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{locale('lyric_editor.review_pairing')} #{idx + 1}</span>
                <button
                  onClick={() => handleUnpair(idx)}
                  className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"
                >
                  <FaUnlink size={12} /> {locale('lyric_editor.unpair')}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {zhStanza && (
                  <StanzaCard
                    stanza={zhStanza}
                    language="zh"
                    onTagChange={(id, tag) => handleTagChange('zh', id, tag)}
                    onContentChange={(id, content) => handleContentChange('zh', id, content)}
                    onDelete={(id) => handleDeleteStanza('zh', id)}
                    onMove={(id, dir) => handleMove('zh', id, dir)}
                    isSelected={selectedZh === zhStanza.id}
                    onSelect={() => handleSelectStanza('zh', zhStanza.id)}
                  />
                )}
                {enStanza && (
                  <StanzaCard
                    stanza={enStanza}
                    language="en"
                    onTagChange={(id, tag) => handleTagChange('en', id, tag)}
                    onContentChange={(id, content) => handleContentChange('en', id, content)}
                    onDelete={(id) => handleDeleteStanza('en', id)}
                    onMove={(id, dir) => handleMove('en', id, dir)}
                    isSelected={selectedEn === enStanza.id}
                    onSelect={() => handleSelectStanza('en', enStanza.id)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 未配對的段落 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UnpairedStanzaList
          title={locale('lyric_editor.review_zh')}
          stanzas={data.zhStanzas || []}
          pairedIds={new Set(data.pairings?.map(p => p.zhId).filter(Boolean))}
          language="zh"
          onTagChange={handleTagChange}
          onContentChange={handleContentChange}
          onDelete={handleDeleteStanza}
          onMove={handleMove}
          onAdd={() => handleAddStanza('zh')}
          selectedId={selectedZh}
          onSelect={handleSelectStanza}
        />
        <UnpairedStanzaList
          title={locale('lyric_editor.review_en')}
          stanzas={data.enStanzas || []}
          pairedIds={new Set(data.pairings?.map(p => p.enId).filter(Boolean))}
          language="en"
          onTagChange={handleTagChange}
          onContentChange={handleContentChange}
          onDelete={handleDeleteStanza}
          onMove={handleMove}
          onAdd={() => handleAddStanza('en')}
          selectedId={selectedEn}
          onSelect={handleSelectStanza}
        />
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
          disabled={!data.pairings?.length}
          className={`px-6 py-2 rounded-lg text-white font-medium text-sm transition-all ${
            data.pairings?.length
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

// 段落卡片組件
const StanzaCard = ({ stanza, language, onTagChange, onContentChange, onDelete, onMove, isSelected, onSelect }) => {
  const { locale } = useLanguage();

  return (
    <div
      className={`bg-gray-800 rounded-lg p-3 border-2 transition-all cursor-pointer ${
        isSelected ? 'border-blue-500' : 'border-transparent hover:border-gray-500'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-2">
        <select
          value={stanza.tag || ''}
          onChange={(e) => onTagChange(stanza.id, e.target.value || null)}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
        >
          <option value="">{locale('lyric_editor.no_tag')}</option>
          {TAG_OPTIONS.map(opt => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); onMove(stanza.id, -1); }} className="text-gray-400 hover:text-white p-1">
            <FaArrowUp size={12} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onMove(stanza.id, 1); }} className="text-gray-400 hover:text-white p-1">
            <FaArrowDown size={12} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(stanza.id); }} className="text-red-400 hover:text-red-300 p-1">
            <FaTrash size={12} />
          </button>
        </div>
      </div>
      <textarea
        value={stanza.content}
        onChange={(e) => onContentChange(stanza.id, e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-gray-900/50 text-white text-sm rounded px-2 py-1 border border-gray-700 focus:outline-none focus:border-blue-500 resize-none"
        rows={3}
      />
    </div>
  );
};

// 未配對段落列表
const UnpairedStanzaList = ({ title, stanzas, pairedIds, language, onTagChange, onContentChange, onDelete, onMove, onAdd, selectedId, onSelect }) => {
  const { locale } = useLanguage();
  const unpaired = stanzas.filter(s => !pairedIds.has(s.id));

  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-medium text-sm">{title}</h4>
        <button
          onClick={onAdd}
          className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
        >
          <FaPlus size={12} /> {locale('lyric_editor.add_stanza')}
        </button>
      </div>
      <div className="space-y-2">
        {unpaired.map(stanza => (
          <StanzaCard
            key={stanza.id}
            stanza={stanza}
            language={language}
            onTagChange={onTagChange}
            onContentChange={onContentChange}
            onDelete={onDelete}
            onMove={onMove}
            isSelected={selectedId === stanza.id}
            onSelect={() => onSelect(language, stanza.id)}
          />
        ))}
        {unpaired.length === 0 && (
          <p className="text-gray-500 text-xs text-center py-4">{locale('lyric_editor.no_tag')}</p>
        )}
      </div>
    </div>
  );
};

export default StepReview;
