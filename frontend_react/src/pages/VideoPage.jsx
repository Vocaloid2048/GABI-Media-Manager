import React from 'react';
import TagBar from '../components/TagBar';
import VideoGrid from '../components/VideoGrid';
import HoverNav from '../components/HoverNav';

const VideoPage = ({
  tagsList,
  selectedTags,
  onToggleTag,
  onRefreshTags,
  isTagBarVisible,
  videoGroupData,
  onSearch,
  filterCount,
  hasActiveSearch,
  onFilterClick,
  scrollContainerRef
}) => {
  return (
    <>
      <TagBar 
        tags={tagsList} 
        selectedTags={selectedTags} 
        onToggleTag={onToggleTag} 
        onRefreshTags={onRefreshTags} 
        isVisible={isTagBarVisible}
      />

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto no-scrollbar relative"
      >
        <VideoGrid groups={videoGroupData} />
      </div>

      <HoverNav
        onFilterClick={onFilterClick}
        onSearch={onSearch}
        filterCount={filterCount}
        hasActiveSearch={hasActiveSearch}
      />
    </>
  );
};

export default VideoPage;