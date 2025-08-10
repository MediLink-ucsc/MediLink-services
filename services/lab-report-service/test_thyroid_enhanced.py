#!/usr/bin/env python3
"""
Test thyroid function report parsing with enhanced table extraction
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'python'))

from db_helper import db_helper
from parser_factory import parser_factory

# Test thyroid content similar to your production case
thyroid_text = """ENDOCRINE DIAGNOSTICS LABORATORY

789 Medical Research Center, Building A
Metropolitan Health District, State 67890 | Phone: (555) 456-7890

THYROID FUNCTION TEST REPORT

Patient Name: Emily Rodriguez
Date of Birth: 07/15/1978
Patient ID: ER-240621-003
Gender: Female
Age: 46 years

Collection Date: June 21, 2025
Collection Time: 09:15 AM (Fasting)
Report Date: June 21, 2025
Ordering Physician: Dr. Amanda Chen, MD
Lab Reference: EDL-TFT-240621-003

Specimen Type: Serum (Gold Top Tube - SST)
Collection Method: Venipuncture
Processing Status: Centrifuged and analyzed within 4 hours
Special Instructions: Patient fasting for 8+ hours

THYROID HORMONE PANEL

Test Parameter | Result | Reference Range | Units | Status | Clinical Significance
---|---|---|---|---|---
Thyroid Stimulating Hormone (TSH) | 2.1 | 0.4 - 4.0 | mIU/L | NORMAL | Primary screening test for thyroid function
Free Thyroxine (Free T4) | 1.3 | 0.8 - 1.8 | ng/dL | NORMAL | Active thyroid hormone; metabolic regulation
Free Triiodothyronine (Free T3) | 3.2 | 2.3 - 4.2 | pg/mL | NORMAL | Most active thyroid hormone; cellular metabolism

ADDITIONAL THYROID MARKERS

Parameter | Result | Reference Range | Units | Status
---|---|---|---|---
T4:T3 Ratio | 4.1 | 2.5 - 5.0 | ratio | NORMAL
Free T4 Index (FTI) | 6.8 | 4.5 - 10.5 | index | NORMAL"""

def test_thyroid_extraction():
    print("🧪 Testing Enhanced Thyroid Function Test Extraction")
    print("=" * 60)
    
    # Test with Test Type ID 6 (should map to thyroid)
    config = db_helper.get_test_type_config(6)
    print(f"✅ Test Type ID 6 Config: {config.get('label')}")
    print(f"   Parser Class: {config.get('parser_class')}")
    print(f"   Report Fields: {len(config.get('report_fields', []))}")
    
    # Create parser
    parser = parser_factory.create_parser(thyroid_text, config)
    print(f"✅ Parser Created: {type(parser).__name__}")
    
    # Parse the content
    result = parser.parse()
    print(f"✅ Extraction Complete: {len(result)} fields found")
    
    print("\n📊 Extracted Fields:")
    for key, value in result.items():
        print(f"   {key}: {value}")
    
    # Check for specific thyroid markers
    thyroid_markers = ['TSH', 'Free T4', 'Free T3', 'T4:T3 Ratio', 'Free T4 Index']
    found_markers = [marker for marker in thyroid_markers if any(marker.lower() in key.lower() for key in result.keys())]
    
    print(f"\n🎯 Thyroid Markers Found: {len(found_markers)}/{len(thyroid_markers)}")
    for marker in found_markers:
        print(f"   ✅ {marker}")
    
    missing_markers = [marker for marker in thyroid_markers if not any(marker.lower() in key.lower() for key in result.keys())]
    if missing_markers:
        print(f"\n⚠️ Missing Markers: {len(missing_markers)}")
        for marker in missing_markers:
            print(f"   ❌ {marker}")
    
    return len(result) > 0 and len(found_markers) >= 3

if __name__ == "__main__":
    success = test_thyroid_extraction()
    if success:
        print("\n🎉 Enhanced thyroid extraction successful!")
    else:
        print("\n❌ Enhanced thyroid extraction needs improvement!")
