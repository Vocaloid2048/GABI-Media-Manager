const TitleFooter = () => {
    return (
        <footer className="mt-24 text-center text-gray-600 text-sm border-t border-gray-800/50 pt-10 pb-6">
            <p className="font-medium text-gray-500 mb-2 cursor-pointer" onClick={() => window.open("https://github.com/Vocaloid2048/GABI-Media-Manager", "_blank")}>GABI Media Manager</p>
            <p className="cursor-pointer" onClick={() => window.open("https://github.com/Vocaloid2048")}>&copy; 2026 Vocaloid2048. All Rights Reserved.</p>
        </footer>
    )
}

export default TitleFooter;