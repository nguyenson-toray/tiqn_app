# Copyright (c) 2025, IT Team and contributors
# For license information, please see license.txt
import frappe
from frappe.model.document import Document
from frappe import _

class VegetarianMeal(Document):
    def validate(self):
        self.validate_duplicate_entries()
        self.validate_against_submitted_records()
   
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
            
    def validate_against_submitted_records(self):
        """Kiểm tra trùng lặp với các bản ghi đã submit trước đó"""
        if not self.detail:
            return
            
        # Kiểm tra từng dòng trong bảng chi tiết
        for row in self.detail:
            if not row.employee_id or not row.register_date:
                continue
                
            # Tìm các bản ghi đã tồn tại với cùng employee_id và register_date
            # Trong cả document chính và bảng chi tiết
            
            # Kiểm tra trong bảng chính
            main_existing = frappe.db.sql("""
                SELECT name, employee_id, register_date
                FROM `tabVegetarian Meal`
                WHERE employee_id = %s 
                AND register_date = %s
                AND docstatus = 1
                AND name != %s
            """, (row.employee_id, row.register_date, self.name or ""), as_dict=1)
            
            if main_existing:
                frappe.throw(_("Employee {0} ({1}) has already registered for a vegetarian meal on {2} in document {3}").format(
                    row.employee_id,
                    row.full_name or "",
                    frappe.format(row.register_date, {"fieldtype": "Date"}),
                    main_existing[0].name
                ))
                
            # Kiểm tra trong bảng chi tiết của các document khác
            detail_existing = frappe.db.sql("""
                SELECT vmd.parent, vmd.employee_id, vmd.register_date
                FROM `tabVegetarian Meal Detail` vmd
                JOIN `tabVegetarian Meal` vm ON vmd.parent = vm.name
                WHERE vmd.employee_id = %s 
                AND vmd.register_date = %s
                AND vm.docstatus = 1
                AND vm.name != %s
            """, (row.employee_id, row.register_date, self.name or ""), as_dict=1)
            
            if detail_existing:
                frappe.throw(_("Employee {0} ({1}) has already registered for a vegetarian meal on {2} in document {3}").format(
                    row.employee_id,
                    row.full_name or "",
                    frappe.format(row.register_date, {"fieldtype": "Date"}),
                    detail_existing[0].parent
                ))

 
@frappe.whitelist()
def get_groups_for_select():
    """Get list of groups for the select dropdown (bypasses permission check)"""
    # Use frappe.db.sql directly with ignore_permissions=True
    groups = frappe.db.sql("""
        SELECT DISTINCT name 
        FROM `tabGroup` 
        ORDER BY name
    """, as_dict=1)
    
    # Return as a simple list of names
    return [group.name for group in groups]

@frappe.whitelist()
def get_employees_by_group_name(group_name):
    """Get employees by group (bypasses permission check)"""
    if not group_name:
        return []
        
    # Use frappe.db.sql directly with ignore_permissions=True
    employees = frappe.db.sql("""
        SELECT name, employee_name
        FROM `tabEmployee`
        WHERE custom_group = %s
        AND status = 'Active'
        ORDER BY name
    """, (group_name), as_dict=1)
    
    return employees 