// Copyright (c) 2025, IT Team and contributors
// For license information, please see license.txt

frappe.ui.form.on("Vegetarian Meal", {
    refresh(frm) {

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
