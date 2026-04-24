const { Jimp, loadFont } = require('jimp');
const fonts = require('@jimp/plugin-print/fonts');
const path = require('path');

async function createTestImage() {
    console.log('Creating base image...');
    const image = new Jimp({ width: 1200, height: 1600, color: 0xCCCCCCFF });
    
    console.log('Calculating watermark layout...');
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    const margin = Math.floor(width * 0.03); 
    const padding = 20; 
    const boxWidth = width - (margin * 2);
    
    const isHighRes = width > 1000;
    
    console.log('Loading fonts...');
    const fontLarge = await loadFont(isHighRes ? fonts.SANS_32_WHITE : fonts.SANS_16_WHITE);
    const fontSmall = await loadFont(isHighRes ? fonts.SANS_16_WHITE : fonts.SANS_8_WHITE);
    
    const lineSpacingLarge = isHighRes ? 45 : 25;
    const lineSpacingSmall = isHighRes ? 25 : 15;

    const boxHeight = padding * 2 + lineSpacingLarge + (lineSpacingSmall * 3);
    const boxY = height - boxHeight - margin;
    
    console.log('Creating overlay...');
    const overlay = new Jimp({ width: boxWidth, height: boxHeight, color: 0x000000B3 }); 
    image.composite(overlay, margin, boxY);

    let textX = margin + padding;
    let textY = boxY + padding;

    console.log('Printing text...');
    image.print({ font: fontLarge, x: textX, y: textY, text: 'Kecamatan Way Halim, Lampung, Indonesia', maxWidth: boxWidth - (padding * 2) });
    textY += lineSpacingLarge;

    image.print({ font: fontSmall, x: textX, y: textY, text: 'GPS Map Camera', maxWidth: boxWidth - (padding * 2) });
    textY += lineSpacingSmall;

    image.print({ font: fontSmall, x: textX, y: textY, text: 'Lat -5.384965 Long 105.281459', maxWidth: boxWidth - (padding * 2) });
    textY += lineSpacingSmall;

    image.print({ font: fontSmall, x: textX, y: textY, text: 'Kamis, 23/04/2026 08:33 PM GMT +07:00', maxWidth: boxWidth - (padding * 2) });

    console.log('Writing image...');
    await image.write('test_result_v161.jpg');
    console.log('Done!');
}

createTestImage().catch(e => console.error(e));
