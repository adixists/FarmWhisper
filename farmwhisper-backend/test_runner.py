#!/usr/bin/env python3
"""
Test runner script for FarmWhisper backend
"""

import subprocess
import sys
import os

def run_tests():
    """Run all tests for the FarmWhisper backend"""
    print("Running FarmWhisper backend tests...")
    
    # Change to the project directory
    project_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(project_dir)
    
    # Run pytest
    try:
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            "app/tests/", 
            "-v", 
            "--tb=short"
        ], check=True, capture_output=True, text=True)
        
        print("Tests completed successfully!")
        print(result.stdout)
        return True
        
    except subprocess.CalledProcessError as e:
        print("Tests failed!")
        print("STDOUT:", e.stdout)
        print("STDERR:", e.stderr)
        return False
    except FileNotFoundError:
        print("Error: pytest not found. Please install it with 'pip install pytest'")
        return False

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)