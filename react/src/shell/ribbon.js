import {
  RefreshCw, CalendarPlus, Building2, Gauge, Bell, Users, Truck, ClipboardCheck, ShieldCheck,
  History, Printer, Download, Mail, Share2, Pencil, IdCard, XCircle, Award, LayoutGrid,
  Receipt, CreditCard, FilterX, UserPlus, Lock, UserX, Car, Network, CarFront, UsersRound,
  BadgeCheck, CalendarClock, Upload, Wrench, AlertTriangle, RotateCcw, Eye, CircleAlert,
  CheckSquare, ArrowUp, MessageSquare, X, CalendarDays, Repeat, FileCheck2, Search, Filter,
  Calendar, User, FileText, SlidersHorizontal, Palette, Globe, Plug, KeyRound, Smartphone,
  Database, PanelLeft, Rows3, Columns3, ChevronsUp, Maximize, Settings, Info, Clock,
  TrendingUp, PieChart, BarChart3, Percent, Trash2, Files, Play, Package, CheckCircle2,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   One tenant's workspace: every tab works this company's own
   fleet, people and sheets. There is no cross-company view.
   ══════════════════════════════════════════════════════════════ */

export const TABS = [
  { key: 'dashboard', label: 'Dashboard' }, { key: 'inspections', label: 'Inspections' },
  { key: 'fleet', label: 'Fleet' }, { key: 'workshop', label: 'Workshop' },
  { key: 'users', label: 'Users' }, { key: 'hierarchy', label: 'Hierarchy' },
  { key: 'compliance', label: 'Compliance' }, { key: 'audit', label: 'Audit log' },
  { key: 'reports', label: 'Reports' }, { key: 'analytics', label: 'Analytics' },
  { key: 'profile', label: 'Company' }, { key: 'settings', label: 'Settings' },
  { key: 'view', label: 'View' },
];

export const CTX = {
  inspections: ['Inspection tools', '#2120352'],
  fleet: ['Vehicle tools', 'CA 123 GP'],
  workshop: ['Workshop tools', 'Work orders'],
  users: ['User tools', 'Johan Swart'],
  compliance: ['Safety tools', 'Certificates'],
  profile: ['Company tools', 'Acme Mining Corp'],
};

export const RIBBON = {
  dashboard: [
    { label: 'Period', lg: [[RefreshCw, 'Refresh\ndata', 'refresh'], [CalendarPlus, 'Change\nperiod', 'period']], sm: [[Building2, 'Site roll-up', 'goto:analytics'], [Gauge, 'Targets', 'goto:settings'], [Bell, 'Alert rules', 'alerts']] },
    { label: 'Go to', lg: [[ClipboardCheck, 'Inspections', 'goto:inspections'], [Truck, 'Fleet', 'goto:fleet']], sm: [[Wrench, 'Workshop', 'goto:workshop'], [Users, 'Users', 'goto:users'], [ShieldCheck, 'Compliance', 'goto:compliance']] },
    { label: 'Share', lg: [[Printer, 'Print\nboard', 'print']], sm: [[Download, 'Export CSV', 'export'], [Mail, 'Email board', 'email'], [Share2, 'Send to a site', 'email']] },
  ],
  inspections: [
    { label: 'Capture', lg: [[ClipboardCheck, 'Start\ninspection', 'startInspection'], [FileCheck2, 'Choose\nform', 'inspView:forms']], sm: [[CheckSquare, 'Sign off', 'signOff'], [Eye, 'Open sheet', 'openInspection'], [X, 'Return to operator', 'rejectInspection']] },
    { label: 'Defects', lg: [[AlertTriangle, 'Defect\nregister', 'inspView:defects'], [Clock, 'Lapsed\nconcessions', 'lapsedConcessions']], sm: [[CheckSquare, 'Sign concession', 'signConcession'], [Wrench, 'Raise work order', 'raiseWO'], [CheckCircle2, 'Close defect', 'closeDefect']] },
    { label: 'Forms', lg: [[FileCheck2, 'Form\nregister', 'inspView:forms']], sm: [[Repeat, 'New revision', 'reviseForm'], [CheckCircle2, 'Publish form', 'publishForm'], [Files, 'Duplicate', 'duplicateForm']] },
    { label: 'Output', lg: [[Printer, 'Print\nsheet', 'print']], sm: [[Download, 'Export CSV', 'export'], [Mail, 'Email the sheet', 'email']] },
  ],
  fleet: [
    { label: 'Vehicles', lg: [[Truck, 'New\nvehicle', 'dlg:vehicle'], [Car, 'Assign to\noperator', 'assignVehicle']], sm: [[Pencil, 'Edit vehicle', 'editVehicle'], [Gauge, 'Update odometer', 'logOdo'], [CarFront, 'Unassign', 'unassignVehicle']] },
    { label: 'Status', lg: [[XCircle, 'Take off\nroad', 'ground'], [RotateCcw, 'Return to\nservice', 'returnService']], sm: [[Wrench, 'Book a service', 'bookService'], [ClipboardCheck, 'Pre-use check', 'startInspection'], [CircleAlert, 'Open defects', 'inspView:defects']] },
    { label: 'Compliance', lg: [[BadgeCheck, 'COF\nregister', 'goto:compliance']], sm: [[CalendarClock, 'Service due list', 'serviceDue'], [FileCheck2, 'Licence renewals', 'licences'], [Upload, 'Upload document', 'upload']] },
    { label: 'Output', lg: [[Printer, 'Print\ncard', 'print']], sm: [[Download, 'Export CSV', 'export'], [BarChart3, 'Fleet report', 'report:Fleet status report']] },
  ],
  workshop: [
    { label: 'Work orders', lg: [[Wrench, 'Raise work\norder', 'raiseWO'], [Play, 'Move to\nin progress', 'woStatus:In progress']], sm: [[Package, 'Awaiting parts', 'woStatus:Awaiting parts'], [CheckCircle2, 'Complete', 'woStatus:Completed'], [Eye, 'Open the defect', 'openWODefect']] },
    { label: 'Vehicle', lg: [[Truck, 'Open the\nvehicle', 'openWOVehicle']], sm: [[RotateCcw, 'Return to service', 'returnService'], [ClipboardCheck, 'Re-inspect', 'startInspection']] },
    { label: 'Output', lg: [[Printer, 'Print\njob card', 'print']], sm: [[Download, 'Export CSV', 'export'], [FileText, 'Workshop report', 'report:Workshop report']] },
  ],
  users: [
    { label: 'People', lg: [[UserPlus, 'New\nuser', 'dlg:user'], [Pencil, 'Edit\nuser', 'editUser']], sm: [[IdCard, 'Open record', 'openUser'], [KeyRound, 'Reset password', 'resetPassword'], [ShieldCheck, 'Enforce 2FA', 'enforceMfa']] },
    { label: 'Lifecycle', lg: [[UserX, 'Suspend\nuser', 'suspendUser'], [Trash2, 'Delete\nuser', 'deleteUser']], sm: [[BadgeCheck, 'Reactivate', 'reactivateUser'], [Network, 'Change supervisor', 'editUser'], [Mail, 'Resend invitation', 'resendInvite']] },
    { label: 'Assignment', lg: [[Car, 'Assign\nvehicle', 'assignUserVehicle'], [CarFront, 'Unassign\nvehicle', 'unassignUserVehicle']], sm: [[UsersRound, 'Bulk assign', 'bulkAssign'], [Network, 'Open hierarchy', 'goto:hierarchy'], [Truck, 'Open the vehicle', 'openUserVehicle']] },
    { label: 'Certificates', lg: [[BadgeCheck, 'COF\nregister', 'goto:compliance']], sm: [[CalendarClock, 'Expiry reminders', 'alerts'], [Upload, 'Upload certificate', 'upload']] },
    { label: 'Output', lg: [[Printer, 'Print\nlist', 'print']], sm: [[Download, 'Export CSV', 'export'], [Mail, 'Email selected', 'email']] },
  ],
  hierarchy: [
    { label: 'Structure', lg: [[Network, 'Change\nsupervisor', 'editUser'], [UserPlus, 'New\nuser', 'dlg:user']], sm: [[Users, 'Open the person', 'goto:users'], [UserX, 'Detach user', 'editUser'], [RefreshCw, 'Rebuild tree', 'refresh']] },
    { label: 'Gaps', lg: [[CircleAlert, 'Unassigned\nitems', 'unassigned']], sm: [[Car, 'Assign vehicle', 'assignUserVehicle'], [UsersRound, 'Bulk assign', 'bulkAssign']] },
    { label: 'Output', lg: [[Printer, 'Print\nchart', 'print']], sm: [[Download, 'Export CSV', 'export']] },
  ],
  compliance: [
    { label: 'Certificates', lg: [[BadgeCheck, 'COF\nregister', 'cofRegister'], [Upload, 'Upload\ncertificate', 'upload']], sm: [[Bell, 'Expiry reminders', 'alerts'], [Mail, 'Notify the operator', 'email'], [CalendarPlus, 'Book a renewal', 'bookRenewal']] },
    { label: 'Defects', lg: [[AlertTriangle, 'No-go\nregister', 'noGoRegister'], [Clock, 'Lapsed\nconcessions', 'lapsedConcessions']], sm: [[Wrench, 'Raise work order', 'raiseWO'], [CheckCircle2, 'Close defect', 'closeDefect'], [RotateCcw, 'Return to service', 'returnService']] },
    { label: 'Assurance', lg: [[ShieldCheck, 'Compliance\nreport', 'report:Compliance report']], sm: [[History, 'Audit trail', 'goto:audit'], [Download, 'Export CSV', 'export'], [Printer, 'Print', 'print']] },
  ],
  audit: [
    { label: 'Trail', lg: [[Search, 'Search\ntrail', 'searchAudit'], [Filter, 'Filter\nactions', 'filterAudit']], sm: [[Calendar, 'Date range', 'dateRange'], [User, 'By user', 'byUser'], [FilterX, 'Clear filters', 'clearFilters']] },
    { label: 'Governance', lg: [[FileText, 'Retention\npolicy', 'retention']], sm: [[Lock, 'Verify integrity', 'verify'], [Download, 'Export audit', 'export'], [Printer, 'Print', 'print']] },
  ],
  profile: [
    { label: 'Company', lg: [[Pencil, 'Edit\nprofile', 'editCompany'], [IdCard, 'Contact\ndetails', 'editCompany']], sm: [[UserPlus, 'Add user', 'dlg:user'], [Truck, 'Add vehicle', 'dlg:vehicle'], [Upload, 'Upload documents', 'upload']] },
    { label: 'Subscription', lg: [[Award, 'Change\nplan', 'upgrade'], [LayoutGrid, 'Manage\nmodules', 'modules']], sm: [[Receipt, 'Billing and invoices', 'billing'], [CreditCard, 'Payment method', 'billing'], [Download, 'Download invoice', 'export']] },
    { label: 'Output', lg: [[Printer, 'Print\nprofile', 'print']], sm: [[Download, 'Export CSV', 'export'], [Mail, 'Email profile', 'email']] },
  ],
  reports: [
    { label: 'Operations', lg: [[ClipboardCheck, 'Inspection\nreport', 'report:Inspection report'], [Truck, 'Fleet status\nreport', 'report:Fleet status report']], sm: [[Users, 'User activity', 'report:User activity report'], [Wrench, 'Workshop report', 'report:Workshop report']] },
    { label: 'Safety', lg: [[ShieldCheck, 'Compliance\nreport', 'report:Compliance report'], [AlertTriangle, 'Defect\nhistory', 'report:Defect history']], sm: [[BadgeCheck, 'COF expiry', 'report:COF expiry report'], [Clock, 'Lapsed concessions', 'lapsedConcessions']] },
    { label: 'Output', lg: [[Printer, 'Print\nreport', 'print']], sm: [[Download, 'Export CSV', 'export'], [Mail, 'Email report', 'email'], [Repeat, 'Schedule report', 'schedule']] },
  ],
  analytics: [
    { label: 'Views', lg: [[BarChart3, 'Results\nbreakdown', 'refresh'], [TrendingUp, 'Trend\nanalysis', 'refresh']], sm: [[Percent, 'Pass rate', 'refresh'], [Clock, 'Aging profile', 'refresh'], [PieChart, 'By site', 'refresh']] },
    { label: 'Period', lg: [[CalendarPlus, 'Change\nperiod', 'period']], sm: [[RefreshCw, 'Refresh data', 'refresh'], [FilterX, 'Clear filters', 'clearFilters']] },
    { label: 'Output', lg: [[Printer, 'Print\ncharts', 'print']], sm: [[Download, 'Export CSV', 'export'], [Mail, 'Email analysis', 'email']] },
  ],
  settings: [
    { label: 'Platform', lg: [[SlidersHorizontal, 'General\noptions', 'refresh'], [Palette, 'Branding', 'branding']], sm: [[Globe, 'Localisation', 'refresh'], [Mail, 'Email templates', 'templates'], [Plug, 'Integrations', 'integrations']] },
    { label: 'Inspection rules', lg: [[ClipboardCheck, 'Capture\nrules', 'refresh']], sm: [[Clock, 'Go-but window', 'refresh'], [Gauge, 'Targets', 'refresh'], [Bell, 'Alert rules', 'alerts']] },
    { label: 'Security', lg: [[ShieldCheck, 'Access\npolicy', 'refresh'], [KeyRound, 'Roles and\npermissions', 'roles']], sm: [[Lock, 'Password policy', 'refresh'], [Smartphone, 'Two-factor', 'enforceMfa'], [History, 'Login audit', 'goto:audit']] },
    { label: 'Data', lg: [[Database, 'Backups', 'backups']], sm: [[Download, 'Export data', 'export'], [Upload, 'Import data', 'import'], [FileText, 'Retention policy', 'retention']] },
  ],
  view: [
    { label: 'Layout', lg: [[PanelLeft, 'Navigation\npane', 'toggleNav'], [Rows3, 'Row\ndensity', 'density']], sm: [[Columns3, 'Reading pane', 'togglePane'], [ChevronsUp, 'Collapse ribbon', 'collapse'], [Maximize, 'Full screen', 'fullscreen']] },
    { label: 'Data', lg: [[RefreshCw, 'Refresh', 'refresh']], sm: [[FilterX, 'Clear filters', 'clearFilters'], [Download, 'Export CSV', 'export'], [Printer, 'Print', 'print']] },
    { label: 'Window', lg: [[Settings, 'Options', 'goto:settings']], sm: [[Bell, 'Notifications', 'alerts'], [Info, 'About SafeNexus', 'about']] },
  ],
};

export const JUMPS = [
  ['Awaiting sign-off', ClipboardCheck, 'goto:inspections'],
  ['Grounded vehicles', AlertTriangle, 'goto:fleet'],
  ['Lapsed concessions', Clock, 'lapsedConcessions'],
  ['Open work orders', Wrench, 'goto:workshop'],
  ['Unassigned operators', UserX, 'goto:hierarchy'],
  ['Audit trail', History, 'goto:audit'],
];

export const MESSAGES = {
  refresh: 'Data refreshed from SAFENEXUS-SQL01.', save: 'Workspace saved.',
  undo: 'Last action undone.', redo: 'Action reapplied.',
  print: 'Sent to the print queue.', export: 'Export written to CSV.',
  email: 'Draft opened in the mail client.', period: 'Period changed to June 2026.',
  targets: 'Compliance target held at 90%.', alerts: 'Alert rules opened.',
  signOff: 'Sign-off recorded against the selected inspection.',
  openInspection: 'Inspection #2120352 opened.', addNote: 'Note added to the inspection.',
  escalate: 'Escalated to the safety officer.', reject: 'Capture rejected and returned to the operator.',
  assignVehicle: 'Vehicle assignment recorded.', unassignVehicle: 'Vehicle returned to the pool.',
  assignSupervisor: 'Supervisor assignment recorded.', bulkAssign: 'Bulk assignment queued for 8 operators.',
  moveUnder: 'User moved in the hierarchy.', detach: 'User detached from the hierarchy.',
  unassigned: '3 operators and 8 vehicles are unassigned.',
  editUser: 'Editing the selected user.', editVehicle: 'Editing the selected vehicle.',
  editCompany: 'Editing the company profile.', resetPassword: 'Password reset link emailed.',
  enforceMfa: 'Two-factor authentication enforced for administrators.',
  disableUser: 'User disabled and sessions revoked.', suspend: 'Company suspended pending review.',
  deleteCompany: 'Deletion requires a second administrator to approve.',
  upgrade: 'Enterprise upgrade quote generated.', modules: 'Module manager opened.',
  billing: 'Billing and invoices opened.', bookService: 'Service booked with the workshop.',
  serviceDue: '4 vehicles are due for a service.', licences: '2 licence renewals fall due this month.',
  returnService: 'Vehicle returned to service after inspection.',
  ground: 'Vehicle grounded and removed from the roster.',
  raiseDefect: 'Defect raised against the vehicle.', closeDefect: 'Defect closed and signed off.',
  logFuel: 'Fuel entry captured.', logOdo: 'Odometer reading updated.',
  shiftPlan: 'Shift plan opened.', recurring: 'Recurring pre-use checks configured.',
  cofRegister: 'COF register opened — 14 expiring within 90 days.',
  noGoRegister: '7 open no-go defects across the platform.',
  goButAging: '23 go-but items are older than 20 days.',
  upload: 'Document uploaded and queued for verification.', bookRenewal: 'COF renewal booked.',
  searchAudit: 'Audit search opened.', filterAudit: 'Audit filter applied.',
  dateRange: 'Date range set to the last 7 days.', byUser: 'Filtered by user.',
  verify: 'Audit chain verified — no gaps found.', retention: 'Retention held at 7 years, append-only.',
  clearFilters: 'Filters cleared.', columns: 'Column chooser opened.',
  fullscreen: 'Full screen toggled.', saveSettings: 'Settings saved.',
  branding: 'Branding options opened.', templates: 'Email templates opened.',
  integrations: 'Integration catalogue opened.', roles: 'Roles and permissions opened.',
  backups: 'Last backup completed 18 Jun 2026 at 02:00.', import: 'Import wizard opened.',
  account: 'Signed in as Kobus van der Merwe (Administrator).',
  about: 'SafeNexus ERP 2026.6 · build 4812 · SAFENEXUS-SQL01.',
  schedule: 'Report scheduled for the first of each month.',
  newForm: 'Form builder opened — start from a published form or a blank sheet.',
  duplicateForm: 'Form duplicated as a draft.',
  unassigned: 'Operators without a supervisor are listed under Gaps in the line.',
  cofRegister: 'Certificate register opened.',
  noGoRegister: 'Filtered to open no-go defects.',
  serviceDue: 'Vehicles within the service warning distance are listed.',
  licences: 'Licence renewals due this month are listed.',
  resendInvite: 'Invitation resent.',
  changeSupervisor: 'Supervisor changed.',
  upload: 'Certificate uploaded and queued for verification.',
};
