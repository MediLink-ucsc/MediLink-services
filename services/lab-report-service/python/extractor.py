#!/usr/bin/env python3
import sys
import json
from pdf2image import convert_from_path
import pytesseract
import utils
from parser_patient_details import PatientDetailsParser
from parser_prescription import PrescriptionParser
from parser_lab_report import LabReportParser  
from parser_fbc_report import FBCReportParser  

# Use environment variables in Docker, fallback to hardcoded paths for local development
import os
POPPLER_PATH = os.getenv('POPPLER_PATH', r"C:/poppler-24.08.0/Library/bin")
TESSERACT_ENGINE_PATH = os.getenv('TESSERACT_PATH', r"C:/Users/hansajak/AppData/Local/Programs/Tesseract-OCR/tesseract.exe")

# In Docker, tesseract is in PATH, so we don't need to set the full path
if os.getenv('NODE_ENV') == 'production':
    pytesseract.pytesseract.tesseract_cmd = 'tesseract'
else:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_ENGINE_PATH

def extract(file_path, file_format):
    try:
        # In Docker, poppler tools are in PATH
        if os.getenv('NODE_ENV') == 'production':
            pages = convert_from_path(file_path)
        else:
            pages = convert_from_path(file_path, poppler_path=POPPLER_PATH)
        
        document_text = ""

        for page_num, page in enumerate(pages, 1):
            processed_image = utils.preprocess_image(page)
            text = pytesseract.image_to_string(processed_image, lang="eng")
            document_text = document_text + "\n" + text
            
            # Log each page's OCR text for debugging
            print(f"=== PAGE {page_num} OCR TEXT ===", file=sys.stderr)
            print(repr(text), file=sys.stderr)
            print("=== END PAGE OCR TEXT ===", file=sys.stderr)

        # Log complete document text
        print("=== COMPLETE DOCUMENT OCR TEXT ===", file=sys.stderr)
        print(repr(document_text), file=sys.stderr)
        print("=== END COMPLETE OCR TEXT ===", file=sys.stderr)

        # Parse the document
        print(f"=== PARSING AS {file_format.upper()} ===", file=sys.stderr)
        
        if file_format == "prescription":
            extracted_data = PrescriptionParser(document_text).parse()
        elif file_format == "patient_details":
            extracted_data = PatientDetailsParser(document_text).parse()
        elif file_format == "lab_report":  
            extracted_data = LabReportParser(document_text).parse()
        elif file_format == "fbc":
            extracted_data = FBCReportParser(document_text).parse()
        else:
            raise Exception(f"Invalid file format: {file_format}")
        
        print(f"=== PARSED DATA ===", file=sys.stderr)
        print(json.dumps(extracted_data, indent=2), file=sys.stderr)
        print("=== END PARSED DATA ===", file=sys.stderr)
        
        return extracted_data
    except Exception as e:
        print(f"=== EXTRACTION ERROR ===", file=sys.stderr)
        print(str(e), file=sys.stderr)
        print("=== END ERROR ===", file=sys.stderr)
        raise Exception(f"Extraction failed: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Usage: python extractor.py <file_path> <file_format>"}))
        sys.exit(1)
    
    file_path = sys.argv[1]
    file_format = sys.argv[2]
    
    print(f"=== STARTING EXTRACTION ===", file=sys.stderr)
    print(f"File: {file_path}", file=sys.stderr)
    print(f"Format: {file_format}", file=sys.stderr)
    print("=== BEGIN PROCESSING ===", file=sys.stderr)
    
    try:
        result = extract(file_path, file_format)
        print(json.dumps(result))  # This goes to stdout for Node.js
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)