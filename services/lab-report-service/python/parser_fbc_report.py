import re

class FBCReportParser:
    def __init__(self, text):
        self.text = text

    def parse(self):
        print("=== FBC PARSER DEBUG ===", file=__import__('sys').stderr)
        print(f"Input text length: {len(self.text)}", file=__import__('sys').stderr)
        print("Raw text:", repr(self.text[:500]), file=__import__('sys').stderr)
        
        # Initialize the result dictionary
        report_data = {}
        
        # Patient Information - Multiple patterns for different formats
        patient_patterns = [
            r'Patient:\s*(.+)',
            r'Patient\s*Name:\s*(.+)',
            r'Name:\s*(.+)',
        ]
        
        for pattern in patient_patterns:
            match = re.search(pattern, self.text, re.IGNORECASE)
            if match:
                report_data['Patient'] = match.group(1).strip()
                print(f"✅ Found Patient: {match.group(1).strip()}", file=__import__('sys').stderr)
                break
        
        # Date patterns - handle different formats
        date_patterns = [
            r'Date:\s*(.+)',
            r'Collection\s*Date:\s*(.+)',
            r'Report\s*Date:\s*(.+)',
            r'Date\s*of\s*Birth:\s*(.+)',  # This might be DOB, not report date
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, self.text, re.IGNORECASE)
            if match and 'Birth' not in pattern:  # Skip DOB
                report_data['Date'] = match.group(1).strip()
                print(f"✅ Found Date: {match.group(1).strip()}", file=__import__('sys').stderr)
                break
        
        # Doctor patterns
        doctor_patterns = [
            r'Doctor:\s*(.+)',
            r'Ordering\s*Physician:\s*(.+)',
            r'Physician:\s*(.+)',
        ]
        
        for pattern in doctor_patterns:
            match = re.search(pattern, self.text, re.IGNORECASE)
            if match:
                report_data['Doctor'] = match.group(1).strip()
                print(f"✅ Found Doctor: {match.group(1).strip()}", file=__import__('sys').stderr)
                break
        
        # Laboratory patterns
        lab_patterns = [
            r'Laboratory:\s*(.+)',
            r'Lab:\s*(.+)',
            r'CENTRAL\s*MEDICAL\s*LABORATORY',
        ]
        
        for pattern in lab_patterns:
            match = re.search(pattern, self.text, re.IGNORECASE)
            if match:
                if 'CENTRAL' in pattern:
                    report_data['Laboratory'] = 'Central Medical Laboratory'
                else:
                    report_data['Laboratory'] = match.group(1).strip()
                print(f"✅ Found Laboratory: {report_data['Laboratory']}", file=__import__('sys').stderr)
                break
        
        # Blood parameters - Enhanced patterns for tabular data
        blood_params = {
            'RBC': [
                r'RBC[:.\s]*([\d\.]+\s*x?\s*10[\*\^]?\d+[/\s]*L)',
                r'Red\s*Blood\s*Cell\s*Count\s*\(RBC\)[:.\s]*([\d\.]+)',
                r'RBC\s*([\d\.]+)',
            ],
            'Hemoglobin': [
                r'Hemoglobin[:.\s]*([\d\.]+\s*g[/\s]*dL)',
                r'Hb[:.\s]*([\d\.]+\s*g[/\s]*dL)',
                r'Hemoglobin\s*\(Hb\)[:.\s]*([\d\.]+)',
            ],
            'Hematocrit': [
                r'Hematocrit[:.\s]*([\d\.]+\s*%)',
                r'Hct[:.\s]*([\d\.]+\s*%)',
                r'Hematocrit\s*\(Hct\)[:.\s]*([\d\.]+)',
            ],
            'MCV': [
                r'MCV[:.\s]*([\d\.]+\s*fL)',
                r'MCV\s*([\d\.]+)',
                r'Mean\s*Cell\s*Volume\s*\(MCV\)[:.\s]*([\d\.]+)',
            ],
            'MCH': [
                r'MCH[:.\s]*([\d\.]+\s*pg)',
                r'MCH\s*([\d\.]+)',
                r'Mean\s*Cell\s*Hemoglobin\s*\(MCH\)[:.\s]*([\d\.]+)',
            ],
            'MCHC': [
                r'MCHC[:.\s]*([\d\.]+\s*g[/\s]*dL)',
                r'MCHC\s*([\d\.]+)',
                r'Mean\s*Cell\s*Hemoglobin\s*Concentration\s*\(MCHC\)[:.\s]*([\d\.]+)',
            ],
            'WBC': [
                r'WBC[:.\s]*([\d\.]+\s*x?\s*10[^\s]*[/\s]*L)',
                r'White\s*Blood\s*Cell\s*Count\s*\(WBC\)[:.\s]*([\d\.]+)',
                r'WBC\s*([\d\.]+)',
            ],
            'Neutrophils': [
                r'Neutrophils[:.\s]*([\d\.]+\s*%)',
                r'Neutrophils\s*([\d\.]+)',
            ],
            'Lymphocytes': [
                r'Lymphocytes[:.\s]*([\d\.]+\s*%)',
                r'Lymphocytes\s*([\d\.]+)',
            ],
            'Monocytes': [
                r'Monocytes[:.\s]*([\d\.]+\s*%)',
                r'Monocytes\s*([\d\.]+)',
            ],
            'Eosinophils': [
                r'Eosinophils[:.\s]*([\d\.]+\s*%)',
                r'Eosinophils\s*([\d\.]+)',
            ],
            'Basophils': [
                r'Basophils[:.\s]*([\d\.]+\s*%)',
                r'Basophils\s*([\d\.]+)',
            ],
            'Platelets': [
                r'Platelets[:.\s]*([\d\.]+\s*x?\s*10[\*\^]?\d+[/\s]*L)',
                r'Platelet\s*Count[:.\s]*([\d\.]+)',
                r'Platelets\s*([\d\.]+)',
            ],
            'MPV': [
                r'MPV[:.\s]*([\d\.]+\s*fL)',
                r'MPV\s*([\d\.]+)',
            ],
            'ESR': [
                r'ESR[:.\s]*([\d\.]+\s*mm[/\s]*hr)',
                r'ESR\s*([\d\.]+)',
            ],
        }
        
        # Extract blood parameters
        for param, patterns in blood_params.items():
            for pattern in patterns:
                match = re.search(pattern, self.text, re.IGNORECASE)
                if match:
                    value = match.group(1).strip()
                    # Add units if missing
                    if param in ['RBC'] and 'x' not in value and '10' not in value:
                        value += ' x 10^12/L'
                    elif param in ['Hemoglobin'] and 'g/dL' not in value:
                        value += ' g/dL'
                    elif param in ['Hematocrit'] and '%' not in value:
                        value += ' %'
                    elif param in ['MCV', 'MPV'] and 'fL' not in value:
                        value += ' fL'
                    elif param in ['MCH'] and 'pg' not in value:
                        value += ' pg'
                    elif param in ['MCHC'] and 'g/dL' not in value:
                        value += ' g/dL'
                    elif param in ['WBC'] and 'x' not in value and '10' not in value:
                        value += ' x 10^9/L'
                    elif param in ['Neutrophils', 'Lymphocytes', 'Monocytes', 'Eosinophils', 'Basophils'] and '%' not in value:
                        value += ' %'
                    elif param in ['Platelets'] and 'x' not in value and '10' not in value:
                        value += ' x 10^9/L'
                    elif param in ['ESR'] and 'mm/hr' not in value:
                        value += ' mm/hr'
                    
                    report_data[param] = value
                    print(f"✅ Found {param}: {value}", file=__import__('sys').stderr)
                    break
                else:
                    print(f"❌ Not found {param} with pattern: {pattern}", file=__import__('sys').stderr)
        
        # Try to extract from tabular format (looking for Result column)
        if len(report_data) < 5:  # If we didn't find much, try tabular extraction
            print("=== TRYING TABULAR EXTRACTION ===", file=__import__('sys').stderr)
            
            # Look for tabular data patterns
            lines = self.text.split('\n')
            for i, line in enumerate(lines):
                line = line.strip()
                if not line:
                    continue
                
                # Look for parameter names followed by values in subsequent lines
                if 'Red Blood Cell Count' in line or 'RBC' in line:
                    # Look for the value in the same line or next few lines
                    for j in range(i, min(i+3, len(lines))):
                        value_match = re.search(r'([\d\.]+)', lines[j])
                        if value_match and j > i:  # Value should be in a different line
                            report_data['RBC'] = value_match.group(1) + ' x 10^12/L'
                            break
                
                elif 'Hemoglobin' in line:
                    for j in range(i, min(i+3, len(lines))):
                        value_match = re.search(r'([\d\.]+)', lines[j])
                        if value_match and j > i:
                            report_data['Hemoglobin'] = value_match.group(1) + ' g/dL'
                            break
                
                # Add more tabular patterns as needed...
        
        print(f"=== TOTAL EXTRACTED FIELDS: {len(report_data)} ===", file=__import__('sys').stderr)
        return report_data