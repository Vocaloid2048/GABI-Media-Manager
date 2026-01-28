const extractSongData = (xmlData) => {
  // This is a simplified extraction. ProPresenter XML structure may vary.
  // Assuming standard structure
  const presentation = xmlData.RVPresentationDocument;
  const name = presentation['RVPresentationSettings'][0]['$']['name'] || 'Unknown Song';

  const slides = presentation['RVSlideGrouping'][0]['RVDisplaySlide'] || [];
  const content = [];

  slides.forEach((slide, index) => {
    const slideElements = slide['RVTextElement'] || [];
    let slideContent = '';
    slideElements.forEach(element => {
      if (element['_']) {
        slideContent += element['_'] + '\n';
      }
    });

    // Determine tag based on slide properties or default
    let tag = 'verse';
    if (index === 0) tag = 'title';
    // You can add more logic to detect chorus, bridge, etc.

    content.push({
      page: index + 1,
      tag: tag,
      content: slideContent.trim()
    });
  });

  return {
    name,
    content
  };
};

module.exports = {
  extractSongData
};