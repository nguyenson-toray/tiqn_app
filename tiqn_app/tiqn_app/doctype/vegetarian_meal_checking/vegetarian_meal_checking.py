# Copyright (c) 2025, IT Team and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class VegetarianMealChecking(Document):
    pass

@frappe.whitelist()
def check_meal_registration(employee_id=None, register_date=None, docname=None):
    """
    Check if an employee is already registered for vegetarian meal on a specific date
    
    Args:
        employee_id (str): The ID of the employee to check
        register_date (str): The registration date to check in format YYYY-MM-DD
        docname (str, optional): Document name if accessing from instance
    
    Returns:
        int: 1 if registered, 0 if not registered
    """
    try:
        # Validate parameters
        if not employee_id or not register_date:
            return 0
        
        # Try to find a registration in the Vegetarian Meal Detail table
        result = frappe.db.sql("""
            SELECT name 
            FROM `tabVegetarian Meal Detail` 
            WHERE employee_id = %s AND register_date = %s
            LIMIT 1
        """, (employee_id, register_date))
        
        # Return 1 if found, 0 if not found
        return 1 if result else 0
    
    except Exception as e:
        # Log error and return 0 in case of any error
        frappe.log_error(f"Error checking meal registration: {str(e)}", 
                       "Vegetarian Meal Registration Error")
        return 0