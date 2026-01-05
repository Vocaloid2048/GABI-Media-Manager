const TagTypeEnum = {
    風格: "#ffc8aa",
    景色: "#d4edbc",
    天氣: "#bfe1f6",
    角度: "#e6cff2",
}

const TagClip = ({ tagData }) => {
    return (
        <div className="inline-block mr-2 mb-2">
            <span 
                className="text-xs font-medium px-3 py-1 rounded-full text-black"
                style={{ backgroundColor: TagTypeEnum[tagData.tag_type] || '#777777' }}
            >
                {tagData.tag_zh_name}
            </span>
        </div>
    )
}

export default TagClip;
