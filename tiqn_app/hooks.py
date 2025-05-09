app_name = "tiqn_app"
app_title = "TIQN App"
app_publisher = "IT Team"
app_description = "TIQN App"
app_email = "it@tiqn.com.vn"
app_license = "mit"

# Apps
# ------------------
# Hướng dẫn sử dụng fixtures để export từ site A và import vào site B
#  Site A
    # 1 : Chỉnh sửa Doctype, field, workspace Web UI
    # 2 : export ra thư mục fixture chứa các file json : bench --site erp-sonnt.tiqn.local export-fixtures
    #     Commit & push lên git
#  Site B
    # 1 : Pull code về
    # 2 : Chạy lệnh bench --site erp.tiqn.local clear-cache
    # 3 : Chạy lệnh bench --site erpt.tiqn.local migrate    
    # hoặc cho 1 app cụ thể : bench --site erp.tiqn.local import-fixtures --app customize_erpnext  
fixtures = [ 
     {
        "doctype": "Custom Field",
        "filters": [
            [
                "name",
                "in",
                [
                    # "Stock Entry-custom_%",
                    # "Sales Order Item-custom_%", 
                    # "Sales Order-section_break_%",
                    # "Sales Order-sum_by_country", 
                    # "Sales Order-sum_by_delivery_date", 
                    # "Sales Order-sum_by_sku",
                    # "BOM Item-custom_%", 
                    # "Material Request Item-custom_%",
                    # "Production Plan-custom_%",
                    # "Employee-custom_%", 
                ]
            ]
        ]
    },
    # Custom Workspace
    {
        "doctype": "Workspace",
        "filters": [
            ["name", "in", ["Registration"]]
        ]
    },
    # Property Setter
    {
        "doctype": "Property Setter",
        "filters": [
            ["doc_type", "in", [
                # "Sales Invoice", "Purchase Invoice"
                ]]
        ]
    }
]


# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "tiqn_app",
# 		"logo": "/assets/tiqn_app/logo.png",
# 		"title": "TIQN App",
# 		"route": "/tiqn_app",
# 		"has_permission": "tiqn_app.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/tiqn_app/css/tiqn_app.css"
# app_include_js = "/assets/tiqn_app/js/tiqn_app.js"

# include js, css files in header of web template
# web_include_css = "/assets/tiqn_app/css/tiqn_app.css"
# web_include_js = "/assets/tiqn_app/js/tiqn_app.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "tiqn_app/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "tiqn_app/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "tiqn_app.utils.jinja_methods",
# 	"filters": "tiqn_app.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "tiqn_app.install.before_install"
# after_install = "tiqn_app.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "tiqn_app.uninstall.before_uninstall"
# after_uninstall = "tiqn_app.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "tiqn_app.utils.before_app_install"
# after_app_install = "tiqn_app.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "tiqn_app.utils.before_app_uninstall"
# after_app_uninstall = "tiqn_app.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "tiqn_app.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"tiqn_app.tasks.all"
# 	],
# 	"daily": [
# 		"tiqn_app.tasks.daily"
# 	],
# 	"hourly": [
# 		"tiqn_app.tasks.hourly"
# 	],
# 	"weekly": [
# 		"tiqn_app.tasks.weekly"
# 	],
# 	"monthly": [
# 		"tiqn_app.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "tiqn_app.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "tiqn_app.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "tiqn_app.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["tiqn_app.utils.before_request"]
# after_request = ["tiqn_app.utils.after_request"]

# Job Events
# ----------
# before_job = ["tiqn_app.utils.before_job"]
# after_job = ["tiqn_app.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"tiqn_app.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

