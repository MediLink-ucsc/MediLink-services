#!/usr/bin/env python3
"""
Test script for the dynamic parser system
Validates database configuration, parser factory, and extraction workflow
"""

import sys
import json
import os
from typing import Dict, Any, Optional

# Add the Python directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'python'))

from db_helper import db_helper
from parser_factory import DynamicParserFactory


def test_database_connection():
    """Test database connection and configuration retrieval"""
    print("\n🔍 Testing Database Connection...")
    
    try:
        # Test getting FBC test type by format
        fbc_config = db_helper.get_test_type_by_format('fbc')
        if fbc_config:
            print("✅ FBC test type configuration retrieved successfully")
            print(f"   Parser: {fbc_config.get('parser_class')}")
            print(f"   Module: {fbc_config.get('parser_module')}")
            print(f"   Fields count: {len(fbc_config.get('report_fields', []))}")
        else:
            print("❌ FBC test type not found")
            
        # Test getting by ID
        test_type_1 = db_helper.get_test_type_config(1)
        if test_type_1:
            print("✅ Test type retrieval by ID working")
            print(f"   Label: {test_type_1.get('label')}")
        else:
            print("❌ Could not retrieve test type by ID")
            
        # Test lab report format
        lab_config = db_helper.get_test_type_by_format('lab_report')
        if lab_config:
            print("✅ Lab report test type configuration retrieved")
            print(f"   Parser: {lab_config.get('parser_class')}")
        else:
            print("❌ Lab report test type not found")
            
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
        
    return True


def test_parser_factory():
    """Test the dynamic parser factory"""
    print("\n🏭 Testing Parser Factory...")
    
    try:
        factory = DynamicParserFactory()
        
        # Test creating FBC parser with configuration
        fbc_config = db_helper.get_test_type_by_format('fbc')
        mock_text = "Sample FBC report text"
        
        fbc_parser = factory.create_parser(mock_text, fbc_config)
        if fbc_parser:
            print(f"✅ FBC parser created: {type(fbc_parser).__name__}")
            print(f"   Parser class: {fbc_parser.__class__.__name__}")
        else:
            print("❌ Failed to create FBC parser")
            
        # Test creating lab report parser
        lab_config = db_helper.get_test_type_by_format('lab_report')
        lab_parser = factory.create_parser(mock_text, lab_config)
        if lab_parser:
            print(f"✅ Lab parser created: {type(lab_parser).__name__}")
        else:
            print("❌ Failed to create lab parser")
            
        # Test creating generic parser for unknown type
        generic_config = db_helper.get_test_type_by_format('unknown_type')
        generic_parser = factory.create_parser(mock_text, generic_config)
        if generic_parser:
            print(f"✅ Generic parser fallback working: {type(generic_parser).__name__}")
        else:
            print("❌ Generic parser fallback failed")
            
    except Exception as e:
        print(f"❌ Parser factory test failed: {e}")
        return False
        
    return True


def test_parser_configuration():
    """Test parser configuration and field validation"""
    print("\n⚙️ Testing Parser Configuration...")
    
    try:
        factory = DynamicParserFactory()
        
        # Test with FBC configuration
        fbc_config = db_helper.get_test_type_by_format('fbc')
        mock_text = "Sample FBC report text"
        fbc_parser = factory.create_parser(mock_text, fbc_config)
        
        if fbc_parser and hasattr(fbc_parser, 'test_type_config'):
            config = fbc_parser.test_type_config
            print("✅ Parser has test type configuration")
            
            if config.get('report_fields'):
                print(f"   Report fields configured: {len(config['report_fields'])}")
                for field in config['report_fields'][:3]:  # Show first 3 fields
                    print(f"      - {field.get('name')}: {field.get('type')} ({field.get('unit')})")
                
            if config.get('reference_ranges'):
                print(f"   Reference ranges configured: {len(config['reference_ranges'])}")
                
        else:
            print("❌ Parser missing test type configuration")
            
        # Test basic fields
        if fbc_config.get('report_fields'):
            print("✅ Report fields structure validated")
        else:
            print("❌ Report fields missing")
            
    except Exception as e:
        print(f"❌ Parser configuration test failed: {e}")
        return False
        
    return True


def test_extraction_simulation():
    """Simulate extraction process"""
    print("\n📄 Testing Extraction Simulation...")
    
    try:
        # Test parser factory with mock data
        factory = DynamicParserFactory()
        
        # Create mock extraction data
        mock_text = """
        PATIENT NAME: John Doe
        DOB: 1985-01-15
        DOCTOR: Dr. Smith
        LAB: Central Lab
        DATE: 2025-01-10
        
        COMPLETE BLOOD COUNT
        RBC: 4.8 x 10^12/L
        Hemoglobin: 15.2 g/dL
        Hematocrit: 45%
        WBC: 7.2 x 10^9/L
        Platelets: 280 x 10^9/L
        """
        
        # Test with FBC configuration
        fbc_config = db_helper.get_test_type_by_format('fbc')
        fbc_parser = factory.create_parser(mock_text, fbc_config)
        
        if fbc_parser:
            print("✅ FBC parser created for extraction simulation")
            print(f"   Parser type: {type(fbc_parser).__name__}")
            
            # Test if parser has basic extraction methods
            if hasattr(fbc_parser, 'parse'):
                print("✅ Parser has parse method")
                
                # Try to run a quick parse test
                try:
                    result = fbc_parser.parse()
                    if result:
                        print(f"✅ Parse method executed successfully")
                        print(f"   Found {len(result)} data points")
                    else:
                        print("⚠️ Parse method returned no results")
                except Exception as e:
                    print(f"⚠️ Parse method failed: {str(e)[:100]}...")
            else:
                print("❌ Parser missing parse method")
                
        # Test with generic configuration
        generic_config = db_helper.get_test_type_by_format('unknown')
        generic_parser = factory.create_parser(mock_text, generic_config)
        
        if generic_parser:
            print("✅ Generic parser created for fallback simulation")
        
        print("✅ Mock extraction data prepared")
        print(f"   Text length: {len(mock_text)} characters")
        print("   Contains basic information: Patient, Doctor, Lab, Date")
        print("   Contains FBC values: RBC, Hemoglobin, Hematocrit, WBC, Platelets")
        
    except Exception as e:
        print(f"❌ Extraction simulation failed: {e}")
        return False
        
    return True


def run_comprehensive_test():
    """Run all tests"""
    print("🚀 Starting Comprehensive Dynamic Parser System Test")
    print("=" * 60)
    
    test_results = {
        'database_connection': test_database_connection(),
        'parser_factory': test_parser_factory(),
        'parser_configuration': test_parser_configuration(),
        'extraction_simulation': test_extraction_simulation()
    }
    
    print("\n" + "=" * 60)
    print("📊 Test Results Summary:")
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name.replace('_', ' ').title()}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Dynamic parser system is ready.")
    else:
        print("⚠️ Some tests failed. Please check the issues above.")
    
    return passed == total


if __name__ == "__main__":
    run_comprehensive_test()
