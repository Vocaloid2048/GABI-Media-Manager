import React, { useState } from 'react';
import { useLanguage } from '../lang/LanguageContext';

export const COLOR_MAP = {
    "color.black": { color: "#000000", label: "黑色" },
    "color.dark_gray": { color: "#696969", label: "深灰色" },
    "color.gray": { color: "#808080", label: "灰色" },
    "color.silver": { color: "#c0c0c0", label: "銀色" },
    "color.light_gray": { color: "#d3d3d3", label: "淺灰色" },
    "color.white": { color: "#ffffff", label: "白色" },
    "color.slate_gray": { color: "#708090", label: "石板灰" },
    "color.dark_slate_gray": { color: "#2f4f4f", label: "暗石板灰" },
    "color.maroon": { color: "#800000", label: "栗色" },
    "color.dark_red": { color: "#8b0000", label: "深紅色" },
    "color.red": { color: "#ff0000", label: "紅色" },
    "color.firebrick": { color: "#b22222", label: "磚紅色" },
    "color.crimson": { color: "#dc143c", label: "猩紅" },
    "color.tomato": { color: "#ff6347", label: "番茄紅" },
    "color.coral": { color: "#ff7f50", label: "珊瑚紅" },
    "color.indian_red": { color: "#cd5c5c", label: "印度紅" },
    "color.deep_pink": { color: "#ff1493", label: "深粉紅" },
    "color.hot_pink": { color: "#ff69b4", label: "熱粉紅" },
    "color.pink": { color: "#ffc0cb", label: "粉紅色" },
    "color.light_pink": { color: "#ffb6c1", label: "淺粉紅" },
    "color.misty_rose": { color: "#ffe4e1", label: "霧玫瑰" },
    "color.orange_red": { color: "#ff4500", label: "紅橙色" },
    "color.dark_orange": { color: "#ff8c00", label: "深橙色" },
    "color.orange": { color: "#ffa500", label: "橙色" },
    "color.gold": { color: "#ffd700", label: "金色" },
    "color.yellow": { color: "#ffff00", label: "黃色" },
    "color.light_yellow": { color: "#ffffe0", label: "淺黃色" },
    "color.khaki": { color: "#f0e68c", label: "卡其色" },
    "color.moccasin": { color: "#ffe4b5", label: "鹿皮色" },
    "color.lemon_chiffon": { color: "#fffacd", label: "檸檬綢" },
    "color.saddle_brown": { color: "#8b4513", label: "馬鞍棕" },
    "color.sienna": { color: "#a0522d", label: "赭色" },
    "color.chocolate": { color: "#d2691e", label: "巧克力色" },
    "color.peru": { color: "#cd853f", label: "秘魯色" },
    "color.sandy_brown": { color: "#f4a460", label: "沙棕色" },
    "color.burlywood": { color: "#deb887", label: "硬木色" },
    "color.tan": { color: "#d2b48c", label: "棕褐色" },
    "color.beige": { color: "#f5f5dc", label: "米色" },
    "color.rosy_brown": { color: "#bc8f8f", label: "玫瑰褐" },
    "color.dark_green": { color: "#006400", label: "深綠色" },
    "color.green": { color: "#008000", label: "綠色" },
    "color.forest_green": { color: "#228b22", label: "森林綠" },
    "color.lime_green": { color: "#32cd32", label: "萊姆綠" },
    "color.lime": { color: "#00ff00", label: "萊姆色" },
    "color.yellow_green": { color: "#9acd32", label: "黃綠色" },
    "color.olive": { color: "#808000", label: "橄欖色" },
    "color.dark_olive_green": { color: "#556b2f", label: "深橄欖綠" },
    "color.sea_green": { color: "#2e8b57", label: "海綠色" },
    "color.lawn_green": { color: "#7cfc00", label: "草坪綠" },
    "color.teal": { color: "#008080", label: "藍綠色" },
    "color.dark_cyan": { color: "#008b8b", label: "深青色" },
    "color.turquoise": { color: "#40e0d0", label: "綠松石" },
    "color.cyan": { color: "#00ffff", label: "青色" },
    "color.aquamarine": { color: "#7fffd4", label: "海藍色" },
    "color.pale_turquoise": { color: "#afeeee", label: "蒼白綠松石" },
    "color.midnight_blue": { color: "#191970", label: "午夜藍" },
    "color.navy": { color: "#000080", label: "海軍藍" },
    "color.dark_blue": { color: "#00008b", label: "深藍色" },
    "color.medium_blue": { color: "#0000cd", label: "中藍色" },
    "color.blue": { color: "#0000ff", label: "藍色" },
    "color.royal_blue": { color: "#4169e1", label: "皇家藍" },
    "color.steel_blue": { color: "#4682b4", label: "鋼藍色" },
    "color.sky_blue": { color: "#87ceeb", label: "天藍色" },
    "color.light_blue": { color: "#add8e6", label: "淺藍色" },
    "color.powder_blue": { color: "#b0e0e6", label: "粉末藍" },
    "color.cornflower_blue": { color: "#6495ed", label: "矢車菊藍" },
    "color.indigo": { color: "#4b0082", label: "靛青色" },
    "color.purple": { color: "#800080", label: "紫色" },
    "color.dark_magenta": { color: "#8b008b", label: "深洋紅" },
    "color.blue_violet": { color: "#8a2be2", label: "藍紫色" },
    "color.medium_purple": { color: "#9370db", label: "中紫色" },
    "color.plum": { color: "#dda0dd", label: "李子色" },
    "color.violet": { color: "#ee82ee", label: "紫羅蘭" },
    "color.magenta": { color: "#ff00ff", label: "洋紅色" },
    "color.orchid": { color: "#da70d6", label: "蘭花色" },
    "color.thistle": { color: "#d8bfd8", label: "薊色" }
};

