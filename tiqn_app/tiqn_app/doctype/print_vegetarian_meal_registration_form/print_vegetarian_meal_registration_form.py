# -*- coding: utf-8 -*-
# Copyright (c) 2025, Your Company and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from frappe.utils.pdf import get_pdf
from frappe.utils import getdate, cstr
from datetime import datetime
import json

class PrintVegetarianMealRegistrationForm(Document):
    """This is a standard DocType that will be used just for the UI"""
    
    def onload(self):
        """Initialize table fields for proper form loading"""
        if not hasattr(self, '_table_fieldnames'):
            self._table_fieldnames = set()
            self._table_fields = []
            
            # Ensure all table fields are properly identified
            for df in self.meta.get_table_fields():
                self._table_fields.append(df)
                self._table_fieldnames.add(df.fieldname)

@frappe.whitelist()
def get_groups():
    """Lấy danh sách distinct các group từ cơ sở dữ liệu"""
    try:
        groups = frappe.db.sql("""
            SELECT DISTINCT employee_group as value
            FROM `tabVegetarian Meal Detail`
            WHERE employee_group != ''
            ORDER BY employee_group
        """, as_dict=0)
        return [g[0] for g in groups] 
        
    except Exception as e:
        frappe.log_error(f"Error in get_groups: {str(e)}")
        return []

@frappe.whitelist()
def get_meal_details(from_date, to_date, employee_group):
    """
    Fetch meal details from the Vegetarian Meal Detail table
    """
    # Check if all parameters are provided
    if not from_date or not to_date:
        return []
    
   
    if not employee_group or employee_group == "":
        # Query all groups
        meal_details = frappe.db.sql("""
            SELECT 
                employee_id, 
                full_name, 
                register_date, 
                employee_group
            FROM 
                `tabVegetarian Meal Detail`
            WHERE 
                register_date BETWEEN %s AND %s
            ORDER BY 
               register_date ASC, employee_group ASC, employee_id ASC
        """, (from_date, to_date), as_dict=1)
    else:
        # Query specific group
        meal_details = frappe.db.sql("""
            SELECT 
                employee_id, 
                full_name, 
                register_date, 
                employee_group
            FROM 
                `tabVegetarian Meal Detail`
            WHERE 
                register_date BETWEEN %s AND %s
                AND employee_group = %s
            ORDER BY 
                 register_date ASC, employee_group ASC, employee_id ASC
        """, (from_date, to_date, employee_group), as_dict=1)
    
    return meal_details

@frappe.whitelist() 
def save_pdf_as_temporary_file(filename, pdf_data):
    """Save the PDF file as a temporary file without attaching to a document"""
    # Save the PDF file
    file_doc = frappe.new_doc("File")
    file_doc.file_name = filename
    file_doc.content = pdf_data
    file_doc.is_private = 1
    file_doc.folder = "Home/Attachments"
    file_doc.save(ignore_permissions=True)
    
    return file_doc

@frappe.whitelist()
def convert_html_to_pdf_and_save(html_content):
    """
    Convert HTML content to PDF and save as a temporary file
    This function is called from JavaScript
    """
    try:
        # Check if HTML content is provided
        if not html_content:
            return {
                "success": False,
                "message": "No HTML content provided."
            }
        
        # Convert to PDF with adjusted settings
        pdf_options = {
            "page-size": "A4",
            "margin-top": "0mm",
            "margin-right": "10mm",
            "margin-bottom": "0mm",
            "margin-left": "10mm",
            "enable-local-file-access": "",
            "print-media-type": "",
            "dpi": "300"  # Higher DPI for better quality printing
        }
        
        pdf_data = get_pdf(html_content, options=pdf_options)
        
        # Generate timestamp format yymmddhhmmss
        timestamp = datetime.now().strftime("%y%m%d%H%M%S")
        file_name = f"vegetarian_meal_tickets_{timestamp}.pdf"
        
        # Save the file but don't attach it to a document
        file_doc = save_pdf_as_temporary_file(file_name, pdf_data)
        
        return {
            "success": True,
            "message": "PDF Generated Successfully",
            "file_url": file_doc.file_url
        }
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Vegetarian Meal PDF Generation Error")
        return {
            "success": False,
            "message": f"Error generating PDF: {str(e)}"
        }

# Keep these functions for backward compatibility
@frappe.whitelist()
def generate_meal_registration_pdf():
    """
    Legacy function kept for backward compatibility
    Now redirects to the client-side generation method
    """
    try:
        # Get the form data from the request
        html_content = frappe.form_dict.get('html_content')
        if not html_content:
            return {
                "success": False,
                "message": "No HTML content provided."
            }
        
        # Use the new function
        return convert_html_to_pdf_and_save(html_content)
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Vegetarian Meal PDF Generation Error")
        return {
            "success": False,
            "message": f"Error generating PDF: {str(e)}"
        }