import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { PatientReport } from "../entity/patientReport.entity";
import type { File as MulterFile } from "multer";

// Extend Express Request interface to include 'file' property
declare global {
  namespace Express {
    interface Request {
      file?: MulterFile;
    }
  }
}

export const uploadReport = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const repo = AppDataSource.getRepository(PatientReport);
  const report = repo.create({
    fileName: req.file.originalname,
    filePath: req.file.path
  });
  await repo.save(report);

  res.status(201).json({ message: "Report uploaded", report });
};
