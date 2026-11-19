const sharp = require('sharp');

sharp('public/images/hero.jpg')
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    const { width, height, channels } = info;
    const buf = Buffer.from(data);

    // Opening behind the stall:
    // x from 400 to 620
    // y from 195 to 335
    for (let y = 195; y < 335; y++) {
      for (let x = 405; x < 615; x++) {
        const idx = (y * width + x) * channels;
        // Blend from left side (x=380) and right side (x=635)
        const leftIdx = (y * width + 380) * channels;
        const rightIdx = (y * width + 635) * channels;
        const t = (x - 405) / (615 - 405);

        // Linear interpolation across the opening
        buf[idx] = Math.round(buf[leftIdx] * (1 - t) + buf[rightIdx] * t);
        buf[idx + 1] = Math.round(buf[leftIdx + 1] * (1 - t) + buf[rightIdx + 1] * t);
        buf[idx + 2] = Math.round(buf[leftIdx + 2] * (1 - t) + buf[rightIdx + 2] * t);
      }
    }

    return sharp(buf, { raw: { width, height, channels } })
      .jpeg({ quality: 95 })
      .toFile('public/images/hero_bg.jpg');
  })
  .then(() => console.log('Successfully created natural hero_bg.jpg'))
  .catch(err => console.error(err));
