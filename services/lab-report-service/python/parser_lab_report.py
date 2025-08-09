import re
from base_parser import BaseParser

class LabReportParser(BaseParser):
    def __init__(self, text, test_type_config=None):
        super().__init__(text, test_type_config)
    
    def _extract_test_specific_data(self):
        """
        Extract general lab report data including vital signs and blood tests.
        """
        # Use configured report fields if available, otherwise use defaults
        report_fields = self.test_type_config.get('report_fields', [])
        
        if report_fields:
            # Use configured fields from database
            self._extract_configured_fields(report_fields)
        else:
            # Fallback to hardcoded lab parameters
            self._extract_default_lab_parameters()
    
    def _extract_configured_fields(self, report_fields):
        """
        Extract fields based on database configuration.
        """
        for field_config in report_fields:
            field_name = field_config['name']
            unit = field_config.get('unit', '')
            
            # Generate patterns for this field
            patterns = self._generate_lab_field_patterns(field_name, unit)
            
            # Extract the field value
            value = self._extract_numeric_value(self.text, patterns, unit)
            
            if value:
                self.report_data[field_name] = value
                print(f" Found configured field {field_name}: {value}", file=__import__('sys').stderr)
    
    def _generate_lab_field_patterns(self, field_name, unit=''):
        """
        Generate regex patterns for lab field names.
        """
        escaped_name = re.escape(field_name)
        escaped_unit = re.escape(unit) if unit else ''
        
        patterns = [
            rf'{escaped_name}[:\s]*(\d+\.?\d*\s*{escaped_unit})',
            rf'{escaped_name}[:\s]*(\d+\.?\d*)',
        ]
        
        # Add common variations
        field_variations = {
            'Blood Pressure': [r'Blood\s*Pressure[:\s]*(\d+[/\\]\d+)'],
            'Heart Rate': [r'Heart\s*Rate[:\s]*(\d+)'],
            'Temperature': [r'Temperature[:\s]*(\d+\.?\d*)'],
            'Cholesterol': [r'Cholesterol[:\s]*(\d+\.?\d*\s*mg/dL)'],
            'Glucose': [r'Glucose[:\s]*(\d+\.?\d*\s*mg/dL)'],
            'Hemoglobin': [r'Hemoglobin[:\s]*(\d+\.?\d*\s*g/dL)'],
        }
        
        if field_name in field_variations:
            patterns.extend(field_variations[field_name])
        
        return patterns
    
    def _extract_default_lab_parameters(self):
        """
        Extract default lab parameters when no configuration is available.
        """
        # Vital Signs
        bp_match = re.search(r'Blood\s*Pressure[:\s]*(\d+[/\\]\d+)', self.text, re.IGNORECASE)
        if bp_match:
            self.report_data['Blood_Pressure'] = bp_match.group(1).strip()
        
        heart_rate_match = re.search(r'Heart\s*Rate[:\s]*(\d+)', self.text, re.IGNORECASE)
        if heart_rate_match:
            self.report_data['Heart_Rate'] = heart_rate_match.group(1).strip()
        
        temperature_match = re.search(r'Temperature[:\s]*(\d+\.?\d*)', self.text, re.IGNORECASE)
        if temperature_match:
            self.report_data['Temperature'] = temperature_match.group(1).strip()
        
        # Blood Tests
        cholesterol_match = re.search(r'Cholesterol[:\s]*(\d+\.?\d*\s*mg/dL)', self.text, re.IGNORECASE)
        if cholesterol_match:
            self.report_data['Cholesterol'] = cholesterol_match.group(1).strip()
        
        glucose_match = re.search(r'Glucose[:\s]*(\d+\.?\d*\s*mg/dL)', self.text, re.IGNORECASE)
        if glucose_match:
            self.report_data['Glucose'] = glucose_match.group(1).strip()
        
        hemoglobin_match = re.search(r'Hemoglobin[:\s]*(\d+\.?\d*\s*g/dL)', self.text, re.IGNORECASE)
        if hemoglobin_match:
            self.report_data['Hemoglobin'] = hemoglobin_match.group(1).strip()
        
        # Additional common lab values
        sodium_match = re.search(r'Sodium[:\s]*(\d+\.?\d*\s*mEq/L)', self.text, re.IGNORECASE)
        if sodium_match:
            self.report_data['Sodium'] = sodium_match.group(1).strip()
        
        potassium_match = re.search(r'Potassium[:\s]*(\d+\.?\d*\s*mEq/L)', self.text, re.IGNORECASE)
        if potassium_match:
            self.report_data['Potassium'] = potassium_match.group(1).strip()
        
        creatinine_match = re.search(r'Creatinine[:\s]*(\d+\.?\d*\s*mg/dL)', self.text, re.IGNORECASE)
        if creatinine_match:
            self.report_data['Creatinine'] = creatinine_match.group(1).strip()
        
        bun_match = re.search(r'BUN[:\s]*(\d+\.?\d*\s*mg/dL)', self.text, re.IGNORECASE)
        if bun_match:
            self.report_data['BUN'] = bun_match.group(1).strip()
        
        # Liver function tests
        alt_match = re.search(r'ALT[:\s]*(\d+\.?\d*\s*U/L)', self.text, re.IGNORECASE)
        if alt_match:
            self.report_data['ALT'] = alt_match.group(1).strip()
        
        ast_match = re.search(r'AST[:\s]*(\d+\.?\d*\s*U/L)', self.text, re.IGNORECASE)
        if ast_match:
            self.report_data['AST'] = ast_match.group(1).strip()
        
        # Thyroid function
        tsh_match = re.search(r'TSH[:\s]*(\d+\.?\d*\s*mIU/L)', self.text, re.IGNORECASE)
        if tsh_match:
            self.report_data['TSH'] = tsh_match.group(1).strip()
        
        # Lipid panel
        ldl_match = re.search(r'LDL[:\s]*(\d+\.?\d*\s*mg/dL)', self.text, re.IGNORECASE)
        if ldl_match:
            self.report_data['LDL'] = ldl_match.group(1).strip()
        
        hdl_match = re.search(r'HDL[:\s]*(\d+\.?\d*\s*mg/dL)', self.text, re.IGNORECASE)
        if hdl_match:
            self.report_data['HDL'] = hdl_match.group(1).strip()
        
        triglycerides_match = re.search(r'Triglycerides[:\s]*(\d+\.?\d*\s*mg/dL)', self.text, re.IGNORECASE)
        if triglycerides_match:
            self.report_data['Triglycerides'] = triglycerides_match.group(1).strip()