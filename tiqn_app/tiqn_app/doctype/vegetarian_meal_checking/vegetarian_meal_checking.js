// Copyright (c) 2025, IT Team and contributors
// For license information, please see license.txt

frappe.ui.form.on("Vegetarian Meal Checking", {
    onload: function (frm) {
        if (frm.doc.__islocal) {  //  kiểm tra nếu đây là bản ghi mới 
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
            // Sử dụng hàm get_employee_details để lấy thông tin nhân viên
            frappe.call({
                method: "tiqn_app.tiqn_app.doctype.vegetarian_meal_checking.vegetarian_meal_checking.get_employee_details",
                args: {
                    "employee_id": frm.doc.scan_employee_id
                },
                callback: function (r) {
                    // Kiểm tra nếu có kết quả trả về
                    if (r.message && r.message.employee_name) {
                        // Lấy thông tin nhân viên từ kết quả trả về
                        let employee_info = r.message;

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
                                    full_name: employee_info.employee_name,
                                    group: employee_info.custom_group,
                                    registed: registed
                                });
                                // Refresh để hiển thị dữ liệu mới
                                frm.refresh_field('detail');

                                if (registed) {
                                    frappe.show_alert({
                                        message: __(employee_info.employee_name + " Already Registed on " + frm.doc.register_date),
                                        indicator: 'green'
                                    }, 5);
                                }
                                else {
                                    frappe.show_alert({
                                        message: __(employee_info.employee_name + " Not Registed on " + frm.doc.register_date),
                                        indicator: 'red'
                                    }, 5);
                                }
                                // Xóa giá trị scan_employee_id để sẵn sàng cho lần quét tiếp theo
                                frm.set_value('scan_employee_id', '');

                                // Tự động mở lại chức năng quét sau khi xử lý xong
                                setTimeout(function () {
                                    // Tìm và nhấp vào nút quét
                                    frm.fields_dict.scan_employee_id.$input.parent().find('.btn-open').click();
                                }, 300);
                            }
                        });
                    } else {
                        frappe.msgprint(__("Employee not found"));

                        // Xóa giá trị scan_employee_id nếu không tìm thấy nhân viên
                        frm.set_value('scan_employee_id', '');

                        // Tự động mở lại chức năng quét sau khi xử lý xong
                        setTimeout(function () {
                            // Tìm và nhấp vào nút quét
                            frm.fields_dict.scan_employee_id.$input.parent().find('.btn-open').click();
                        }, 500);
                    }
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
            // Sử dụng hàm get_employee_details để lấy thông tin nhân viên
            frappe.call({
                method: "tiqn_app.tiqn_app.doctype.vegetarian_meal_checking.vegetarian_meal_checking.get_employee_details",
                args: {
                    "employee_id": row.employee_id
                },
                callback: function (r) {
                    if (r.message && r.message.employee_name) {
                        let employee_info = r.message;

                        // Cập nhật thông tin nhân viên vào row
                        frappe.model.set_value(cdt, cdn, "full_name", employee_info.employee_name);
                        frappe.model.set_value(cdt, cdn, "group", employee_info.custom_group);

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
                                    frappe.show_alert({
                                        message: __("Employee {0} already registered for meal", [row.employee_id]),
                                        indicator: 'green'
                                    }, 5);
                                } else {
                                    frappe.show_alert({
                                        message: __("Employee {0} not registered for meal", [row.employee_id]),
                                        indicator: 'red'
                                    }, 5);
                                }
                            }
                        });
                    }
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

                    // Thông báo kết quả
                    if (response.message === 1) {
                        frappe.show_alert({
                            message: __("Employee {0} already registered for meal on {1}", [row.employee_id, row.register_date]),
                            indicator: 'green'
                        }, 5);
                    } else {
                        frappe.show_alert({
                            message: __("Employee {0} not registered for meal on {1}", [row.employee_id, row.register_date]),
                            indicator: 'red'
                        }, 5);
                    }
                }
            });
        }
    }
});