const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imageOptimizer = async (req, res, next) => {
    try {
        if (!req.files && !req.file) {
            return next();
        }

        const processFile = async (file) => {
            if (!file.mimetype.startsWith('image/')) return;
            
            // Only process jpeg, png, webp
            if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.mimetype)) return;

            const originalPath = file.path;
            const dir = path.dirname(originalPath);
            const ext = path.extname(originalPath);
            const filenameWithoutExt = path.basename(originalPath, ext);
            const newFilename = `${filenameWithoutExt}.webp`;
            const newPath = path.join(dir, newFilename);

            await sharp(originalPath)
                .resize({ width: 800, withoutEnlargement: true }) // Max width 800px
                .webp({ quality: 80 }) // Compress to webp
                .toFile(newPath);

            // Delete original file
            fs.unlinkSync(originalPath);

            // Update file object
            file.path = newPath;
            file.filename = newFilename;
            file.mimetype = 'image/webp';
            file.size = fs.statSync(newPath).size;
        };

        if (req.file) {
            await processFile(req.file);
        } else if (req.files) {
            // Handle arrays (e.g. from upload.array)
            if (Array.isArray(req.files)) {
                await Promise.all(req.files.map(processFile));
            } 
            // Handle fields (e.g. from upload.fields)
            else {
                const promises = [];
                for (const fieldname in req.files) {
                    req.files[fieldname].forEach(file => {
                        promises.push(processFile(file));
                    });
                }
                await Promise.all(promises);
            }
        }

        next();
    } catch (error) {
        console.error('Image optimization error:', error);
        next(); // Proceed even if optimization fails, so upload doesn't break entirely
    }
};

module.exports = imageOptimizer;
