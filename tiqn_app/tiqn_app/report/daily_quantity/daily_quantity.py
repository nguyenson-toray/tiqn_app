# Copyright (c) 2025, IT Team and contributors
# For license information, please see license.txt

import frappe
from frappe import _

def execute(filters=None):
    # Định nghĩa cấu trúc cột
    columns = get_columns()
    
    # Lấy dữ liệu theo bộ lọc
    data = get_data(filters)
    
    return columns, data

def get_columns():
    # Định nghĩa các cột hiển thị trong báo cáo
    return [
        {
            "label": _("Register Date"),
            "fieldname": "register_date",
            "fieldtype": "Date",
            "width": 120
        },
        {
            "label": _("Group"),
            "fieldname": "employee_group",
            "fieldtype": "Data",
            "width": 120
        },
        {
            "label": _("Quantity"),
            "fieldname": "quantity",
            "fieldtype": "Int",
            "width": 100
        }
        
    ]

def get_data(filters):
    # Xây dựng điều kiện truy vấn dựa vào bộ lọc
    conditions = get_conditions(filters)
    
    # Thực hiện truy vấn SQL để lấy và nhóm dữ liệu
    data = frappe.db.sql("""
        SELECT 
            employee_group,
            COUNT(name) as quantity,
            register_date
        FROM 
            `tabVegetarian Meal Detail`
        WHERE
            {conditions}
        GROUP BY 
            employee_group, register_date
        ORDER BY 
            register_date DESC, employee_group
    """.format(conditions=conditions), filters, as_dict=1)
    
    return data

def get_conditions(filters):
    conditions = "1=1"
    
    # Thay đổi từ register_date thành from_date và to_date
    if filters.get("from_date") and filters.get("to_date"):
        conditions += " AND register_date BETWEEN %(from_date)s AND %(to_date)s"
    elif filters.get("from_date"):
        conditions += " AND register_date >= %(from_date)s"
    elif filters.get("to_date"):
        conditions += " AND register_date <= %(to_date)s"
    
    if filters.get("employee_group"):
        conditions += " AND employee_group = %(employee_group)s"
    
    return conditions

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