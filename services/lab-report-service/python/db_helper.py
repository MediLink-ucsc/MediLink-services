#!/usr/bin/env python3
import json
import sys
import subprocess
import os

class DatabaseHelper:
    """
    Helper class to interact with the database via Node.js service calls.
    """
    
    def __init__(self):
        self.node_service_path = os.path.join(os.path.dirname(__file__), '../src')
    
    def get_test_type_config(self, test_type_id):
        """
        Get test type configuration from the database.
        
        Args:
            test_type_id: ID of the test type
            
        Returns:
            Dictionary containing test type configuration
        """
        try:
            # Call Node.js script to fetch test type configuration
            script_path = os.path.join(self.node_service_path, 'utils', 'db_helper.js')
            
            if not os.path.exists(script_path):
                print(f"=== DATABASE HELPER NOT FOUND: {script_path} ===", file=sys.stderr)
                return self._get_config_by_id(test_type_id)
            
            # Use ts-node instead of node for TypeScript support
            result = subprocess.run([
                'npx', 'ts-node', script_path, 'getTestType', str(test_type_id)
            ], capture_output=True, text=True, cwd=self.node_service_path)
            
            if result.returncode == 0:
                config = json.loads(result.stdout)
                print(f"=== LOADED TEST TYPE CONFIG: {config.get('label', 'Unknown')} ===", file=sys.stderr)
                return config
            else:
                print(f"=== DATABASE ERROR: {result.stderr} ===", file=sys.stderr)
                return self._get_config_by_id(test_type_id)
                
        except Exception as e:
            print(f"=== DATABASE HELPER ERROR: {str(e)} ===", file=sys.stderr)
            return self._get_config_by_id(test_type_id)
    
    def get_test_type_by_format(self, file_format):
        """
        Get test type configuration by file format.
        
        Args:
            file_format: Format identifier (fbc, lab_report, etc.)
            
        Returns:
            Dictionary containing test type configuration
        """
        try:
            script_path = os.path.join(self.node_service_path, 'utils', 'db_helper.js')
            
            if not os.path.exists(script_path):
                print(f"=== DATABASE HELPER NOT FOUND: {script_path} ===", file=sys.stderr)
                return self._get_default_config_by_format(file_format)
            
            # Use ts-node instead of node for TypeScript support
            result = subprocess.run([
                'npx', 'ts-node', script_path, 'getTestTypeByFormat', file_format
            ], capture_output=True, text=True, cwd=self.node_service_path)
            
            if result.returncode == 0:
                config = json.loads(result.stdout)
                print(f"=== LOADED CONFIG FOR FORMAT {file_format}: {config.get('label', 'Unknown')} ===", file=sys.stderr)
                return config
            else:
                print(f"=== DATABASE ERROR: {result.stderr} ===", file=sys.stderr)
                return self._get_default_config_by_format(file_format)
                
        except Exception as e:
            print(f"=== DATABASE HELPER ERROR: {str(e)} ===", file=sys.stderr)
            return self._get_default_config_by_format(file_format)
    
    def _get_default_config(self):
        """
        Get default configuration when database is not available.
        """
        return {
            'id': 0,
            'value': 'generic',
            'label': 'Generic Report',
            'category': 'general',
            'parser_module': None,
            'parser_class': None,
            'report_fields': [],
            'reference_ranges': {},
            'basic_fields': []
        }
    
    def _get_config_by_id(self, test_type_id):
        """
        Get configuration by test type ID with proper mapping.
        """
        # Map test type IDs to formats for fallback
        id_to_format_map = {
            1: 'fbc',
            2: 'lab_report', 
            3: 'prescription',
            4: 'fbc',  # Map ID 4 to FBC as well
            5: 'patient_details'
        }
        
        format_name = id_to_format_map.get(test_type_id, 'generic')
        config = self._get_default_config_by_format(format_name)
        config['id'] = test_type_id  # Update the ID to match requested ID
        return config
    
    def _get_default_config_by_format(self, file_format):
        """
        Get default configuration based on file format.
        """
        format_configs = {
            'fbc': {
                'id': 1,
                'value': 'fbc',
                'label': 'Full Blood Count',
                'category': 'hematology',
                'parser_module': 'parser_fbc_report',
                'parser_class': 'FBCReportParser',
                'report_fields': [
                    {'name': 'RBC', 'type': 'number', 'required': True, 'unit': 'x 10^12/L', 'normalRange': '4.5-5.5'},
                    {'name': 'Hemoglobin', 'type': 'number', 'required': True, 'unit': 'g/dL', 'normalRange': '13.5-17.5'},
                    {'name': 'Hematocrit', 'type': 'number', 'required': True, 'unit': '%', 'normalRange': '41-53'},
                    {'name': 'WBC', 'type': 'number', 'required': True, 'unit': 'x 10^9/L', 'normalRange': '4.0-11.0'},
                    {'name': 'Platelets', 'type': 'number', 'required': True, 'unit': 'x 10^9/L', 'normalRange': '150-450'},
                ],
                'reference_ranges': {
                    'RBC': {'min': 4.5, 'max': 5.5, 'unit': 'x 10^12/L', 'normalRange': '4.5-5.5'},
                    'Hemoglobin': {'min': 13.5, 'max': 17.5, 'unit': 'g/dL', 'normalRange': '13.5-17.5'},
                    'Hematocrit': {'min': 41, 'max': 53, 'unit': '%', 'normalRange': '41-53'},
                    'WBC': {'min': 4.0, 'max': 11.0, 'unit': 'x 10^9/L', 'normalRange': '4.0-11.0'},
                    'Platelets': {'min': 150, 'max': 450, 'unit': 'x 10^9/L', 'normalRange': '150-450'},
                }
            },
            'lab_report': {
                'id': 2,
                'value': 'lab_report',
                'label': 'General Lab Report',
                'category': 'general',
                'parser_module': 'parser_lab_report',
                'parser_class': 'LabReportParser',
                'report_fields': [
                    {'name': 'Glucose', 'type': 'number', 'required': True, 'unit': 'mg/dL', 'normalRange': '70-100'},
                    {'name': 'Cholesterol', 'type': 'number', 'required': False, 'unit': 'mg/dL', 'normalRange': '<200'},
                    {'name': 'Creatinine', 'type': 'number', 'required': False, 'unit': 'mg/dL', 'normalRange': '0.6-1.2'},
                ],
                'reference_ranges': {
                    'Glucose': {'min': 70, 'max': 100, 'unit': 'mg/dL', 'normalRange': '70-100'},
                    'Cholesterol': {'max': 200, 'unit': 'mg/dL', 'normalRange': '<200'},
                    'Creatinine': {'min': 0.6, 'max': 1.2, 'unit': 'mg/dL', 'normalRange': '0.6-1.2'},
                }
            },
            'prescription': {
                'id': 3,
                'value': 'prescription',
                'label': 'Prescription',
                'category': 'prescription',
                'parser_module': 'parser_prescription',
                'parser_class': 'PrescriptionParser',
                'report_fields': [],
                'reference_ranges': {}
            },
            'patient_details': {
                'id': 4,
                'value': 'patient_details',
                'label': 'Patient Details',
                'category': 'patient',
                'parser_module': 'parser_patient_details',
                'parser_class': 'PatientDetailsParser',
                'report_fields': [],
                'reference_ranges': {}
            }
        }
        
        return format_configs.get(file_format, self._get_default_config())


# Global database helper instance
db_helper = DatabaseHelper()
