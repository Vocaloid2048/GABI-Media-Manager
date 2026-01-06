import React, { useState } from 'react';
import { useLanguage } from '../lang/LanguageContext';

export const COLOR_CATEGORIES = {
    "filter.color_category.grayscale": ["#000000", "#808080", "#ffffff"],
    "filter.color_category.red": ["#ff0000", "#8b0000", "#ff6347"],
    "filter.color_category.pink": ["#ff1493", "#ffc0cb", "#ffe4e1"],
    "filter.color_category.orange": ["#ffa500", "#ff4500", "#ffd700"],
    "filter.color_category.yellow": ["#ffff00", "#f0e68c", "#fffacd"],
    "filter.color_category.brown": ["#8b4513", "#d2691e", "#f5f5dc"],
    "filter.color_category.green": ["#008000", "#32cd32", "#556b2f"],
    "filter.color_category.cyan": ["#00ffff", "#008080", "#7fffd4"],
    "filter.color_category.blue": ["#0000ff", "#000080", "#87ceeb"],
    "filter.color_category.purple": ["#800080", "#ee82ee", "#4b0082"]
};

// Recreated COLOR_MAP for compatibility with DetailPage and other consumers
// This maps each of the 30 colors back to a structure compatible with the old COLOR_MAP
export const COLOR_MAP = {};
Object.entries(COLOR_CATEGORIES).forEach(([catKey, colors]) => {
    colors.forEach(color => {
         // Generate a key (e.g., color_ff0000)
         const key = `color_${color.replace('#', '')}`;
         COLOR_MAP[key] = {
             color: color,
             // Use category name as label key since we don't have individual color names anymore
             label: catKey 
         };
    });
});


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
    
    return (
        <div className="mb-6 select-none">
            <h4 className="text-sm text-gray-400 mb-3 font-medium">{locale('filter.colors')}</h4>
            <div className="grid grid-cols-2 gap-3">
                {Object.entries(COLOR_CATEGORIES).map(([catKey, colors]) => {
                    const isSelected = colors.every(c => selectedTags.includes(c));
                    const mainColor = colors[0];

                    const handleClick = () => {
                        const allSelected = colors.every(c => selectedTags.includes(c));
                        
                        if (allSelected) {
                            // Cancel: Remove all colors in this category
                            colors.forEach(c => {
                                if (selectedTags.includes(c)) onToggleColor(c);
                            });
                        } else {
                            // Select: Add all missing colors in this category
                            colors.forEach(c => {
                                if (!selectedTags.includes(c)) onToggleColor(c);
                            });
                        }
                    };

                    return (
                        <button
                            key={catKey}
                            onClick={handleClick}
                            className={`flex flex-col items-start p-3 rounded-xl border transition-all ${
                                isSelected
                                ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500'
                                : 'bg-gray-700/30 border-gray-700 hover:bg-gray-700 hover:border-gray-500'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-2 w-full">
                                <div
                                    className="w-4 h-4 rounded-full border border-gray-500 shadow-sm shrink-0"
                                    style={{ backgroundColor: mainColor }}
                                />
                                <span className={`text-sm font-bold truncate ${isSelected ? 'text-blue-100' : 'text-gray-300'}`}>
                                    {locale(catKey)}
                                </span>
                            </div>
                            <div className="flex gap-1.5 ml-1">
                                {colors.map((c, i) => (
                                    <div
                                        key={i}
                                        className="w-3 h-3 rounded-full border border-gray-600 shadow-sm"
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
