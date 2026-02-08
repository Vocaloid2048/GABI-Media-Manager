const SongLanguageLabels = {
  Mandarin: { label: '國語', color: '#FF6B6B', localeKey: 'song.language.mandarin' },
  English: { label: '英語', color: '#4ECDC4', localeKey: 'song.language.english' },
  Cantonese: { label: '粵語', color: '#45B7D1', localeKey: 'song.language.cantonese' },
  Taiwanese: { label: '台語', color: '#96CEB4', localeKey: 'song.language.taiwanese' },
  Other: { label: '其他', color: '#FFEAA7', localeKey: 'song.language.other' }
};

const SongTagTypeEnum = {
  '敬拜讚美': { color: "#8783dc", localeKey: 'song.filter.worship' },
  '其他類別': { color: "#5585bf", localeKey: 'song.filter.other' },
};

const getSongTagListLocale = (tagList, songTagList, language,locale) => {
  if (tagList == null || tagList.length === 0 || typeof tagList !== "string") return [];
  return tagList.split(",").map(tagId => {
    const tagInfo = songTagList.find(t => t.tag_id.toString() === tagId);
    const langInfo = SongLanguageLabels[tagId];
    return tagInfo ? { tag: language === 'zh' ? tagInfo.tag_zh_name : tagInfo.tag_en_name, color: SongTagTypeEnum[tagInfo.tag_type]?.color || '#777777' } : langInfo ? { tag: locale(langInfo.localeKey), color: langInfo.color } : { tag: tagId, color: '#777777' };
  });
}

export { SongLanguageLabels, SongTagTypeEnum, getSongTagListLocale };