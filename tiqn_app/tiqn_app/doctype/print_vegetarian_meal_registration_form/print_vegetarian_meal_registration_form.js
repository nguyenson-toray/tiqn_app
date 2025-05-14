frappe.ui.form.on('Print Vegetarian Meal Registration Form', {
    onload: function (frm) {
        // Load groups from the tabGroup table
        load_groups(frm);
    },

    refresh: function (frm) {
        // In case we need to reload the groups
        if (!frm.fields_dict.group.df.options || frm.fields_dict.group.df.options === "") {
            load_groups(frm);
        }

        // Disable Save and add guidance message
        frm.disable_save();
        frm.page.set_indicator(__('Not Saved'), 'orange');

        // Add Generate button
        frm.add_custom_button(__('Generate Ticket - PDF'), function () {
            generate_pdf(frm);
        }).addClass('btn-primary');
    },

    from_date: function (frm) {
        fetch_meal_details(frm);
    },

    to_date: function (frm) {
        fetch_meal_details(frm);
    },

    group: function (frm) {
        fetch_meal_details(frm);
    }
});


function load_groups(frm) {
    frappe.call({
        method: 'tiqn_app.tiqn_app.doctype.print_vegetarian_meal_registration_form.print_vegetarian_meal_registration_form.get_groups',
        callback: function (r) {
            if (r.message && r.message.length) {
                // Set the options for the group field
                frm.set_df_property('group', 'options', [''].concat(r.message).join('\n'));
                frm.refresh_field('group');

                // Set default value to "All Groups" if nothing is selected
                if (!frm.doc.group) {
                    frm.set_value('group', 'All Groups');
                }
            }
        }
    });
}

function fetch_meal_details(frm) {
    if (!frm.doc.from_date || !frm.doc.to_date) {
        // Only proceed if date fields are filled
        return;
    }

    // Group can be empty or "All Groups" now
    frappe.call({
        method: 'tiqn_app.tiqn_app.doctype.print_vegetarian_meal_registration_form.print_vegetarian_meal_registration_form.get_meal_details',
        args: {
            from_date: frm.doc.from_date,
            to_date: frm.doc.to_date,
            group: frm.doc.group
        },
        freeze: true,
        freeze_message: __('Fetching meal details...'),
        callback: function (r) {
            if (r.message) {
                frm.clear_table('meal_detail');

                r.message.forEach(function (meal) {
                    let row = frm.add_child('meal_detail');
                    row.employee_id = meal.employee_id;
                    row.full_name = meal.full_name;
                    row.register_date = meal.register_date;
                    row.group = meal.group;
                });
                frm.set_value('total_quantity', frm.doc.meal_detail ? frm.doc.meal_detail.length : 0);

                frm.refresh_field('meal_detail');

                if (r.message.length > 0) {
                    frappe.show_alert({
                        message: __('Successfully fetched {0} meal records', [r.message.length]),
                        indicator: 'green'
                    });
                } else {
                    frappe.show_alert({
                        message: __('No meal records found for the selected criteria'),
                        indicator: 'orange'
                    });
                }
            }
        }
    });

}

function generate_pdf(frm) {
    if (!frm.doc.meal_detail || frm.doc.meal_detail.length === 0) {
        frappe.msgprint(__('No meal details found. Please check your selection criteria.'));
        return;
    }

    frappe.call({
        method: 'tiqn_app.tiqn_app.doctype.print_vegetarian_meal_registration_form.print_vegetarian_meal_registration_form.generate_meal_registration_pdf',
        args: {
            from_date: frm.doc.from_date,
            to_date: frm.doc.to_date,
            group: frm.doc.group
        },
        freeze: true,
        freeze_message: __('Generating PDF...'),
        callback: function (r) {
            if (r.message && r.message.success) {
                frappe.show_alert({
                    message: __('PDF Generated Successfully'),
                    indicator: 'green'
                });

                // Open the PDF
                if (r.message.file_url) {
                    window.open(r.message.file_url, '_blank');
                }
            } else {
                frappe.msgprint({
                    title: __('Error'),
                    indicator: 'red',
                    message: r.message && r.message.message || 'Failed to generate PDF'
                });
            }
        }
    });
}