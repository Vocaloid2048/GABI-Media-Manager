import { sha256 } from 'js-sha256';

const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";

export const generateDs = (uid) => {
    const salt = localStorage.getItem('salt');
    if (!salt) return null;

    const time = Math.floor(Date.now() / 1000);
    let random = "";

    for (let x = 0; x < 5; x++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        const randomChar = characters[randomIndex];
        random += randomChar;
    }
    
    // SHA256 in UTF-8
    // Format must match backend: `salt=${salt}&t=${time}&r=${random}&uid=${uidSpec}`
    const hash = sha256(`salt=${salt}&t=${time}&r=${random}&uid=${uid}`);
    return `${time},${random},${hash}`;
};
