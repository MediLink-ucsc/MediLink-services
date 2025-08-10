#!/usr/bin/env python3
"""
Test with the actual truncated thyroid text from your production case
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'python'))

from db_helper import db_helper
from parser_factory import parser_factory

# Use the actual truncated text from your production case
actual_thyroid_text = """ENDOCRINE DIAGNOSTICS LABORATORY

789 Medical Research Center, Building A
Metropolitan Health District, State 67890 | Phone: (555) 456-7890 | Fax: (355) 456-7891

THYROID FUNCTION TEST REPORT

Patient Name: Emily Rodriguez
Date of Birth: 07/15/1978
Patient ID: ER-240621-003
Gender: Female

Age: 46 years

Specimen Type: Serum (Gold Top Tube - SST)
Collection Method: Venipuncture

Processing Status: Centrifuged and analyzed within 4 hours

Special Instructions: Patient fasting for 8+ hours

Collection Date: June 21, 2025
Collection Time: 09:15 AM (Fasting)
Report Date: June 21, 2025
Ordering Physician: Dr. Amanda Chen, MD
Lab Reference: EDL-TFT-240621-003

THYROID HORMONE PATHWAY

Hypothalamus → TRH → Pituitary → TSH → Thyroid Gland → T4 & T3 → Target Tissues

THYROID HORMONE PANEL

Test Parameter
Result
Reference
Range
Units
Status
Clinical Significance

Thyroid Stimulating Hormone
(TSH)
2.1
0.4 - 4.0
mIU/L
NORMAL
Primary screening test for thyroid
function

Free Thyroxine (Free T4)
1.3
0.8 - 1.8
ng/dL
NORMAL
Active thyroid hormone; metabolic
regulation

Free Triiodothyronine (Free T3)
3.2
2.3 - 4.2
pg/mL
NORMAL
Most active thyroid hormone; cellular
metabolism

ADDITIONAL THYROID MARKERS

Parameter
Result
Reference Range
Units
Status

T4:T3 Ratio
4.1
2.5 - 5.0
ratio
NORMAL

Free T4 Index (FTI)
6.8
4.5 - 10.5
index
NORMAL"""

def test_actual_thyroid_text():
    print("🧪 Testing Actual Thyroid Text with Enhanced Extraction")
    print("=" * 60)
    
    # Test with Test Type ID 6
    config = db_helper.get_test_type_config(6)
    print(f"✅ Config: {config.get('label')} with {len(config.get('report_fields', []))} fields")
    
    # Create parser
    parser = parser_factory.create_parser(actual_thyroid_text, config)
    print(f"✅ Parser: {type(parser).__name__}")
    
    # Parse
    result = parser.parse()
    print(f"✅ Total Fields: {len(result)}")
    
    print("\n📊 All Extracted Fields:")
    for key, value in result.items():
        print(f"   {key}: {value}")
    
    # Check thyroid markers specifically
    thyroid_markers = {
        'TSH': ['tsh', 'thyroid stimulating hormone'],
        'Free T4': ['free t4', 'free thyroxine'],
        'Free T3': ['free t3', 'free triiodothyronine'], 
        'T4:T3 Ratio': ['t4:t3 ratio', 't4/t3', 'ratio'],
        'Free T4 Index': ['free t4 index', 'fti', 'index']
    }
    
    found_markers = {}
    for marker_name, search_terms in thyroid_markers.items():
        for key, value in result.items():
            if any(term in key.lower() for term in search_terms):
                found_markers[marker_name] = f"{key}: {value}"
                break
    
    print(f"\n🎯 Thyroid Markers Analysis:")
    print(f"   Found: {len(found_markers)}/{len(thyroid_markers)} markers")
    
    for marker_name in thyroid_markers:
        if marker_name in found_markers:
            print(f"   ✅ {marker_name} -> {found_markers[marker_name]}")
        else:
            print(f"   ❌ {marker_name} -> Not found")
    
    return len(found_markers) >= 4

if __name__ == "__main__":
    success = test_actual_thyroid_text()
    if success:
        print("\n🎉 Actual thyroid text extraction successful!")
    else:
        print("\n⚠️ Actual thyroid text extraction partially successful - room for improvement!")
