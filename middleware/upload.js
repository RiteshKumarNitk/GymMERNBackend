const multer = require('multer');

// File ko memory me store karega (disk pe nahi)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

module.exports = upload;
