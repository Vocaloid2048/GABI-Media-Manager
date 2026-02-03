import { TagTypeEnum } from '../components/TagClip';
import { SongLanguageLabels } from './songLang';

export const FILTER_CONFIGS = {
  video: {
    tagGrouping: 'enum', // 使用 TagTypeEnum
    hasColorMap: true,
    hasLanguage: false,
    languageLabels: null,
  },
  song: {
    tagGrouping: 'type', // 使用 tag_type
    hasColorMap: false,
    hasLanguage: true,
    languageLabels: SongLanguageLabels,
  },
};