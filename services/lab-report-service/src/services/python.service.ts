import { spawn, ChildProcess } from "child_process";
import path from "path";

interface ExtractedData {
  error?: string;
  [key: string]: any;
}

class PythonService {
  extractData(filePath: string, fileFormat: string): Promise<ExtractedData> {
    return new Promise((resolve, reject) => {
      const scriptPath: string = path.join(
        __dirname,
        "../../python/extractor.py"
      );

      // Use python3 instead of python for Docker compatibility
      const pythonCommand: string =
        process.env.NODE_ENV === "production" ? "python3" : "python";

      console.log(
        `🔍 Executing: ${pythonCommand} ${scriptPath} ${filePath} ${fileFormat}`
      );

      const pythonProcess: ChildProcess = spawn(pythonCommand, [
        scriptPath,
        filePath,
        fileFormat,
      ]);

      let dataString: string = "";
      let errorString: string = "";

      pythonProcess.stdout?.on("data", (data: Buffer) => {
        dataString += data.toString();
      });

      pythonProcess.stderr?.on("data", (data: Buffer) => {
        errorString += data.toString();
        console.error(` Python stderr: ${data}`);
      });

      pythonProcess.on("close", (code: number | null) => {
        console.log(` Python process exited with code ${code}`);
        console.log(` Python stdout: ${dataString}`);

        if (code !== 0) {
          reject(
            new Error(`Python script failed with code ${code}: ${errorString}`)
          );
          return;
        }

        try {
          const result: ExtractedData = JSON.parse(dataString);
          if (result.error) {
            console.error(` Python script error: ${result.error}`);
            reject(new Error(result.error));
          } else {
            console.log("🎯 EXTRACTED DATA:", JSON.stringify(result, null, 2));
            resolve(result);
          }
        } catch (parseError: any) {
          console.error(" Failed to parse Python output:", dataString);
          reject(
            new Error(`Failed to parse Python output: ${parseError.message}`)
          );
        }
      });

      pythonProcess.on("error", (error: Error) => {
        console.error(" Failed to start Python process:", error);
        reject(new Error(`Failed to execute Python script: ${error.message}`));
      });
    });
  }
}

export default new PythonService();
