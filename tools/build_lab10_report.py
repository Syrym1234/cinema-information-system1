"""Build the reference-based Word report; pass --reference <retained DOCX>.
Export the resulting Word file with export_lab10_pdf.ps1 for an identical PDF.
"""
from pathlib import Path
import runpy

runpy.run_path(str(Path(__file__).with_name('build_lab10_from_reference.py')),run_name='__main__')
