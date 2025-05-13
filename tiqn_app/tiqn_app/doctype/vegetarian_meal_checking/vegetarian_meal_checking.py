# Copyright (c) 2025, IT Team and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _  # Thêm import này để sử dụng hàm dịch

class VegetarianMealChecking(Document):
    def validate(self):
        self.validate_duplicate_entries()
    
    def validate_duplicate_entries(self):
        """Kiểm tra các bản ghi trùng lặp trong bảng chi tiết"""
        if not self.detail:
            return
            
        # Tạo từ điển để theo dõi các cặp employee_id/register_date đã xuất hiện
        entry_dict = {}
        rows_to_remove = []  # Danh sách các hàng cần xóa
        for i, row in enumerate(self.detail):
            # Bỏ qua nếu không có employee_id hoặc register_date
            if not row.employee_id or not row.register_date:
                continue
                
            # Tạo key duy nhất cho mỗi cặp employee_id + register_date
            key = f"{row.employee_id}_{row.register_date}"
            
            # Kiểm tra xem key này đã tồn tại chưa
            if key in entry_dict:
                # Lưu vị trí của hàng cần xóa để xử lý 
                rows_to_remove.append(i)
                # Lấy dòng trùng lặp trước đó
                prev_row = self.detail[entry_dict[key]]
                
                # Báo lỗi và hiển thị thông tin
                message = _("Duplicate entry found at row {0} and {1}. Employee {2} ({3}) Date {4}. The duplicate row will be removed.").format(
					entry_dict[key] + 1,  # +1 vì index bắt đầu từ 0
					i + 1,
					row.employee_id,
					row.full_name or "",
					frappe.format(row.register_date, {"fieldtype": "Date"})            	
                )
                frappe.msgprint(msg=message, title='Error', indicator='red') 
            else:
                # Lưu vị trí của dòng này để tham chiếu sau này
                entry_dict[key] = i
        # Xóa các hàng trùng lặp (xóa từ cuối lên để không làm thay đổi index)
        for idx in sorted(rows_to_remove, reverse=True):
            self.detail.pop(idx)


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
@frappe.whitelist()
def get_employee_details(employee_id):
    return frappe.db.get_value("Employee", 
                              employee_id, 
                              ["employee_name", "custom_group"], 
                              as_dict=1 )    