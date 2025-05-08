// Copyright (c) 2025, IT Team and contributors
// For license information, please see license.txt

frappe.ui.form.on("Vegetarian Meal", {
    refresh(frm) {
        // Set filter for employee_id in child table based on line_team
        frm.set_query("employee_id", "detail", function () {
            return {
                filters: {
                    "custom_line_team": frm.doc.line_team
                }
            };
        });
    },
    register_date: function (frm) {
        if (frm.doc.register_date) {
            // Loop through all rows in detail table
            $.each(frm.doc.detail || [], function (i, detail) {
                if (!detail.date) {
                    detail.date = frm.doc.register_date;
                }

            });
            frm.refresh_field("detail");
        }
    },
    onload: function (frm) {
        if (frm.doc.__islocal) {
            frm.set_value('current_user', frappe.session.user);
        }
        if (!frm.doc.current_user || frm.doc.__islocal) {
            frm.set_value('current_user', frappe.session.user);

            // Lấy Employee ID từ User hiện tại
            frappe.db.get_value('Employee', { user_id: frappe.session.user }, 'name')
                .then(r => {
                    if (r.message && r.message.name) {
                        frm.set_value('employee_id', r.message.name);
                    } else {
                        // Hiển thị thông báo nếu không tìm thấy Employee
                        frappe.show_alert({
                            message: __('No Employee record found for current user'),
                            indicator: 'orange'
                        });
                    }
                });
        }
    }
});
