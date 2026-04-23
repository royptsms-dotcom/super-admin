const { Jimp } = require('jimp');
console.log('Jimp loaded:', typeof Jimp);
async function test() {
    try {
        const image = new Jimp({ width: 100, height: 100, color: 0xFF0000FF });
        console.log('Image created');
        // const buffer = await image.getBuffer('image/png'); // Jimp 1.x
        // console.log('Buffer obtained', buffer.length);
    } catch (e) {
        console.error('Error:', e);
    }
}
test();
