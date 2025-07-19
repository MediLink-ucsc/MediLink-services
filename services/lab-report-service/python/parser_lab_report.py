import re

class LabReportParser:
    def __init__(self, text):
        self.text = text

    def parse(self):
        # Initialize the result dictionary
        report_data = {}
        
        # Patient Information
        patient_match = re.search(r'Patient[:\s]*([A-Za-z\s]+)', self.text, re.IGNORECASE)
        if patient_match:
            report_data['Patient'] = patient_match.group(1).strip()
        
        date_match = re.search(r'Date[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', self.text, re.IGNORECASE)
        if date_match:
            report_data['Date'] = date_match.group(1).strip()
            
        doctor_match = re.search(r'Doctor[:\s]*([A-Za-z\s\.]+)', self.text, re.IGNORECASE)
        if doctor_match:
            report_data['Doctor'] = doctor_match.group(1).strip()
            
        lab_match = re.search(r'Laboratory[:\s]*([^\n\r]+)', self.text, re.IGNORECASE)
        if lab_match:
            report_data['Laboratory'] = lab_match.group(1).strip()

        # Vital Signs
        bp_match = re.search(r'Blood\s*Pressure[:\s]*(\d+[/\\]\d+)', self.text, re.IGNORECASE)
        if bp_match:
            report_data['Blood_Pressure'] = bp_match.group(1).strip()
        
        heart_rate_match = re.search(r'Heart\s*Rate[:\s]*(\d+)', self.text, re.IGNORECASE)
        if heart_rate_match:
            report_data['Heart_Rate'] = heart_rate_match.group(1).strip()
        
        temperature_match = re.search(r'Temperature[:\s]*(\d+\.?\d*)', self.text, re.IGNORECASE)
        if temperature_match:
            report_data['Temperature'] = temperature_match.group(1).strip()
        
        # Blood Tests
        cholesterol_match = re.search(r'Cholesterol[:\s]*(\d+\.?\d*\s*mg/dL)', self.text, re.IGNORECASE)
        if cholesterol_match:
            report_data['Cholesterol'] = cholesterol_match.group(1).strip()
        
        glucose_match = re.search(r'Glucose[:\s]*(\d+\.?\d*\s*mg/dL)', self.text, re.IGNORECASE)
        if glucose_match:
            report_data['Glucose'] = glucose_match.group(1).strip()
        
        hemoglobin_match = re.search(r'Hemoglobin[:\s]*(\d+\.?\d*\s*g/dL)', self.text, re.IGNORECASE)
        if hemoglobin_match:
            report_data['Hemoglobin'] = hemoglobin_match.group(1).strip()
        
        # Additional common lab values
        sodium_match = re.search(r'Sodium[:\s]*(\d+\.?\d*\s*mEq/L)', self.text, re.IGNORECASE)
        if sodium_match:
            report_data['Sodium'] = sodium_match.group(1).strip()
        
        potassium_match = re.search(r'Potassium[:\s]*(\d+\.?\d*\s*mEq/L)', self.text, re.IGNORECASE)
        if potassium_match:
            report_data['Potassium'] = potassium_match.group(1).strip()
        
        creatinine_match = re.search(r'Creatinine[:\s]*(\d+\.?\d*\s*mg/dL)', self.text, re.IGNORECASE)
        if creatinine_match:
            report_data['Creatinine'] = creatinine_match.group(1).strip()
        
        bun_match = re.search(r'BUN[:\s]*(\d+\.?\d*\s*mg/dL)', self.text, re.IGNORECASE)
        if bun_match:
            report_data['BUN'] = bun_match.group(1).strip()
        
        # Liver function tests
        alt_match = re.search(r'ALT[:\s]*(\d+\.?\d*\s*U/L)', self.text, re.IGNORECASE)
        if alt_match:
            report_data['ALT'] = alt_match.group(1).strip()
        
        ast_match = re.search(r'AST[:\s]*(\d+\.?\d*\s*U/L)', self.text, re.IGNORECASE)
        if ast_match:
            report_data['AST'] = ast_match.group(1).strip()
        
        # Thyroid function
        tsh_match = re.search(r'TSH[:\s]*(\d+\.?\d*\s*mIU/L)', self.text, re.IGNORECASE)
        if tsh_match:
            report_data['TSH'] = tsh_match.group(1).strip()
        
        # Lipid panel
        ldl_match = re.search(r'LDL[:\s]*(\d+\.?\d*\s*mg/dL)', self.text, re.IGNORECASE)
        if ldl_match:
            report_data['LDL'] = ldl_match.group(1).strip()
        
        hdl_match = re.search(r'HDL[:\s]*(\d+\.?\d*\s*mg/dL)', self.text, re.IGNORECASE)
        if hdl_match:
            report_data['HDL'] = hdl_match.group(1).strip()
        
        triglycerides_match = re.search(r'Triglycerides[:\s]*(\d+\.?\d*\s*mg/dL)', self.text, re.IGNORECASE)
        if triglycerides_match:
            report_data['Triglycerides'] = triglycerides_match.group(1).strip()
        
        return report_data