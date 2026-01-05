const { sha256 } = require('js-sha256')
const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
    
exports.generateDs = (uidSpec, timeSpec, randomSpec) => {
    const salt = process.env.DS_SALT
    const time = timeSpec || Math.floor(Date.now() / 1000)
    let random = randomSpec || ""

    if(random === ""){
        for (x = 0 ; x < 5 ; x++) {
            const randomIndex = Math.floor(Math.random() * characters.length)
            const randomChar = characters[randomIndex]
            random += randomChar
        }
    }
    
    //SHA256 in UTF-8
    // console.log(`Generating DS: salt=${salt}&t=${time}&r=${random}&uid=${uidSpec}`);
    const hash = sha256(`salt=${salt}&t=${time}&r=${random}&uid=${uidSpec}`)
    return `${time},${random},${hash}`; // Final result
}