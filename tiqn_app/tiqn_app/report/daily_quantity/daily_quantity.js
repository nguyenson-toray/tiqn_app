// Copyright (c) 2025, IT Team and contributors
// For license information, please see license.txt

frappe.query_reports["Daily Quantity"] = {
	"filters": [
		{
			"fieldname": "from_date",
			"label": __("From Date"),
			"fieldtype": "Date",
			"default": get_monday_of_current_week(),
			"reqd": 1,
			"on_change": function () {
				let from_date = frappe.query_report.get_filter_value('from_date');
				let to_date = frappe.query_report.get_filter_value('to_date');

				if (from_date && to_date && from_date > to_date) {
					frappe.query_report.set_filter_value('to_date', from_date);
				}
				// Kích hoạt chạy lại báo cáo khi thay đổi giá trị
				frappe.query_report.refresh();
			}
		},
		{
			"fieldname": "to_date",
			"label": __("To Date"),
			"fieldtype": "Date",
			"default": get_saturday_of_current_week(),
			"reqd": 1,
			"on_change": function () {
				let from_date = frappe.query_report.get_filter_value('from_date');
				let to_date = frappe.query_report.get_filter_value('to_date');

				if (from_date && to_date && to_date < from_date) {
					frappe.query_report.set_filter_value('from_date', to_date);
				}
				// Kích hoạt chạy lại báo cáo khi thay đổi giá trị
				frappe.query_report.refresh();
			}
		},
		{
			"fieldname": "employee_group",
			"label": __("Group"),
			"fieldtype": "Select",
			"options": "\n", // Bắt đầu với một option trống
			"reqd": 0
		}
	],

	onload: function (report) {
		// Tải danh sách group khi báo cáo được tải
		frappe.call({
			method: "tiqn_app.tiqn_app.report.daily_quantity.daily_quantity.get_groups",
			callback: function (r) {
				if (!r.exc && r.message) {
					let options = [""];
					options = options.concat(r.message || []);

					// Cập nhật options cho filter
					let group_filter = frappe.query_report.get_filter('employee_group');
					group_filter.df.options = options.join("\n");
					group_filter.refresh();
				} else if (r.exc) {
					console.error("Error:", r.exc);
					frappe.msgprint(__("Không thể tải danh sách Group. Lỗi: ") + r.exc);
				}
			}
		});
	}
};

// Hàm lấy ngày thứ 2 (Monday) của tuần hiện tại
function get_monday_of_current_week() {
	let today = frappe.datetime.get_today();
	let day_of_week = moment(today).day(); // 0 là Chủ nhật, 1 là Thứ 2, ..., 6 là Thứ 7

	// Nếu today là Chủ nhật (0), lùi 6 ngày để lấy Thứ 2 tuần trước
	// Nếu today là các ngày khác, lùi (day_of_week - 1) ngày để lấy Thứ 2
	let days_to_subtract = day_of_week === 0 ? 6 : day_of_week - 1;

	return frappe.datetime.add_days(today, -days_to_subtract);
}

// Hàm lấy ngày thứ 7 (Saturday) của tuần hiện tại
function get_saturday_of_current_week() {
	let today = frappe.datetime.get_today();
	let day_of_week = moment(today).day(); // 0 là Chủ nhật, 1 là Thứ 2, ..., 6 là Thứ 7

	// Nếu today là Chủ nhật (0), lùi 1 ngày để lấy Thứ 7 tuần trước
	// Nếu today là Thứ 7 (6), không cần thay đổi
	// Nếu today là các ngày khác, thêm (6 - day_of_week) ngày để lấy Thứ 7
	let days_to_add = day_of_week === 0 ? -1 : (day_of_week === 6 ? 0 : 6 - day_of_week);

	return frappe.datetime.add_days(today, days_to_add);
}