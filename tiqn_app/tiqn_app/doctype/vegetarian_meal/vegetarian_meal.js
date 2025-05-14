// Copyright (c) 2025, IT Team and contributors
// For license information, please see license.txt

frappe.ui.form.on("Vegetarian Meal", {
    refresh(frm) {
        set_datepicker_constraints(frm)
    },
    register_date: function (frm) {
        if (frm.doc.register_date) {
            // Loop through all rows in detail table
            $.each(frm.doc.detail || [], function (i, detail) {
                detail.register_date = frm.doc.register_date;
                // Check for duplicates in submitted records
                if (detail.employee_id) {
                    check_for_submitted_duplicates(frm, detail.employee_id, frm.doc.register_date, i);
                }
            });

            frm.refresh_field("detail");
        }
    },
    onload: function (frm) {
        set_datepicker_constraints(frm)
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

                        // Check for duplicates if register_date is already set
                        if (frm.doc.register_date) {
                            check_for_submitted_duplicates(frm, r.message.name, frm.doc.register_date);
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

frappe.ui.form.on("Vegetarian Meal Detail", {

    detail_add: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        if (frm.doc.register_date) {
            row.register_date = frm.doc.register_date;
            frm.refresh_field("detail");
        }
    },

    employee_id: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        if (row.employee_id && row.register_date) {
            // Get row index
            var idx = frm.doc.detail.findIndex(d => d.name === row.name);
            // Check for duplicates in submitted records
            check_for_submitted_duplicates(frm, row.employee_id, row.register_date, idx);
        }
    },

    register_date: function (frm, cdt, cdn) {

        var row = locals[cdt][cdn];
        var today = frappe.datetime.get_today();

        // Check if date is in the past
        if (row.register_date && row.register_date < today) {
            frappe.msgprint({
                title: __('Invalid Date'),
                indicator: 'red',
                message: __('Register date cannot be in the past. Please select today or a future date.')
            });

            // Reset to today or clear
            row.register_date = today;
            frm.refresh_field('detail');
            return;
        }
        if (row.employee_id && row.register_date) {
            // Get row index
            var idx = frm.doc.detail.findIndex(d => d.name === row.name);
            // Check for duplicates in submitted records
            check_for_submitted_duplicates(frm, row.employee_id, row.register_date, idx);
        }
    },

});

// Function to check for duplicates in submitted records
function check_for_submitted_duplicates(frm, employee_id, register_date, row_idx) {
    if (!employee_id || !register_date) return;

    // Check main table first
    frappe.db.get_list('Vegetarian Meal', {
        filters: {
            employee_id: employee_id,
            register_date: register_date,
            docstatus: 1,
            name: ['!=', frm.doc.name || '']
        },
        fields: ['name']
    }).then(records => {
        if (records && records.length > 0) {
            let msg = __('Warning: Employee {0} has already registered for a vegetarian meal on {1} in document {2}',
                [employee_id, register_date, records[0].name]);

            frappe.show_alert({
                message: msg,
                indicator: 'red'
            });

            // Highlight the row if row_idx is provided
            if (row_idx !== undefined) {
                frm.get_field('detail').grid.grid_rows[row_idx].select();
            }
        } else {
            // If not found in main table, check detail table
            frappe.call({
                method: 'frappe.client.get_list',
                args: {
                    doctype: 'Vegetarian Meal Detail',
                    filters: {
                        employee_id: employee_id,
                        register_date: register_date
                    },
                    fields: ['parent'],
                    parent: 'Vegetarian Meal',
                    parent_filters: {
                        docstatus: 1,
                        name: ['!=', frm.doc.name || '']
                    }
                },
                callback: function (response) {
                    if (response.message && response.message.length > 0) {
                        let msg = __('Warning: Employee {0} has already registered for a vegetarian meal on {1} in document {2}',
                            [employee_id, register_date, response.message[0].parent]);

                        frappe.show_alert({
                            message: msg,
                            indicator: 'red'
                        });

                        // Highlight the row if row_idx is provided
                        if (row_idx !== undefined) {
                            frm.get_field('detail').grid.grid_rows[row_idx].select();
                        }
                    }
                }
            });
        }
    });
}

// Hàm thiết lập giới hạn cho datepicker
function set_datepicker_constraints(frm) {
    // Thiết lập ngày tối thiểu cho register_date là ngày hôm nay
    if (frm.fields_dict.register_date && frm.fields_dict.register_date.datepicker) {
        frm.fields_dict.register_date.datepicker.update({
            minDate: new Date(frappe.datetime.get_today())
        });
    }

}



