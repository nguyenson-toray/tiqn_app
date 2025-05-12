// Copyright (c) 2025, IT Team and contributors
// For license information, please see license.txt

frappe.ui.form.on("Vegetarian Meal Checking", {
    onload: function (frm) {
        if (frm.doc.__islocal) {  // Cách đúng để kiểm tra nếu đây là bản ghi mới
            // Sử dụng frappe.datetime.get_today() để lấy ngày hiện tại
            frm.set_value('register_date', frappe.datetime.get_today());
        }
    },
    refresh(frm) {

    },
    register_date: function (frm) {
        if (frm.doc.register_date) {
            // Loop through all rows in detail table
            $.each(frm.doc.detail || [], function (i, detail) {
                detail.register_date = frm.doc.register_date;
                console.log('set date ' + frm.doc.register_date);
            });

            frm.refresh_field("detail");
        }
    },
    scan_employee_id(frm) {
        if (frm.doc.scan_employee_id) {
            frappe.msgprint(__("Employee : {0}", [frm.doc.scan_employee_id]));

            // Lấy thông tin của nhân viên
            frappe.db.get_value("Employee", { employee: frm.doc.scan_employee_id }, ["employee_name", "custom_line_team"], (r) => {
                if (r.employee_name) {
                    // Kiểm tra đăng ký thông qua phương thức server-side
                    frappe.call({
                        method: "tiqn_app.tiqn_app.doctype.vegetarian_meal_checking.vegetarian_meal_checking.check_meal_registration",
                        args: {
                            "employee_id": frm.doc.scan_employee_id,
                            "register_date": frm.doc.register_date
                        },
                        callback: function (response) {
                            let registed = response.message;
                            let row = frm.add_child("detail", {
                                register_date: frm.doc.register_date,
                                employee_id: frm.doc.scan_employee_id,
                                full_name: r.employee_name,
                                line_team: r.custom_line_team,
                                registed: registed
                            });
                            // Refresh để hiển thị dữ liệu mới
                            frm.refresh_field('detail');

                            // Xóa giá trị scan_employee_id để sẵn sàng cho lần quét tiếp theo
                            frm.set_value('scan_employee_id', '');
                        }
                    });
                } else {
                    frappe.msgprint(__("Employee not found"));

                    // Xóa giá trị scan_employee_id nếu không tìm thấy nhân viên
                    frm.set_value('scan_employee_id', '');
                }
            });
        }
    }
});

frappe.ui.form.on("Vegetarian Meal Detail Checking", {
    detail_add: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        if (frm.doc.register_date) {
            row.register_date = frm.doc.register_date;
            frm.refresh_field("detail");
            console.log('Set register_date for new row: ' + frm.doc.register_date);
        }
    },

    // Thêm sự kiện khi employee_id được cập nhật trong row detail
    employee_id: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];

        if (row.employee_id && frm.doc.register_date) {
            // Lấy thông tin nhân viên khi employee_id thay đổi
            frappe.db.get_value("Employee", { name: row.employee_id }, ["employee_name", "custom_line_team"], function (emp_r) {
                if (emp_r && emp_r.employee_name) {
                    // Cập nhật thông tin nhân viên vào row
                    frappe.model.set_value(cdt, cdn, "full_name", emp_r.employee_name);
                    frappe.model.set_value(cdt, cdn, "line_team", emp_r.custom_line_team);

                    // Kiểm tra đăng ký meal
                    frappe.call({
                        method: "tiqn_app.tiqn_app.doctype.vegetarian_meal_checking.vegetarian_meal_checking.check_meal_registration",
                        args: {
                            "employee_id": row.employee_id,
                            "register_date": frm.doc.register_date
                        },
                        callback: function (response) {
                            // Cập nhật trường registed dựa trên kết quả
                            frappe.model.set_value(cdt, cdn, "registed", response.message);

                            // Thông báo nếu đã đăng ký
                            if (response.message === 1) {
                                frappe.show_alert(__("Employee {0} already registered for meal", [row.employee_id]), 5);
                            }
                        }
                    });
                }
            });
        }
    },

    // Nếu ngày thay đổi trên một hàng cụ thể, cũng cần kiểm tra lại
    register_date: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];

        if (row.employee_id && row.register_date) {
            frappe.call({
                method: "tiqn_app.tiqn_app.doctype.vegetarian_meal_checking.vegetarian_meal_checking.check_meal_registration",
                args: {
                    "employee_id": row.employee_id,
                    "register_date": row.register_date
                },
                callback: function (response) {
                    frappe.model.set_value(cdt, cdn, "registed", response.message);
                }
            });
        }
    }
});