const sharp = require('sharp');

sharp('public/images/cow_head_raw.png')
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    const { width, height, channels } = info;
    const rgba = Buffer.alloc(width * height * 4);

    for (let i = 0; i < width * height; i++) {
      rgba[i * 4] = data[i * channels];
      rgba[i * 4 + 1] = data[i * channels + 1];
      rgba[i * 4 + 2] = data[i * channels + 2];
      rgba[i * 4 + 3] = 255;
    }

    // Explicitly clear non-head regions:
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;

        // 1. Top awning
        if (y < 32) { rgba[idx + 3] = 0; continue; }
        if (y < 45 && x > 84 && x < 150) { rgba[idx + 3] = 0; continue; } // between horns

        // 2. Outside left horn
        if (y < 40 && x < 68) { rgba[idx + 3] = 0; continue; }

        // 3. Outside right horn
        if (y < 50 && x > 170) { rgba[idx + 3] = 0; continue; }
        if (y < 45 && x > 155) { rgba[idx + 3] = 0; continue; }

        // 4. Above left ear
        if (y < 60 && x < 42) { rgba[idx + 3] = 0; continue; }

        // 5. Far left / Far right bounds
        if (x < 24 || x > 196) { rgba[idx + 3] = 0; continue; }

        // 6. Bottom hand / cups
        if (x < 50 && y > 115) { rgba[idx + 3] = 0; continue; }
        if (x > 170 && y > 135) { rgba[idx + 3] = 0; continue; }
        if (y > 156) { rgba[idx + 3] = 0; continue; }

        // 7. Sky color test around boundaries
        const r = rgba[idx];
        const g = rgba[idx + 1];
        const b = rgba[idx + 2];
        if (b > 185 && b > r + 50 && g > r + 15) {
          rgba[idx + 3] = 0;
        }
      }
    }

    return sharp(rgba, { raw: { width, height, channels: 4 } })
      .png()
      .toFile('public/images/cow_head_cutout.png');
  })
  .then(() => console.log('Successfully perfected cow_head_cutout.png'))
  .catch(err => console.error(err));
