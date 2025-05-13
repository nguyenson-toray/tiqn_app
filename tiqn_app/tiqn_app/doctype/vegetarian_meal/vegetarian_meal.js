frappe.ui.form.on("Vegetarian Meal", {
    refresh(frm) {

    },
    register_date: function (frm) {
        if (frm.doc.register_date && frm.doc.employee_id) {
            // Check for duplicate registration
            check_duplicate_registration(frm);

            // Loop through all rows in detail table
            $.each(frm.doc.detail || [], function (i, detail) {
                detail.register_date = frm.doc.register_date;
                console.log('set date' + frm.doc.register_date);
            });
            frm.refresh_field("detail");
        }
    },
    employee_id: function (frm) {
        if (frm.doc.register_date && frm.doc.employee_id) {
            // Check for duplicate registration when employee changes
            check_duplicate_registration(frm);
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

                        // Check for duplicate registration after setting employee
                        if (frm.doc.register_date) {
                            check_duplicate_registration(frm);
                        }
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

// Helper function to check for duplicate registrations
function check_duplicate_registration(frm) {
    if (!frm.doc.employee_id || !frm.doc.register_date) return;

    frappe.db.get_list('Vegetarian Meal', {
        filters: {
            employee_id: frm.doc.employee_id,
            register_date: frm.doc.register_date,
            name: ['!=', frm.doc.name || '']
        },
        fields: ['name']
    }).then(records => {
        if (records && records.length > 0) {
            frappe.show_alert({
                message: __('Warning: You have already registered for a vegetarian meal on this date'),
                indicator: 'red'
            });
        }
    });
}

frappe.ui.form.on("Vegetarian Meal Detail", {
    detail_add: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        if (frm.doc.register_date) {
            row.register_date = frm.doc.register_date;
            frm.refresh_field("detail");
            console.log('Set register_date for new row: ' + frm.doc.register_date);
        }
    }
});