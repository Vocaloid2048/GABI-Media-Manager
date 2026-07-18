import React, { useState, useMemo } from 'react';
import { FaDownload, FaArrowLeft, FaCheck } from 'react-icons/fa';
import { useLanguage } from '../../lang/LanguageContext';
import { generateDs } from '../../utils/auth';
import { GROUP_LABEL_LIST } from '../../constants/lyrics';
import { useLyricOptions } from '../../hooks/useLyricOptions';
import LyricItem from '../LyricItem';

const StepPreview = ({ data, onChange, onPrev, onComplete }) => {
  const { locale } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);
  const [themes, setThemes] = useState([]);
  const [showCopyrightEdit, setShowCopyrightEdit] = useState(false);
  const [draggedSlide, setDraggedSlide] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  const {
    spacing, setSpacing,
    addBlankPage, setAddBlankPage,
    selectedTheme, setSelectedTheme,
    labelLanguage, setLabelLanguage,
    addTitlePage, setAddTitlePage,
    showCopyright, setShowCopyright,
    copyrightLanguage, setCopyrightLanguage
  } = useLyricOptions();

  // 获取主题列表
  React.useEffect(() => {
    const fetchThemes = async () => {
      try {
        const response = await fetch('/api/song/themes');
        const data = await response.json();
        if (data.retcode === 1) {
          setThemes(data.data);
        }
      } catch (error) {
        console.error('Error fetching themes:', error);
      }
    };
    fetchThemes();
  }, []);

  // 获取Label的显示名称和颜色
  const getLabelDisplay = (slide) => {
    const upperLabel = slide.tag ? slide.tag.toUpperCase().replace(/\s+/g, '') : '';
    const effectiveLabel = (data.useIntroAsLabel && slide.is_title)
      ? 'INTRO'
      : upperLabel;
    const groupInfo = GROUP_LABEL_LIST[effectiveLabel];
    if (!groupInfo) {
      return { colorHex: '#777777', labelName: slide.tag || 'Unknown' };
    }
    let labelName;
    switch (labelLanguage) {
      case 'zh_cn': labelName = groupInfo.zh_cn || groupInfo.en || slide.tag; break;
      case 'en': labelName = groupInfo.en || slide.tag; break;
      case 'zh_hk': default: labelName = groupInfo.zh_hk || groupInfo.en || slide.tag; break;
    }
    return { colorHex: groupInfo.colorHex, labelName };
  };

  // 生成 CCLI 信息
  const ccliInfo = useMemo(() => {
    const copyright = data.copyright || {};
    const authorParts = [];
    const labels = {
      composer: { en: "Composer: ", zh_cn: "作曲：", zh_hk: "作曲：" },
      lyricist: { en: "Lyricist: ", zh_cn: "填词：", zh_hk: "填詞：" },
      arranger: { en: "Arranger: ", zh_cn: "编曲：", zh_hk: "編曲：" }
    };
    if (copyright.composer && copyright.composer.trim()) {
      authorParts.push(`${labels.composer[copyrightLanguage] || labels.composer.en}${copyright.composer.trim()}`);
    }
    if (copyright.lyricist && copyright.lyricist.trim()) {
      authorParts.push(`${labels.lyricist[copyrightLanguage] || labels.lyricist.en}${copyright.lyricist.trim()}`);
    }
    if (copyright.arranger && copyright.arranger.trim()) {
      authorParts.push(`${labels.arranger[copyrightLanguage] || labels.arranger.en}${copyright.arranger.trim()}`);
    }
    return {
      songTitle: data.songName || '',
      author: authorParts.join('\n'),
      publisher: copyright.publisher || '',
      copyrightYear: copyright.year || ''
    };
  }, [data.copyright, data.songName, copyrightLanguage]);

  // 处理所有 slides（包含标题页和空白页）
  const allSlides = useMemo(() => {
    if (!data.slides || !Array.isArray(data.slides)) return [];

    let slides = data.slides.map((slide, idx) => ({
      ...slide,
      _displayIdx: idx + 1
    }));

    const fixed = [];

    // 标题页固定在最前面
    if (addTitlePage) {
      fixed.unshift({
        id: 'fixed_title',
        is_title: true,
        content: data.songName || "Title",
        tag: 'TAG',
        fixed: true
      });
    }

    // 空白页固定在最后面
    if (addBlankPage) {
      fixed.push({
        id: 'fixed_blank',
        tag: 'BLANK',
        content: '',
        fixed: true
      });
    }

    return { movableSlides: slides, fixedSlides: fixed };
  }, [data.slides, data.songName, addBlankPage, addTitlePage]);

  // 拖拽处理
  const handleDragStart = (e, slide) => {
    if (slide.fixed) return;
    setDraggedSlide(slide);
    e.dataTransfer.effectAllowed = 'move';
    // 设置拖拽图像（可选）
    if (e.dataTransfer.setDragImage) {
      const ghost = document.createElement('div');
      ghost.style.width = '200px';
      ghost.style.height = '100px';
      ghost.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
      ghost.style.border = '2px dashed #3b82f6';
      ghost.style.borderRadius = '8px';
      ghost.style.position = 'fixed';
      ghost.style.top = '-1000px';
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 100, 50);
      setTimeout(() => document.body.removeChild(ghost), 0);
    }
  };

  const handleDragOver = (e, slide) => {
    e.preventDefault();
    if (!draggedSlide || draggedSlide.id === slide.id || slide.fixed) return;
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(slide);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e, targetSlide) => {
    e.preventDefault();
    if (!draggedSlide || draggedSlide.id === targetSlide.id || targetSlide.fixed) {
      setDraggedSlide(null);
      setDropTarget(null);
      return;
    }

    const movableSlides = allSlides.movableSlides;
    const fromIdx = movableSlides.findIndex(s => s.id === draggedSlide.id);
    const toIdx = movableSlides.findIndex(s => s.id === targetSlide.id);

    if (fromIdx === -1 || toIdx === -1) {
      setDraggedSlide(null);
      setDropTarget(null);
      return;
    }

    // 移动元素到新位置
    const newMovableSlides = [...movableSlides];
    const [moved] = newMovableSlides.splice(fromIdx, 1);
    newMovableSlides.splice(toIdx, 0, moved);

    // 重新分配 page 编号
    const reordered = newMovableSlides.map((s, i) => ({
      ...s,
      page: i + 1,
      _displayIdx: i + 1
    }));

    // 更新 data.slides（去掉内部属性）
    const updatedSlides = reordered.map(({ _displayIdx, ...rest }) => rest);
    onChange({ slides: updatedSlides });

    setDraggedSlide(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDraggedSlide(null);
    setDropTarget(null);
  };

  // 生成完整的显示列表（固定项 + 可移动项）
  const displaySlides = [
    ...allSlides.fixedSlides.filter(s => s.is_title),
    ...allSlides.movableSlides,
    ...allSlides.fixedSlides.filter(s => s.tag === 'BLANK')
  ];

  // 下载处理
  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const userId = localStorage.getItem('user_id');
      const ds = generateDs(userId);
      if (!ds) {
        alert(locale('auth.ds_generation_failed'));
        setIsGenerating(false);
        return;
      }
      const response = await fetch(`/api/tool/lyric-editor/generate-pro?user_id=${userId}&ds=${encodeURIComponent(ds)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songName: data.songName,
          slides: data.slides,
          copyright: data.copyright,
          theme: selectedTheme + "_Theme",
          labelLanguage,
          spacing,
          addTitlePage,
          addBlankPage,
          showCopyright,
          copyrightLanguage,
          useIntroAsLabel: data.useIntroAsLabel || false
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.songName}.pro`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert(locale('song.download_failed'));
      }
    } catch (error) {
      console.error('Download error:', error);
      alert(locale('song.download_failed'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 选项栏 */}
      <div className="p-4 bg-gray-800 rounded-lg">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-white text-sm">{locale('lyrics.spacing')}</label>
            <select value={spacing} onChange={(e) => setSpacing(e.target.value)} className="bg-gray-700 text-white px-3 py-1 rounded text-sm">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="tab">Tab</option>
            </select>
          </div>
          <div className="w-px h-6 bg-gray-600"></div>
          <div className="flex items-center gap-2">
            <label className="text-white text-sm">{locale('lyrics.theme')}</label>
            <select value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)} className="bg-gray-700 text-white px-3 py-1 rounded text-sm">
              {themes.map((theme) => (
                <option key={theme} value={theme}>{theme}</option>
              ))}
            </select>
          </div>
          <div className="w-px h-6 bg-gray-600"></div>
          <div className="flex items-center gap-2">
            <label className="text-white text-sm">{locale('lyrics.label_language')}</label>
            <select value={labelLanguage} onChange={(e) => setLabelLanguage(e.target.value)} className="bg-gray-700 text-white px-3 py-1 rounded text-sm">
              <option value="zh_cn">簡體中文</option>
              <option value="zh_hk">繁體中文</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="w-px h-6 bg-gray-600"></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="addTitlePage" checked={addTitlePage} onChange={(e) => setAddTitlePage(e.target.checked)} className="w-4 h-4" />
            <label htmlFor="addTitlePage" className="text-white text-sm">{locale('lyrics.add_title_page')}</label>
          </div>
          <div className="w-px h-6 bg-gray-600"></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="addBlankPage" checked={addBlankPage} onChange={(e) => setAddBlankPage(e.target.checked)} className="w-4 h-4" />
            <label htmlFor="addBlankPage" className="text-white text-sm">{locale('lyrics.add_blank_page')}</label>
          </div>
          <div className="w-px h-6 bg-gray-600"></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="showCopyright" checked={showCopyright} onChange={(e) => setShowCopyright(e.target.checked)} className="w-4 h-4" />
            <label htmlFor="showCopyright" className="text-white text-sm">{locale('lyrics.show_copyright')}</label>
          </div>
          <div className="w-px h-6 bg-gray-600"></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="useIntroAsLabel" checked={data.useIntroAsLabel || false} onChange={(e) => onChange({ useIntroAsLabel: e.target.checked })} className="w-4 h-4" />
            <label htmlFor="useIntroAsLabel" className="text-white text-sm">{locale('lyric_editor.use_intro_as_label')}</label>
          </div>
        </div>
      </div>

      {/* 排版模式选择 */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h4 className="text-white font-medium text-sm mb-3">{locale('lyric_editor.layout_mode')}</h4>
        <div className="flex flex-wrap gap-3">
          {[
            { key: 'interleave', label: locale('lyric_editor.layout_interleave') },
            { key: 'top-bottom', label: locale('lyric_editor.layout_top_bottom') },
            { key: 'center-split', label: locale('lyric_editor.layout_center_split') }
          ].map(mode => (
            <button
              key={mode.key}
              onClick={() => onChange({ layoutMode: mode.key })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                data.layoutMode === mode.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {mode.label}
            </button>
          ))}
          <button
            onClick={() => onChange({ layoutSwap: !data.layoutSwap })}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              data.layoutSwap
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {locale('lyric_editor.layout_swap')}
          </button>
        </div>
      </div>

      {/* 版权信息 */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white font-medium text-sm">{locale('lyric_editor.copyright_title')}</h4>
          <button
            onClick={() => setShowCopyrightEdit(!showCopyrightEdit)}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            {showCopyrightEdit ? locale('common.close') : locale('lyric_editor.copyright_edit')}
          </button>
        </div>
        {showCopyrightEdit && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {['composer', 'lyricist', 'arranger', 'publisher', 'year', 'album'].map(field => (
              <div key={field}>
                <label className="text-gray-400 text-xs block mb-1">{locale(`song.${field}`)}</label>
                <input
                  type={field === 'year' ? 'number' : 'text'}
                  value={data.copyright?.[field] || ''}
                  onChange={(e) => onChange({
                    copyright: { ...data.copyright, [field]: e.target.value }
                  })}
                  className="w-full bg-gray-700 text-white px-3 py-1.5 rounded text-sm border border-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder={locale(`song.${field}_placeholder`)}
                />
              </div>
            ))}
          </div>
        )}
        {!showCopyrightEdit && (
          <div className="text-gray-400 text-sm">
            {data.copyright?.composer && <span>作曲：{data.copyright.composer} </span>}
            {data.copyright?.lyricist && <span>填詞：{data.copyright.lyricist} </span>}
            {data.copyright?.arranger && <span>編曲：{data.copyright.arranger} </span>}
            {data.copyright?.publisher && <span>出版：{data.copyright.publisher} </span>}
            {data.copyright?.year && <span>年份：{data.copyright.year} </span>}
            {!data.copyright?.composer && !data.copyright?.lyricist && !data.copyright?.arranger && !data.copyright?.publisher && !data.copyright?.year && (
              <span className="text-gray-500">尚未設定版權資訊</span>
            )}
          </div>
        )}
      </div>

      {/* 预览与排列 - Grid 卡片 + 拖拽 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white font-medium text-sm">{locale('lyric_editor.preview_title')}</h4>
          <p className="text-gray-400 text-xs">{locale('lyric_editor.drag_to_reorder')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displaySlides.map((slide, index) => {
            const tagInfo = getLabelDisplay(slide);
            const isFixed = slide.fixed;
            const isDragged = draggedSlide?.id === slide.id;
            const isDropTarget = dropTarget?.id === slide.id && !isFixed;

            // 为 LyricItem 准备 slide 数据
            const lyricItemSlide = {
              content: slide.content || '',
              page: isFixed ? (slide.is_title ? '封面' : '尾頁') : (slide._displayIdx || slide.page || index + 1),
              tag: slide.tag
            };

            return (
              <div
                key={slide.id || index}
                draggable={!isFixed}
                onDragStart={(e) => handleDragStart(e, slide)}
                onDragOver={(e) => handleDragOver(e, slide)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, slide)}
                onDragEnd={handleDragEnd}
                className={`transition-all ${
                  isFixed ? 'opacity-75' :
                  isDragged ? 'opacity-40' :
                  isDropTarget ? 'scale-105' :
                  ''
                } ${!isFixed ? 'cursor-move' : ''}`}
              >
                <LyricItem
                  slide={lyricItemSlide}
                  tagInfo={tagInfo}
                  ccli={ccliInfo}
                  isTitlePage={slide.is_title}
                  showCopyright={showCopyright}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部导航 */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-700">
        <button
          onClick={onPrev}
          className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <FaArrowLeft size={14} /> {locale('lyric_editor.prev_step')}
        </button>
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
          >
            <FaDownload size={14} />
            {isGenerating ? locale('common.processing') : locale('lyric_editor.download_pro')}
          </button>
          <button
            onClick={onComplete}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
          >
            <FaCheck size={14} /> {locale('lyric_editor.complete')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepPreview;
