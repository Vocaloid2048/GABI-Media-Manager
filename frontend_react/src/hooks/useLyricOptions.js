import { useState, useEffect } from 'react';

const STORAGE_KEYS = {
  SPACING: 'lyricPage_spacing',
  ADD_BLANK_PAGE: 'lyricPage_addBlankPage',
  SELECTED_THEME: 'lyricPage_selectedTheme',
  LABEL_LANGUAGE: 'lyricPage_labelLanguage',
  ADD_TITLE_PAGE: 'lyricPage_addTitlePage',
  ADD_COPYRIGHT: 'lyricPage_addCopyright',
  SHOW_COPYRIGHT: 'lyricPage_showCopyright',
  COPYRIGHT_LANGUAGE: 'lyricPage_copyrightLanguage'
};

export function useLyricOptions() {
  const [spacing, setSpacing] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.SPACING) || '1'
  );

  const [addBlankPage, setAddBlankPage] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADD_BLANK_PAGE);
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [selectedTheme, setSelectedTheme] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.SELECTED_THEME) || ''
  );

  const [labelLanguage, setLabelLanguage] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.LABEL_LANGUAGE) || 'zh_hk'
  );

  const [addTitlePage, setAddTitlePage] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADD_TITLE_PAGE);
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [addCopyright, setAddCopyright] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADD_COPYRIGHT);
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [showCopyright, setShowCopyright] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOW_COPYRIGHT);
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [copyrightLanguage, setCopyrightLanguage] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.COPYRIGHT_LANGUAGE) || 'zh_hk'
  );

  // 保存到 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SPACING, spacing);
  }, [spacing]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADD_BLANK_PAGE, JSON.stringify(addBlankPage));
  }, [addBlankPage]);

  useEffect(() => {
    if (selectedTheme) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_THEME, selectedTheme);
    }
  }, [selectedTheme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LABEL_LANGUAGE, labelLanguage);
  }, [labelLanguage]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADD_TITLE_PAGE, JSON.stringify(addTitlePage));
  }, [addTitlePage]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADD_COPYRIGHT, JSON.stringify(addCopyright));
  }, [addCopyright]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHOW_COPYRIGHT, JSON.stringify(showCopyright));
  }, [showCopyright]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COPYRIGHT_LANGUAGE, copyrightLanguage);
  }, [copyrightLanguage]);

  return {
    spacing,
    setSpacing,
    addBlankPage,
    setAddBlankPage,
    selectedTheme,
    setSelectedTheme,
    labelLanguage,
    setLabelLanguage,
    addTitlePage,
    setAddTitlePage,
    addCopyright,
    setAddCopyright,
    showCopyright,
    setShowCopyright,
    copyrightLanguage,
    setCopyrightLanguage
  };
}