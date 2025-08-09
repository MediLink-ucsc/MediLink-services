#!/usr/bin/env python3
"""
Quick test to verify Test Type ID 4 behavior with FBC content
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'python'))

from db_helper import db_helper
from parser_factory import parser_factory

# Test FBC content with Test Type ID 4
fbc_text = """FULL BLOOD COUNT REPORT

Patient: Sarah Johnson

Date: 06/21/2025

Laboratory: Central Medical Lab
Doctor: Dr. Michael Brown

Specimen: Whole Blood (EDTA)

COMPLETE BLOOD COUNT:

RED BLOOD CELLS:
RBC: 4.5 x 10*12/L
Hemoglobin: 13.2 g/dL
Hematocrit: 39.5 %
MCV: 88 fL

MCH: 29.3 pg

MCHC: 33.4 g/dL

WHITE BLOOD CELLS:
WBC: 7.2 x 10^9/L
Neutrophils: 65 %
Lymphocytes: 28 %
Monocytes: 5 %
Eosinophils: 2 %

Basophils: 0 %

PLATELETS:

Platelets: 280 x 10*9/L

MPV: 8.5 fL

OTHER:

ESR: 15 mm/hr"""

def test_type_id_4():
    print("🧪 Testing Test Type ID 4 with FBC Content")
    print("=" * 50)
    
    # Get configuration for Test Type ID 4
    config = db_helper.get_test_type_config(4)
    print(f"✅ Test Type ID 4 Config: {config.get('label')}")
    print(f"   Parser Class: {config.get('parser_class')}")
    print(f"   Parser Module: {config.get('parser_module')}")
    print(f"   Report Fields: {len(config.get('report_fields', []))}")
    
    # Create parser with this configuration
    parser = parser_factory.create_parser(fbc_text, config)
    print(f"✅ Parser Created: {type(parser).__name__}")
    
    # Parse the content
    result = parser.parse()
    print(f"✅ Extraction Complete: {len(result)} fields found")
    
    print("\n📊 Extracted Fields:")
    for key, value in result.items():
        print(f"   {key}: {value}")
    
    return len(result) > 0

if __name__ == "__main__":
    success = test_type_id_4()
    if success:
        print("\n🎉 Test Type ID 4 extraction successful!")
    else:
        print("\n❌ Test Type ID 4 extraction failed!")
