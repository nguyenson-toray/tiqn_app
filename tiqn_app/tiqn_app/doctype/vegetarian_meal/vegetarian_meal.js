// Copyright (c) 2025, IT Team and contributors
// For license information, please see license.txt

frappe.ui.form.on("Vegetarian Meal", {
    setup: function (frm) {
        // Load groups from server using Python method
        frappe.call({
            method: "tiqn_app.tiqn_app.doctype.vegetarian_meal.vegetarian_meal.get_groups_for_select",
            arguments: {
                "employee_group": frm.doc.select_group
            },
            callback: function (r) {
                if (r.message && r.message.length > 0) {
                    console.log(r.message);
                    frm.set_df_property('select_group', 'options', r.message.join('\n'));
                    frm.refresh_field('select_group');
                }
            }
        });
    },
    before_save: function (frm) {
        // Remove empty rows before saving
        if (frm.doc.detail && frm.doc.detail.length > 0) {
            // Filter out rows with missing employee_id or register_date
            let valid_rows = frm.doc.detail.filter(row =>
                row.employee_id && row.register_date
            );

            // If any rows were removed, update the table
            if (valid_rows.length < frm.doc.detail.length) {
                frm.doc.detail = valid_rows;
                frm.refresh_field("detail");
            }
        }
    },
    type_input: function (frm) {
        if (frm.doc.type_input === 'Select') {
            // Show fields when type_input is 'Select'
            frm.set_df_property('select_group', 'hidden', false);
            frm.set_df_property('get_employee_list', 'hidden', false);
            frm.set_df_property('column_break_wxvn', 'hidden', false);

            frm.refresh_fields(['select_group', 'get_employee_list', 'column_break_wxvn']);
        } else {
            // Hide fields when type_input is not 'Select'
            frm.set_df_property('select_group', 'hidden', true);
            frm.set_df_property('get_employee_list', 'hidden', true);
            frm.set_df_property('column_break_wxvn', 'hidden', true);

            frm.refresh_fields(['select_group', 'get_employee_list', 'column_break_wxvn']);
        }
    },

    refresh(frm) {
        set_datepicker_constraints(frm);

        // Add get_employee_list button functionality
        frm.fields_dict.get_employee_list.$input.on('click', function () {
            if (frm.doc.type_input !== 'Select') {
                frappe.msgprint(__('Please select Type Input as "Select" first'));
                return;
            }

            if (!frm.doc.select_group) {
                frappe.msgprint(__('Please select a Group first'));
                return;
            }

            // Get employees with matching group from Python method
            frappe.call({
                method: "tiqn_app.tiqn_app.doctype.vegetarian_meal.vegetarian_meal.get_employees_by_group_name",
                args: {
                    "group_name": frm.doc.select_group
                },
                callback: function (r) {
                    const employees = r.message || [];
                    console.log(employees);
                    if (employees.length === 0) {
                        frappe.msgprint(__('No employees found in the selected group'));
                        return;
                    }

                    // Create dialog with employee selection
                    let dialog = new frappe.ui.Dialog({
                        title: __('Select Employees'),
                        fields: [
                            {
                                fieldtype: 'Date',
                                fieldname: 'register_date',
                                label: __('Register Date'),
                                default: frm.doc.register_date || frappe.datetime.add_days(frappe.datetime.get_today(), 1),
                                reqd: true
                            },
                            {
                                fieldtype: 'Column Break',
                                fieldname: 'button_column'
                            },
                            {
                                fieldtype: 'HTML',
                                fieldname: 'custom_buttons',
                                options: `<div style="text-align: right; margin-top: 25px;">
                                        <button class="btn btn-primary custom-ok-btn">${__('OK')}</button>
                                     </div>`
                            },
                            {
                                fieldtype: 'Section Break',
                                fieldname: 'footer_section'
                            },
                            {
                                fieldtype: 'HTML',
                                fieldname: 'employee_list'
                            },
                            {
                                fieldtype: 'Section Break',
                                fieldname: 'footer_section'
                            },
                            {
                                fieldtype: 'Column Break',
                                fieldname: 'date_column'
                            },

                        ],
                        size: 'large', // Make dialog large
                        // Ẩn nút OK mặc định
                        primary_action_label: '',
                        primary_action: function () { }
                    });

                    // Xử lý sự kiện click cho nút OK tùy chỉnh
                    dialog.custom_action = function () {
                        // Get the selected date from dialog
                        let selected_date = dialog.get_value('register_date');

                        // Validate the selected date is not in the past
                        let today = frappe.datetime.get_today();
                        if (selected_date < today) {
                            frappe.msgprint({
                                title: __('Invalid Date'),
                                indicator: 'red',
                                message: __('Register date cannot be in the past. Please select today or a future date.')
                            });
                            return;
                        }

                        // Get selected employees
                        let selected = [];
                        dialog.$wrapper.find('input[type=checkbox]:checked').each(function () {
                            let employee_id = $(this).data('employee');
                            let employee_name = $(this).data('name');

                            selected.push({
                                employee_id: employee_id,
                                full_name: employee_name,
                                register_date: selected_date
                            });
                        });

                        if (selected.length === 0) {
                            frappe.msgprint(__('Please select at least one employee'));
                            return;
                        }

                        // Add selected employees to detail table
                        selected.forEach(emp => {
                            // Check if employee already exists in the table
                            let exists = false;
                            (frm.doc.detail || []).forEach(row => {
                                if (row.employee_id === emp.employee_id) {
                                    exists = true;
                                }
                            });

                            if (!exists) {
                                let row = frm.add_child('detail');
                                row.employee_id = emp.employee_id;
                                row.full_name = emp.full_name;
                                row.register_date = emp.register_date;

                                // Check for duplicates in submitted records
                                check_for_submitted_duplicates(frm, row.employee_id, row.register_date, frm.doc.detail.length - 1);
                            }
                        });

                        frm.refresh_field('detail');
                        dialog.hide();
                    };

                    // Create HTML table with three columns
                    let html = `
                    <div style="height: 600px; overflow-y: auto;">
                        <table class="table table-bordered">
                            <thead>
                                <tr>
                                    <th style="width: 30px;">
                                        <input type="checkbox" id="select-all">
                                    </th>
                                    <th>Employee ID</th>
                                    <th>Full name</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                    employees.forEach(emp => {
                        html += `
                        <tr>
                            <td>
                                <input type="checkbox" class="employee-check" data-employee="${emp.name}" data-name="${emp.employee_name}">
                            </td>
                            <td>${emp.name}</td>
                            <td>${emp.employee_name}</td>
                        </tr>
                    `;
                    });

                    html += `
                            </tbody>
                        </table>
                    </div>
                `;

                    dialog.fields_dict.employee_list.$wrapper.html(html);

                    // Add select all functionality
                    dialog.$wrapper.find('#select-all').on('click', function () {
                        let checked = $(this).prop('checked');
                        dialog.$wrapper.find('.employee-check').prop('checked', checked);
                    });

                    // Ẩn footer mặc định
                    dialog.$wrapper.find('.modal-footer').hide();

                    // Gắn sự kiện click cho nút OK tùy chỉnh
                    dialog.$wrapper.find('.custom-ok-btn').on('click', function () {
                        dialog.custom_action();
                    });

                    dialog.show();

                    // Set min date for register_date field in dialog
                    if (dialog.fields_dict.register_date && dialog.fields_dict.register_date.datepicker) {
                        dialog.fields_dict.register_date.datepicker.update({
                            minDate: new Date(frappe.datetime.get_today())
                        });
                    }
                }
            });
        });
    },

    group: function (frm) {
        if (frm.doc.group) {
            frm.set_value('select_group', frm.doc.group);
        }
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