export const COLOR_CATEGORIES = [
    {
        name: "filter.color_category.grayscale",
        keys: ["color.black", "color.dark_gray", "color.gray", "color.silver", "color.light_gray", "color.white", "color.slate_gray", "color.dark_slate_gray"]
    },
    {
        name: "filter.color_category.red",
        keys: ["color.maroon", "color.dark_red", "color.red", "color.firebrick", "color.crimson", "color.tomato", "color.coral", "color.indian_red"]
    },
    {
        name: "filter.color_category.pink",
        keys: ["color.deep_pink", "color.hot_pink", "color.pink", "color.light_pink", "color.misty_rose"]
    },
    {
        name: "filter.color_category.orange",
        keys: ["color.orange_red", "color.dark_orange", "color.orange", "color.gold"]
    },
    {
        name: "filter.color_category.yellow",
        keys: ["color.yellow", "color.light_yellow", "color.khaki", "color.moccasin", "color.lemon_chiffon"]
    },
    {
        name: "filter.color_category.brown",
        keys: ["color.saddle_brown", "color.sienna", "color.chocolate", "color.peru", "color.sandy_brown", "color.burlywood", "color.tan", "color.beige", "color.rosy_brown"]
    },
    {
        name: "filter.color_category.green",
        keys: ["color.dark_green", "color.green", "color.forest_green", "color.lime_green", "color.lime", "color.yellow_green", "color.olive", "color.dark_olive_green", "color.sea_green", "color.lawn_green"]
    },
    {
        name: "filter.color_category.cyan",
        keys: ["color.teal", "color.dark_cyan", "color.turquoise", "color.cyan", "color.aquamarine", "color.pale_turquoise"]
    },
    {
        name: "filter.color_category.blue",
        keys: ["color.midnight_blue", "color.navy", "color.dark_blue", "color.medium_blue", "color.blue", "color.royal_blue", "color.steel_blue", "color.sky_blue", "color.light_blue", "color.powder_blue", "color.cornflower_blue"]
    },
    {
        name: "filter.color_category.purple",
        keys: ["color.indigo", "color.purple", "color.dark_magenta", "color.blue_violet", "color.medium_purple", "color.plum", "color.violet", "color.magenta", "color.orchid", "color.thistle"]
    }
];

