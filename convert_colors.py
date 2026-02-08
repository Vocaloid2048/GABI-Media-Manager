# -*- coding: utf-8 -*-
import json

raw_map = {
    # --- 黑色/灰色/白色系 ---
    '黑色': '#000000',
    '深灰色': '#696969',
    '灰色': '#808080',
    '銀色': '#c0c0c0',
    '淺灰色': '#d3d3d3',
    '白色': '#ffffff',
    '石板灰': '#708090',
    '暗石板灰': '#2f4f4f',

    # --- 紅色系 ---
    '栗色': '#800000',
    '深紅色': '#8b0000',
    '紅色': '#ff0000',
    '磚紅色': '#b22222',
    '猩紅': '#dc143c',
    '番茄紅': '#ff6347',
    '珊瑚紅': '#ff7f50',
    '印度紅': '#cd5c5c',

    # --- 粉色系 ---
    '深粉紅': '#ff1493',
    '熱粉紅': '#ff69b4',
    '粉紅色': '#ffc0cb',
    '淺粉紅': '#ffb6c1',
    '霧玫瑰': '#ffe4e1',

    # --- 橙色系 ---
    '紅橙色': '#ff4500',
    '深橙色': '#ff8c00',
    '橙色': '#ffa500',
    '金色': '#ffd700',

    # --- 黃色系 ---
    '黃色': '#ffff00',
    '淺黃色': '#ffffe0',
    '卡其色': '#f0e68c',
    '鹿皮色': '#ffe4b5',
    '檸檬綢': '#fffacd',

    # --- 棕色系 ---
    '馬鞍棕': '#8b4513',
    '赭色': '#a0522d',
    '巧克力色': '#d2691e',
    '秘魯色': '#cd853f',
    '沙棕色': '#f4a460',
    '硬木色': '#deb887',
    '棕褐色': '#d2b48c',
    '米色': '#f5f5dc',
    '玫瑰褐': '#bc8f8f',

    # --- 綠色系 ---
    '深綠色': '#006400',
    '綠色': '#008000',
    '森林綠': '#228b22',
    '萊姆綠': '#32cd32',
    '萊姆色': '#00ff00',
    '黃綠色': '#9acd32',
    '橄欖色': '#808000',
    '深橄欖綠': '#556b2f',
    '海綠色': '#2e8b57',
    '草坪綠': '#7cfc00',

    # --- 青色/藍綠色系 ---
    '藍綠色': '#008080',
    '深青色': '#008b8b',
    '綠松石': '#40e0d0',
    '青色': '#00ffff',
    '海藍色': '#7fffd4',
    '蒼白綠松石': '#afeeee',

    # --- 藍色系 ---
    '午夜藍': '#191970',
    '海軍藍': '#000080',
    '深藍色': '#00008b',
    '中藍色': '#0000cd',
    '藍色': '#0000ff',
    '皇家藍': '#4169e1',
    '鋼藍色': '#4682b4',
    '天藍色': '#87ceeb',
    '淺藍色': '#add8e6',
    '粉末藍': '#b0e0e6',
    '矢車菊藍': '#6495ed',

    # --- 紫色系 ---
    '靛青色': '#4b0082',
    '紫色': '#800080',
    '深洋紅': '#8b008b',
    '藍紫色': '#8a2be2',
    '中紫色': '#9370db',
    '李子色': '#dda0dd',
    '紫羅蘭': '#ee82ee',
    '洋紅色': '#ff00ff',
    '蘭花色': '#da70d6',
    '薊色': '#d8bfd8',
}

# Simple mapping for English names (approximate)
zh_to_en = {
    '黑色': 'Black', '深灰色': 'Dark Gray', '灰色': 'Gray', '銀色': 'Silver', '淺灰色': 'Light Gray', '白色': 'White', '石板灰': 'Slate Gray', '暗石板灰': 'Dark Slate Gray',
    '栗色': 'Maroon', '深紅色': 'Dark Red', '紅色': 'Red', '磚紅色': 'Firebrick', '猩紅': 'Crimson', '番茄紅': 'Tomato', '珊瑚紅': 'Coral', '印度紅': 'Indian Red',
    '深粉紅': 'Deep Pink', '熱粉紅': 'Hot Pink', '粉紅色': 'Pink', '淺粉紅': 'Light Pink', '霧玫瑰': 'Misty Rose',
    '紅橙色': 'Orange Red', '深橙色': 'Dark Orange', '橙色': 'Orange', '金色': 'Gold',
    '黃色': 'Yellow', '淺黃色': 'Light Yellow', '卡其色': 'Khaki', '鹿皮色': 'Moccasin', '檸檬綢': 'Lemon Chiffon',
    '馬鞍棕': 'Saddle Brown', '赭色': 'Sienna', '巧克力色': 'Chocolate', '秘魯色': 'Peru', '沙棕色': 'Sandy Brown', '硬木色': 'Burlywood', '棕褐色': 'Tan', '米色': 'Beige', '玫瑰褐': 'Rosy Brown',
    '深綠色': 'Dark Green', '綠色': 'Green', '森林綠': 'Forest Green', '萊姆綠': 'Lime Green', '萊姆色': 'Lime', '黃綠色': 'Yellow Green', '橄欖色': 'Olive', '深橄欖綠': 'Dark Olive Green', '海綠色': 'Sea Green', '草坪綠': 'Lawn Green',
    '藍綠色': 'Teal', '深青色': 'Dark Cyan', '綠松石': 'Turquoise', '青色': 'Cyan', '海藍色': 'Aquamarine', '蒼白綠松石': 'Pale Turquoise',
    '午夜藍': 'Midnight Blue', '海軍藍': 'Navy', '深藍色': 'Dark Blue', '中藍色': 'Medium Blue', '藍色': 'Blue', '皇家藍': 'Royal Blue', '鋼藍色': 'Steel Blue', '天藍色': 'Sky Blue', '淺藍色': 'Light Blue', '粉末藍': 'Powder Blue', '矢車菊藍': 'Cornflower Blue',
    '靛青色': 'Indigo', '紫色': 'Purple', '深洋紅': 'Dark Magenta', '藍紫色': 'Blue Violet', '中紫色': 'Medium Purple', '李子色': 'Plum', '紫羅蘭': 'Violet', '洋紅色': 'Magenta', '蘭花色': 'Orchid', '薊色': 'Thistle'
}

new_map = {}
zh_trans = {}
en_trans = {}

for zh_name, hex_val in raw_map.items():
    en_name = zh_to_en.get(zh_name, zh_name)
    key = 'color.' + en_name.lower().replace(' ', '_')
    
    new_map[key] = hex_val
    
    zh_trans[key] = zh_name
    en_trans[key] = en_name

print("NEW_MAP_JSON:")
print(json.dumps(new_map, indent=4, ensure_ascii=False))
print("\nZH_TRANS_JSON:")
print(json.dumps(zh_trans, indent=4, ensure_ascii=False))
print("\nEN_TRANS_JSON:")
print(json.dumps(en_trans, indent=4, ensure_ascii=False))
