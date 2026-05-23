const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure directories exist
const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = 'uploads/';
        
        if (file.fieldname === 'profileImage' || file.fieldname === 'idCardImage') uploadPath += 'profiles/';
        else if (file.fieldname === 'slipImage' || file.fieldname === 'slip_image') uploadPath += 'slips/';
        else if (file.fieldname === 'productImage') uploadPath += 'products/';
        else if (file.fieldname === 'vaccineCert') uploadPath += 'vaccines/';
        else if (file.fieldname === 'delivery_proof') uploadPath += 'proofs/';
        
        ensureDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Create unique filename: fieldname-timestamp.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// File filter (Only allow images)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, JPG and WEBP are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB limit
    }
});

module.exports = upload;
