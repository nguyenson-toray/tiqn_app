frappe.ui.form.on('Print Vegetarian Meal Registration Form', {
    onload: function (frm) {
        // Load groups from the tabGroup table
        load_groups(frm);
    },

    refresh: function (frm) {
        // In case we need to reload the groups
        if (!frm.fields_dict.employee_group.df.options || frm.fields_dict.employee_group.df.options === "") {
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

    employee_group: function (frm) {
        fetch_meal_details(frm);
    },
    sort_by: function (frm) {
        sort_meal_details(frm);
    }
});


function load_groups(frm) {
    frappe.call({
        method: 'tiqn_app.tiqn_app.doctype.print_vegetarian_meal_registration_form.print_vegetarian_meal_registration_form.get_groups',
        callback: function (r) {
            if (r.message && r.message.length) {
                // Set the options for the group field
                frm.set_df_property('employee_group', 'options', [''].concat(r.message).join('\n'));
                frm.refresh_field('employee_group');

                // Set default value to "All Groups" if nothing is selected
                if (!frm.doc.employee_group) {
                    frm.set_value('employee_group', '');
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
            employee_group: frm.doc.employee_group
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
                    row.employee_group = meal.employee_group;
                });
                frm.set_value('total_quantity', frm.doc.meal_detail ? frm.doc.meal_detail.length : 0);

                // Sort the data after loading
                sort_meal_details(frm);

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

// Sort meal details based on sort_by field
function sort_meal_details(frm) {
    if (!frm.doc.meal_detail || frm.doc.meal_detail.length === 0) {
        return;
    }

    let sort_by = frm.doc.sort_by || 'Group';
    let meal_details = frm.doc.meal_detail || [];

    // Sort the data based on the selected sort_by option
    meal_details.sort(function (a, b) {
        if (sort_by === 'Group') {
            // Sort by group first, then by employee_id
            if (a.employee_group === b.employee_group) {
                return (a.employee_id || '').localeCompare(b.employee_id || '');
            }
            return (a.employee_group || '').localeCompare(b.employee_group || '');
        } else if (sort_by === 'Register Date') {
            // Sort by register_date first, then by group, then by employee_id
            if (a.register_date === b.register_date) {
                if (a.employee_group === b.employee_group) {
                    return (a.employee_id || '').localeCompare(b.employee_id || '');
                }
                return (a.employee_group || '').localeCompare(b.employee_group || '');
            }

            // Handle date comparison
            const date_a = a.register_date ? new Date(a.register_date) : new Date(0);
            const date_b = b.register_date ? new Date(b.register_date) : new Date(0);
            return date_a - date_b;
        }
        return 0;
    });

    // Refresh the table to show the sorted data
    frm.refresh_field('meal_detail');
}

// Generate PDF directly in JavaScript using the meal_detail data
function generate_pdf(frm) {
    if (!frm.doc.meal_detail || frm.doc.meal_detail.length === 0) {
        frappe.msgprint(__('No meal details found. Please check your selection criteria.'));
        return;
    }

    // Generate HTML for the PDF
    const html_content = get_meal_ticket_html(frm.doc);

    // Call the server to convert HTML to PDF and save
    frappe.call({
        method: 'tiqn_app.tiqn_app.doctype.print_vegetarian_meal_registration_form.print_vegetarian_meal_registration_form.convert_html_to_pdf_and_save',
        args: {
            html_content: html_content,
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

// Generate HTML for the meal tickets
function get_meal_ticket_html(doc) {
    // Get ticket dimensions and scaling
    const ticket_width = parseFloat(doc.ticket_width || 55);
    const ticket_height = parseFloat(doc.ticket_hight || 30);
    const scale_percent = parseFloat(doc.scale_percent || 100) / 100;
    const a4_width = 210; // A4 width in mm
    const a4_height = 297; // A4 height in mm 

    // Calculate scaled dimensions for tickets
    const ticket_width_scaled = ticket_width * scale_percent;
    const ticket_height_scaled = ticket_height;// * scale_percent;
    const a4_width_scaled = a4_width * scale_percent;
    const a4_height_scaled = a4_height * scale_percent;
    // Fixed margins (not scaled)
    const page_margin_top = 0;
    const page_margin_left = 10;

    // Fixed spacing
    const spacing = 3;

    // Font size is scaled
    const font_size = 14;

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            /* Page settings */
            @page {
                size: A4 portrait;
                margin: 0;
            }
            
            /* Reset and base styles */
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: Arial, sans-serif;
                font-size: ${font_size}pt;
                line-height: 1.2;
                width: ${a4_width}mm;
                height: ${a4_height}mm;
            }
            
            /* Page container with fixed margins */
            .page {
                page-break-after: always;
                width: ${a4_width}mm;
                height: ${a4_height}mm;;
                margin: 0;
                padding: ${page_margin_top}mm 0 0 ${page_margin_left}mm;
                position: relative;
            }
            
            .page:last-child {
                page-break-after: avoid;
            }
            
            /* Table with fixed spacing */
            table.tickets {
                width: ${a4_width_scaled}mm;
                height: ${a4_height_scaled}mm;;
                border-collapse: separate;
                border-spacing: ${spacing}mm;
                table-layout: fixed;
                margin: 0;
            }
            
            /* Cell dimensions - scaled as requested */
            td {
                width: ${ticket_width_scaled}mm;
                height: ${ticket_height_scaled}mm;
                padding: 0;
                vertical-align: top;
            }
            
            /* Ticket styling */
            .ticket {
                border: 1px solid black;
                height: 100%;
                width: 100%;
                display: flex;
                flex-direction: column;
            }
            
            /* Header styling - ensure title stays on one line */
            .ticket-header {
                text-align: center;
                font-weight: bold;
                border-bottom: 1px solid black;
                padding: 2mm 0;
                white-space: nowrap;
                overflow: hidden;
            }
            
            /* Content area */
            .ticket-body {
                padding: 3mm;
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
            }
            
            /* Content lines */
            .line {
                margin-bottom: 2mm;
                line-height: 1.2;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            } 
        </style>
    </head>
    <body>
    `;

    const meal_details = doc.meal_detail || [];

    // Calculate how many pages are needed (24 tickets per page: 8 rows × 3 columns)
    const tickets_per_page = 24;
    const total_tickets = meal_details.length;
    let total_pages = Math.ceil(total_tickets / tickets_per_page);

    // Ensure at least one page is created
    if (total_pages === 0) {
        total_pages = 1;
    }

    // Vietnamese weekday map
    const weekday_map = {
        1: "2",  // Monday
        2: "3",
        3: "4",
        4: "5",
        5: "6",
        6: "7",
        0: "CN"  // Sunday
    };

    // Index to track current position in meal_details
    let detailIndex = 0;

    // Generate each page
    for (let page = 0; page < total_pages; page++) {
        // Start page
        html += '<div class="page">';
        // Add table with tickets
        html += '<table class="tickets">';

        // Create rows until we've processed all tickets or filled 8 rows
        let rowCount = 0;
        while (rowCount < 8 && detailIndex < meal_details.length) {
            html += '<tr>';

            // Get the employee_group for this row
            const currentGroup = meal_details[detailIndex].employee_group || "";

            // Process up to 3 tickets in this row, all from the same employee_group
            let colCount = 0;
            while (colCount < 3 && detailIndex < meal_details.length) {
                const item = meal_details[detailIndex];

                // If we hit a different group, break the loop to start a new row
                if ((item.employee_group || "") !== currentGroup && colCount > 0) {
                    break;
                }

                // Format the date
                let date_str = "";
                if (item.register_date) {
                    try {
                        // Parse the date
                        const reg_date = new Date(item.register_date);

                        // Get weekday and format date
                        const weekday = weekday_map[reg_date.getDay()];
                        date_str = `Thứ ${weekday} Ngày ${reg_date.getDate()}/${reg_date.getMonth() + 1}`;
                    } catch (e) {
                        console.error("Date parsing error:", e);
                    }
                }

                // Get other fields
                const employee_group = item.employee_group || "";
                const name = item.full_name || "";
                const ticket_number = detailIndex + 1;  // Sequence number (1-based)

                // Create populated ticket with sequence number
                html += `
                <td>
                    <div class="ticket">
                        <div class="ticket-header">PHIẾU CƠM CHAY   (${ticket_number})</div>
                        <div class="ticket-body">
                            <div class="line">${date_str}</div>
                            <div class="line">${employee_group}</div>
                            <div class="line">${name}</div>
                        </div>
                    </div>
                </td>
                `;

                colCount++;
                detailIndex++;
            }

            // Fill remaining columns in the row with empty cells
            for (let i = colCount; i < 3; i++) {
                html += '<td></td>';
            }

            // End row
            html += '</tr>';
            rowCount++;
        }

        // Fill any remaining rows with empty rows
        for (let i = rowCount; i < 8; i++) {
            html += '<tr>';
            for (let j = 0; j < 3; j++) {
                html += '<td></td>';
            }
            html += '</tr>';
        }

        // End table and page
        html += '</table>';
        html += '</div>';

        // Add page break if not the last page and we have more tickets to process
        if (page < total_pages - 1 && detailIndex < meal_details.length) {
            html += '<div style="page-break-after: always;"></div>';
        }
    }

    // End document
    html += `
    </body>
    </html>
    `;

    return html;
}