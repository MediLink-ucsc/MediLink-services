import multer, { StorageEngine, FileFilterCallback } from "multer";
import path from "path";
import { Request } from "express";

// Set up storage configuration for uploaded files
const storage: StorageEngine = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to the file name
  },
});

// Initialize multer with the storage configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
  },
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    const filetypes = /pdf|jpg|jpeg|png/; // Allowed file types
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Error: File type not supported!"));
  },
});

// Export the upload middleware
export default upload;