// 簡單的 SVG ICON 組件
const ChevronDown = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

const ChevronRight = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);

const CheckIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-3 w-3 text-white drop-shadow-md"} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

export const ColorMapTable = ({ selectedTags = [], onToggleColor }) => {
    const { locale } = useLanguage();
    // 預設只展開前兩個分類 (黑白灰系 和 紅色系)
    const [expandedCategories, setExpandedCategories] = useState(
        COLOR_CATEGORIES.reduce((acc, cat, index) => ({ 
            ...acc, 
            [cat.name]: index < 1 
        }), {})
    );

    const toggleCategory = (catName) => {
        setExpandedCategories(prev => ({
            ...prev,
            [catName]: !prev[catName]
        }));
    };

    // 處理全選/全取消邏輯
    const handleBulkAction = (keys, isSelecting) => {
        keys.forEach(key => {
            const label = COLOR_MAP[key].label;
            const isCurrentlySelected = selectedTags.includes(label);
            // 如果是要選取且目前沒選，或者是要取消且目前有選，才觸發切換
            if ((isSelecting && !isCurrentlySelected) || (!isSelecting && isCurrentlySelected)) {
                onToggleColor(label);
            }
        });
    };

    return (
        <div className="mb-6 select-none">
            <h4 className="text-sm text-gray-400 mb-3 font-medium">{locale('filter.color')}</h4>
            <div className="space-y-4">
                {COLOR_CATEGORIES.map((category) => {
                    const isExpanded = expandedCategories[category.name];
                    
                    // 計算該分類下已選取的顏色數量
                    const activeCount = category.keys.filter(k => selectedTags.includes(COLOR_MAP[k].label)).length;
                    const isAllSelected = activeCount === category.keys.length;

                    return (
                        <div key={category.name} className="space-y-2 border-b border-gray-700/50 pb-2 last:border-0">
                            {/* 分類標題列 (可點擊摺疊) */}
                            <div className="flex items-center justify-between pr-2">
                                <button 
                                    onClick={() => toggleCategory(category.name)}
                                    className="flex items-center text-xs text-gray-400 font-medium hover:text-white transition-colors"
                                >
                                    <span className="mr-1">
                                        {isExpanded ? <ChevronDown /> : <ChevronRight />}
                                    </span>
                                    {locale(category.name)}
                                    {activeCount > 0 && !isExpanded && (
                                        <span className="ml-2 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                            {activeCount}
                                        </span>
                                    )}
                                </button>

                                {/* 全選/清除 小按鈕 (僅在展開時顯示) */}
                                {isExpanded && (
                                    <button
                                        onClick={() => handleBulkAction(category.keys, !isAllSelected)}
                                        className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors"
                                    >
                                        {isAllSelected ? "Clear" : "All"}
                                    </button>
                                )}
                            </div>

                            {/* 顏色列表 (動畫或條件渲染) */}
                            {isExpanded && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pl-1">
                                    {category.keys.map((key) => {
                                        const { color, label } = COLOR_MAP[key];
                                        const isSelected = selectedTags.includes(label);
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => onToggleColor(label)}
                                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors border ${
                                                    isSelected 
                                                    ? 'bg-blue-600 text-white border-blue-500' 
                                                    : 'bg-gray-700 text-gray-300 border-transparent hover:bg-gray-600'
                                                }`}
                                            >
                                                <div className="flex items-center overflow-hidden">
                                                    <span 
                                                        className="w-3 h-3 rounded-full mr-2 border border-gray-400/50 shrink-0"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                    <span className="truncate text-xs">{locale(key)}</span>
                                                </div>
                                                
                                                {isSelected && (
                                                    <CheckIcon className="ml-2 w-3 h-3 text-white shrink-0" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
