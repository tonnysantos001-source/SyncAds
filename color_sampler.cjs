const fs = require('fs');

async function getColors() {
    try {
        const { default: getPixels } = await import('get-pixels');

        getPixels('C:\\Users\\dinho\\.gemini\\antigravity\\brain\\49a412db-dd6b-4dbc-b41b-c41b7f186950\\media__1774821184034.png', (err, pixels) => {
            if (err) {
                console.error("Error reading image:", err);
                return;
            }
            
            // Width and Height of screenshot (assume 1080p roughly)
            const w = pixels.shape[0];
            const h = pixels.shape[1];
            
            // Read pixel at (w/2, 200) - this is the Chat Background (top middle)
            let x = Math.floor(w / 2);
            let y = 100;
            let bgR = pixels.get(x, y, 0);
            let bgG = pixels.get(x, y, 1);
            let bgB = pixels.get(x, y, 2);

            // Read pixel at (w/2 + 200, h/2 - 200) - this is the Image Square
            let x2 = Math.floor(w/2) + 200;
            let y2 = Math.floor(h/2) - 200;
            let sqR = pixels.get(x2, y2, 0);
            let sqG = pixels.get(x2, y2, 1);
            let sqB = pixels.get(x2, y2, 2);
            
            console.log(`Chat Background (Site): RGB(${bgR}, ${bgG}, ${bgB}) | HEX: #${bgR.toString(16).padStart(2,'0')}${bgG.toString(16).padStart(2,'0')}${bgB.toString(16).padStart(2,'0')}`);
            console.log(`Image Square (Image): RGB(${sqR}, ${sqG}, ${sqB}) | HEX: #${sqR.toString(16).padStart(2,'0')}${sqG.toString(16).padStart(2,'0')}${sqB.toString(16).padStart(2,'0')}`);
        });
    } catch(e) {
        console.error(e);
    }
}

getColors();
