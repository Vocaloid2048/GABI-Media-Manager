import React from 'react';
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

export const ColorMapTable = ({ selectedTags = [], onToggleColor }) => {
    const { locale } = useLanguage();

    return (
        <div className="mb-6">
            <h4 className="text-sm text-gray-400 mb-3 font-medium">{locale('filter.color')}</h4>
            <div className="space-y-4">
                {COLOR_CATEGORIES.map((category) => (
                    <div key={category.name} className="space-y-2">
                        <h5 className="text-xs text-gray-500 font-medium ml-1">{locale(category.name)}</h5>
                        <div 
                            className="flex overflow-x-auto pb-2 gap-2 custom-scrollbar"
                            onWheel={(e) => {
                                if (e.deltaY !== 0) {
                                    e.currentTarget.scrollLeft += e.deltaY;
                                }
                            }}
                        >
                            {category.keys.map((key) => {
                                const { color, label } = COLOR_MAP[key];
                                const isSelected = selectedTags.includes(label);
                                return (
                                    <button
                                        key={key}
                                        onClick={() => onToggleColor(label)}
                                        className={`flex items-center px-3 py-1.5 rounded-full border transition-colors shrink-0 ${
                                            isSelected 
                                            ? 'bg-blue-600/20 border-blue-500' 
                                            : 'bg-gray-700/50 border-transparent hover:bg-gray-700'
                                        }`}
                                    >
                                        <span 
                                            className="w-3 h-3 rounded-full mr-2 border border-gray-600 shrink-0"
                                            style={{ backgroundColor: color }}
                                        />
                                        <span className={`text-xs whitespace-nowrap ${isSelected ? 'text-blue-200' : 'text-gray-300'}`}>
                                            {locale(key)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
