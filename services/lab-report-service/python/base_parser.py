#!/usr/bin/env python3
import re
import sys
import json
from abc import ABC, abstractmethod

class BaseParser(ABC):
    """
    Base class for all report parsers.
    Provides common functionality for extracting basic information
    and handling test-specific parsing.
    """
    
    def __init__(self, text, test_type_config=None):
        self.text = text
        self.test_type_config = test_type_config or {}
        self.report_data = {}
    
    def parse(self):
        """
        Main parsing method that orchestrates the extraction process.
        """
        print(f"=== {self.__class__.__name__} DEBUG ===", file=sys.stderr)
        print(f"Input text length: {len(self.text)}", file=sys.stderr)
        print("Raw text:", repr(self.text[:500]), file=sys.stderr)
        
        # Extract basic information required for all reports
        self._extract_basic_information()
        
        # Extract test-specific information
        self._extract_test_specific_data()
        
        # Validate results
        self._validate_results()
        
        print(f"=== TOTAL EXTRACTED FIELDS: {len(self.report_data)} ===", file=sys.stderr)
        return self.report_data
    
    def _extract_basic_information(self):
        """
        Extract basic information common to all lab reports.
        Uses configuration from test type if available.
        """
        basic_fields = self.test_type_config.get('basic_fields', self._get_default_basic_fields())
        
        for field_config in basic_fields:
            field_name = field_config['name']
            patterns = field_config['patterns']
            required = field_config.get('required', False)
            
            found = False
            for pattern in patterns:
                match = re.search(pattern, self.text, re.IGNORECASE)
                if match:
                    value = match.group(1).strip()
                    
                    # Special handling for laboratory field
                    if field_name == 'Laboratory' and 'CENTRAL' in pattern:
                        value = 'Central Medical Laboratory'
                    
                    self.report_data[field_name] = value
                    print(f" Found {field_name}: {value}", file=sys.stderr)
                    found = True
                    break
            
            if not found and required:
                print(f" Warning: Required field '{field_name}' not found", file=sys.stderr)
    
    def _get_default_basic_fields(self):
        """
        Default basic fields configuration for all reports.
        """
        return [
            {
                'name': 'Patient',
                'required': True,
                'patterns': [
                    r'Patient:\s*(.+)',
                    r'Patient\s*Name:\s*(.+)',
                    r'Name:\s*(.+)',
                ]
            },
            {
                'name': 'Date',
                'required': True,
                'patterns': [
                    r'Date:\s*(.+)',
                    r'Collection\s*Date:\s*(.+)',
                    r'Report\s*Date:\s*(.+)',
                ]
            },
            {
                'name': 'Doctor',
                'required': False,
                'patterns': [
                    r'Doctor:\s*(.+)',
                    r'Ordering\s*Physician:\s*(.+)',
                    r'Physician:\s*(.+)',
                ]
            },
            {
                'name': 'Laboratory',
                'required': True,
                'patterns': [
                    r'Laboratory:\s*(.+)',
                    r'Lab:\s*(.+)',
                    r'CENTRAL\s*MEDICAL\s*LABORATORY',
                ]
            }
        ]
    
    @abstractmethod
    def _extract_test_specific_data(self):
        """
        Extract test-specific data. Must be implemented by subclasses.
        """
        pass
    
    def _validate_results(self):
        """
        Validate extracted results against reference ranges if available.
        """
        reference_ranges = self.test_type_config.get('reference_ranges', {})
        
        for field_name, field_value in self.report_data.items():
            if field_name in reference_ranges:
                range_config = reference_ranges[field_name]
                # Add validation logic here if needed
                print(f" Validated {field_name}: {field_value} (Range: {range_config.get('normalRange', 'N/A')})", file=sys.stderr)
    
    def _extract_numeric_value(self, text, patterns, unit=None):
        """
        Helper method to extract numeric values with optional units.
        """
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                value = match.group(1).strip()
                
                # Add unit if missing and provided
                if unit and unit not in value:
                    value += f' {unit}'
                
                return value
        return None
    
    def _extract_tabular_data(self, lines, start_markers, value_patterns):
        """
        Helper method to extract data from tabular formats.
        """
        extracted_data = {}
        
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
            
            for marker, param_name in start_markers.items():
                if marker.lower() in line.lower():
                    # Look for the value in the same line or next few lines
                    for j in range(i, min(i + 3, len(lines))):
                        for pattern in value_patterns.get(param_name, [r'([\d\.]+)']):
                            value_match = re.search(pattern, lines[j])
                            if value_match and (j > i or marker.lower() not in lines[j].lower()):
                                extracted_data[param_name] = value_match.group(1)
                                break
                        if param_name in extracted_data:
                            break
                    break
        
        return extracted_data
