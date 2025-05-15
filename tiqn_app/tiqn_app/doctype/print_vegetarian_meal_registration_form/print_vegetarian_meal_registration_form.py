# -*- coding: utf-8 -*-
# Copyright (c) 2025, Your Company and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from frappe.utils.pdf import get_pdf
from frappe.utils import getdate, cstr
from datetime import datetime

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
                employee_group ASC, full_name ASC
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
                full_name ASC
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
def generate_meal_registration_pdf():
    """
    Generate a PDF with meal tickets
    - Filename format: vegetarian_meal_tickets_yymmddhhmmss.pdf
    - Properly formatted tickets
    - No margins for exact rendering
    """
    try:
        # Get the form data from the request
        from_date = frappe.form_dict.get('from_date')
        to_date = frappe.form_dict.get('to_date')
        employee_group = frappe.form_dict.get('employee_group')
        
        # Get meal details directly
        meal_details = get_meal_details(from_date, to_date, employee_group)
        
        if not meal_details:
            return {
                "success": False,
                "message": "No meal details found for the selected criteria."
            }
        
        # Generate HTML content
        html_content = get_meal_ticket_html(meal_details)
        
        # Convert to PDF with exact settings
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
        from datetime import datetime
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

@frappe.whitelist()    
@frappe.whitelist()    
def get_meal_ticket_html(meal_details):
    """
    Generate meal tickets with specific dimensions:
    - 15mm margins on all sides
    - Fixed ticket size of 55mm x 30mm
    - 2mm spacing between tickets
    - 8 rows x 3 columns layout (24 tickets per page)
    - Horizontal lines between rows like in screenshot
    """
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            /* Page settings */
            @page {
                size: A4 portrait;
                margin: 0;
            }
            
            /* Reset and base styles */
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: Arial, sans-serif;
                font-size: 13pt;
                line-height: 1.2;
                width: 210mm;  /* A4 width */
                height: 297mm; /* A4 height */
            }
            
            /* Page container with exactly 15mm margins on all sides */
            .page {
                page-break-after: always;
                width: 210mm;
                height: 297mm;
				margin: 0;
                margin: 0;
                padding: 0;;
                position: relative;
            }
            
            .page:last-child {
                page-break-after: avoid;
            }
            
            
            
            /* Table with exact 2mm spacing */
            table.tickets {
                width: 245mm; /* A4 width (210mm) x 1.67 */
                height: 346mm; /* A4 height (297mm) x 1.67 */
                border-collapse: separate;
                border-spacing: 2mm; /* 2mm space between tickets as requested */
                table-layout: fixed;
                margin: 0 auto;
            }
            
            /* Cell dimensions - fixed size as requested */
            td {
                width: 70mm;  /* Fixed width as requested */
                height: 30mm; /* Fixed height as requested */
                padding: 0;
                vertical-align: top;
            }
            
            /* Ticket styling */
            .ticket {
                border: 1px solid black;
                height: 100%;
                width: 100%;
                display: flex;
                flex-direction: column;
            }
            
            /* Header styling - ensure title stays on one line */
            .ticket-header {
                text-align: center;
                font-weight: bold;
                border-bottom: 1px solid black;
                padding: 2mm 0;
                white-space: nowrap;
                overflow: hidden;
            }
            
            /* Content area */
            .ticket-body {
                padding: 3mm;
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
            }
            
            /* Content lines */
            .line {
                margin-bottom: 2mm;
                line-height: 1.3;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            /* Empty cell - completely empty */
            .empty-cell {
                /* No styling for empty cell */
            }
        </style>
    </head>
    <body>
    """
    
    # Calculate how many pages are needed (24 tickets per page)
    tickets_per_page = 24  # 8 rows × 3 columns
    total_tickets = len(meal_details)
    total_pages = (total_tickets + tickets_per_page - 1) // tickets_per_page
    
    # Ensure at least one page is created
    if total_pages == 0:
        total_pages = 1
    
    # Generate each page
    for page in range(total_pages):
        # Start page
        html += '<div class="page">'
        
        # Add horizontal separators as seen in screenshot
        # Calculate positions for 8 rows + 1 top line (9 lines total)
        for i in range(9):
            # Height of each row (30mm) + spacing (2mm) = 32mm
            # Position from top of page: 15mm (top margin) + row_index * row_height
            separator_top = 15 + (i * 32)
            if i > 0:  # Adjust position slightly to account for spacing
                separator_top -= 2
            
            # Add separator at calculated position
            html += f'<div class="separator" style="top: {separator_top}mm;"></div>'
        
        # Add table with tickets
        html += '<table class="tickets">'
        
        # Create 8 rows per page
        for row in range(8):
            html += '<tr>'
            
            # Create 3 columns per row
            for col in range(3):
                # Calculate the index in the data array
                index = page * tickets_per_page + row * 3 + col
                
                # Check if we have data for this position
                if index < len(meal_details):
                    item = meal_details[index]
                    
                    # Format the date
                    date_str = ""
                    if item["register_date"]:
                        try:
                            # Convert string to date if needed
                            if isinstance(item["register_date"], str):
                                reg_date = datetime.strptime(item["register_date"], "%Y-%m-%d").date()
                            else:
                                reg_date = item["register_date"]
                            
                            # Format the weekday in Vietnamese (2-CN format)
                            weekday_map = {
                                0: "2",  # Monday
                                1: "3",
                                2: "4",
                                3: "5",
                                4: "6",
                                5: "7",
                                6: "CN"  # Sunday
                            }
                            weekday = weekday_map.get(reg_date.weekday())
                            date_str = f"Thứ {weekday} Ngày {reg_date.day}/{reg_date.month}"
                        except Exception:
                            date_str = ""
                    
                    # Get other fields
                    employee_group = item.get("employee_group", "")
                    name = item.get("full_name", "")
                    
                    # Create populated ticket - exact format from screenshot
                    html += f"""
                    <td>
                        <div class="ticket">
                            <div class="ticket-header">PHIẾU CƠM CHAY</div>
                            <div class="ticket-body">
                                <div class="line">{date_str}</div>
                                <div class="line">{employee_group}</div>
                                <div class="line">{name}</div>
                            </div>
                        </div>
                    </td>
                    """
                else:
                    # Create empty ticket with border and header
                    html += """
                    <td>
                        <div class="ticket">
                            <div class="ticket-header">PHIẾU CƠM CHAY</div>
                            <div class="ticket-body">
                                <div class="line"></div>
                                <div class="line"></div>
                                <div class="line"></div>
                            </div>
                        </div>
                    </td>
                    """
            
            # End row
            html += '</tr>'
        
        # End table and page
        html += '</table>'
        html += '</div>'
        
        # Add page break if not the last page
        if page < total_pages - 1:
            html += '<div style="page-break-after: always;"></div>'
    
    # End document
    html += """
    </body>
    </html>
    """
    
    return html