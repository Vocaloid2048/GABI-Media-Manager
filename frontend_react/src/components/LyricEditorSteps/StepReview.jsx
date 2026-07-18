import React, { useState } from 'react';
import { Reorder, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTrash, FaGripLines } from 'react-icons/fa';
import { useLanguage } from '../../lang/LanguageContext';
import { GROUP_LABEL_LIST } from '../../constants/lyrics';

const TAG_OPTIONS = Object.entries(GROUP_LABEL_LIST).map(([key, val]) => ({
  key,
  label: val.zh_hk || val.en
}));

const StepReview = ({ data, onChange, onNext, onPrev }) => {
  const { locale } = useLanguage();
  const [activePairId, setActivePairId] = useState(null);

  const zhMap = new Map((data.zhStanzas || []).map(s => [s.id, s]));
  const enMap = new Map((data.enStanzas || []).map(s => [s.id, s]));

  // 拖動重排
  const handleReorder = (newOrder) => {
    onChange({ pairings: newOrder });
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

  // 刪除配對（連帶刪除關聯的 stanzas）
  const handleDeletePair = (pairId) => {
    const pair = data.pairings.find(p => p.id === pairId);
    if (!pair) return;

    const updatedZh = data.zhStanzas.filter(s => s.id !== pair.zhId);
    const updatedEn = data.enStanzas.filter(s => s.id !== pair.enId);
    const updatedPairings = data.pairings.filter(p => p.id !== pairId);

    onChange({
      zhStanzas: updatedZh,
      enStanzas: updatedEn,
      pairings: updatedPairings
    });
  };

  // 添加新配對（左右都是空的 stanzas）
  const handleAddPair = () => {
    const zhId = `zh_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const enId = `en_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const pairId = `pair_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    onChange({
      zhStanzas: [...(data.zhStanzas || []), { id: zhId, content: '', tag: null, order: data.zhStanzas?.length || 0 }],
      enStanzas: [...(data.enStanzas || []), { id: enId, content: '', tag: null, order: data.enStanzas?.length || 0 }],
      pairings: [...(data.pairings || []), { id: pairId, type: 'pair', zhId, enId }]
    });

    // 自動滾動到新項目
    setTimeout(() => setActivePairId(pairId), 50);
  };

  const hasPairings = (data.pairings?.length || 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">{locale('lyric_editor.review_pairing')}</h3>
        <p className="text-gray-400 text-xs">{locale('lyric_editor.drag_to_reorder_pairs')}</p>
      </div>

      {/* 空數據提示 */}
      {!hasPairings && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
          <p className="text-yellow-400 text-sm">{locale('lyric_editor.please_enter_at_least_one')}</p>
        </div>
      )}

      {/* 統一配對列表（Reorder.Group） */}
      {hasPairings && (
        <div className="bg-gray-800/50 rounded-lg p-4">
          <Reorder.Group axis="y" values={data.pairings || []} onReorder={handleReorder} className="space-y-3">
            <AnimatePresence>
              {(data.pairings || []).map((pair, index) => {
                const zhStanza = zhMap.get(pair.zhId);
                const enStanza = enMap.get(pair.enId);
                if (!zhStanza && !enStanza) return null;

                const isActive = activePairId === pair.id;
                const hasZhContent = zhStanza?.content?.trim();
                const hasEnContent = enStanza?.content?.trim();

                return (
                  <Reorder.Item
                    key={pair.id}
                    value={pair}
                    className={`bg-gray-700 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all ${
                      isActive ? 'border-blue-500' : 'border-gray-600'
                    }`}
                  >
                    <div className="p-3">
                      {/* 頂部信息欄 */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="text-gray-400">
                            <FaGripLines size={14} />
                          </div>
                          <span className="text-xs text-gray-400">#{index + 1}</span>
                          <select
                            value={zhStanza?.tag || enStanza?.tag || ''}
                            onChange={(e) => {
                              const tag = e.target.value || null;
                              if (zhStanza) handleTagChange('zh', zhStanza.id, tag);
                              if (enStanza) handleTagChange('en', enStanza.id, tag);
                            }}
                            className="bg-gray-600 text-white text-xs px-2 py-1 rounded border border-gray-500"
                          >
                            <option value="">{locale('lyric_editor.no_tag')}</option>
                            {TAG_OPTIONS.map(opt => (
                              <option key={opt.key} value={opt.key}>{opt.label}</option>
                            ))}
                          </select>
                          {!hasZhContent && !hasEnContent && (
                            <span className="text-xs text-yellow-400">({locale('lyric_editor.empty_stanza')})</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeletePair(pair.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title={locale('lyric_editor.delete')}
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>

                      {/* 左右兩欄 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* 中文欄 */}
                        <div className={`bg-gray-800 rounded-lg p-2 border ${hasEnContent && !hasZhContent ? 'border-cyan-500/30 opacity-70' : 'border-cyan-500/30'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-cyan-400 text-xs font-medium">{locale('lyric_editor.zh')}</span>
                            {!hasZhContent && hasEnContent && (
                              <span className="text-yellow-400 text-xs">{locale('lyric_editor.empty_stanza')}</span>
                            )}
                          </div>
                          <textarea
                            value={zhStanza?.content || ''}
                            onChange={(e) => {
                              if (zhStanza) handleContentChange('zh', zhStanza.id, e.target.value);
                            }}
                            className="w-full bg-gray-900/50 text-white text-sm rounded px-2 py-1 border border-gray-700 focus:outline-none focus:border-blue-500 resize-none"
                            rows={3}
                            placeholder={locale('lyric_editor.zh_placeholder')}
                          />
                        </div>

                        {/* 英文欄 */}
                        <div className={`bg-gray-800 rounded-lg p-2 border ${hasZhContent && !hasEnContent ? 'border-pink-500/30 opacity-70' : 'border-pink-500/30'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-pink-400 text-xs font-medium">{locale('lyric_editor.en')}</span>
                            {!hasEnContent && hasZhContent && (
                              <span className="text-yellow-400 text-xs">{locale('lyric_editor.empty_stanza')}</span>
                            )}
                          </div>
                          <textarea
                            value={enStanza?.content || ''}
                            onChange={(e) => {
                              if (enStanza) handleContentChange('en', enStanza.id, e.target.value);
                            }}
                            className="w-full bg-gray-900/50 text-white text-sm rounded px-2 py-1 border border-gray-700 focus:outline-none focus:border-blue-500 resize-none"
                            rows={3}
                            placeholder={locale('lyric_editor.en_placeholder')}
                          />
                        </div>
                      </div>
                    </div>
                  </Reorder.Item>
                );
              })}
            </AnimatePresence>
          </Reorder.Group>
        </div>
      )}

      {/* 添加配對按鈕 */}
      <button
        onClick={handleAddPair}
        className="w-full bg-gray-700 hover:bg-gray-600 text-blue-400 border border-blue-500/30 rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <FaPlus size={12} /> {locale('lyric_editor.add_pair')}
      </button>

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

export default StepReview;
