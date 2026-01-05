import React from 'react';
import { useLanguage } from '../lang/LanguageContext';

const TagTypeEnum = {
    風格: "#ffc8aa",
    景色: "#d4edbc",
    天氣: "#bfe1f6",
    角度: "#e6cff2",
}

const TagClip = ({ tagData }) => {
    const { language } = useLanguage();
    const tagName = language === 'zh' ? tagData.tag_zh_name : (tagData.tag_en_name || tagData.tag_zh_name);

    return (
        <div className="inline-block mr-2 mb-2">
            <span 
                className="text-xs font-medium px-3 py-1 rounded-full text-black"
                style={{ backgroundColor: TagTypeEnum[tagData.tag_type] || '#777777' }}
            >
                {tagName}
            </span>
        </div>
    )
}

export default TagClip;
