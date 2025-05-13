# Copyright (c) 2025, IT Team and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _  # Thêm import này để sử dụng hàm dịch

class VegetarianMeal(Document):
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
