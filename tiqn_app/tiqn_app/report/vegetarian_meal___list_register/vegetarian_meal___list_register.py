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
            "label": _("Line Team"),
            "fieldname": "line_team",
            "fieldtype": "Data",
            "width": 120
        },
        {
            "label": _("Employee ID"),
            "fieldname": "employee_id",
            "fieldtype": "Data",
            "width": 150
        },
         {
            "label": _("Full Name"),
            "fieldname": "full_name",
            "fieldtype": "Data",
            "width": 200
        }
        
    ]

def get_data(filters):
    # Xây dựng điều kiện truy vấn dựa vào bộ lọc
    conditions = get_conditions(filters)
    
    # Thực hiện truy vấn SQL để lấy và nhóm dữ liệu
    data = frappe.db.sql("""
        SELECT 
        	register_date,
            line_team,
            employee_id,
            full_name
            
        FROM 
            `tabVegetarian Meal Detail`
        WHERE
            {conditions}
        GROUP BY 
            line_team, register_date
        ORDER BY 
            register_date DESC, line_team
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
    
    if filters.get("line_team"):
        conditions += " AND line_team = %(line_team)s"
    
    return conditions

@frappe.whitelist()
def get_line_teams():
    """Lấy danh sách distinct các line_team từ cơ sở dữ liệu"""
    try:
        line_teams = frappe.get_all(
            "Vegetarian Meal Detail",
            fields=["distinct line_team as value"],
            filters={"line_team": ["!=", ""]},
            pluck="value",
            order_by="line_team",
            ignore_permissions=True
        )
        
        return line_teams
    except Exception as e:
        frappe.log_error(f"Error in get_line_teams: {str(e)}")
        return []