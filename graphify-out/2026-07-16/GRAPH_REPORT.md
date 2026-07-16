# Graph Report - Payroll  (2026-07-16)

## Corpus Check
- 103 files · ~102,652 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 811 nodes · 1108 edges · 59 communities (51 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_employee-repository.ts|employee-repository.ts]]
- [[_COMMUNITY_Project Handoff|Project Handoff]]
- [[_COMMUNITY_hr-master-data-repository.ts|hr-master-data-repository.ts]]
- [[_COMMUNITY_scripts|scripts]]
- [[_COMMUNITY_App.tsx|App.tsx]]
- [[_COMMUNITY_dependencies|dependencies]]
- [[_COMMUNITY_devDependencies|devDependencies]]
- [[_COMMUNITY_app.ts|app.ts]]
- [[_COMMUNITY_What You Must Do When Invoked|What You Must Do When Invoked]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_graphify reference extra exports and benchmark|graphify reference: extra exports and benchmark]]
- [[_COMMUNITY_update-handoff.mjs|update-handoff.mjs]]
- [[_COMMUNITY_Phase Tracker|Phase Tracker]]
- [[_COMMUNITY_tsconfig.json|tsconfig.json]]
- [[_COMMUNITY_graphify reference query, path, explain|graphify reference: query, path, explain]]
- [[_COMMUNITY_Architecture|Architecture]]
- [[_COMMUNITY_.oxlintrc.json|.oxlintrc.json]]
- [[_COMMUNITY_Plan|Plan]]
- [[_COMMUNITY_UI Direction|UI Direction]]
- [[_COMMUNITY_graphify reference add a URL and watch a folder|graphify reference: add a URL and watch a folder]]
- [[_COMMUNITY_graphify reference commit hook and native CLAUDE.md integration|graphify reference: commit hook and native CLAUDE.md integration]]
- [[_COMMUNITY_graphify reference incremental update and cluster-only|graphify reference: incremental update and cluster-only]]
- [[_COMMUNITY_VetanFlow Frontend|VetanFlow Frontend]]
- [[_COMMUNITY_AGENTS|AGENTS.md]]
- [[_COMMUNITY_graphify reference GitHub clone and cross-repo merge|graphify reference: GitHub clone and cross-repo merge]]
- [[_COMMUNITY_graphify reference transcribe video and audio|graphify reference: transcribe video and audio]]
- [[_COMMUNITY_extraction-spec|extraction-spec.md]]
- [[_COMMUNITY_Project Handoff|Project Handoff]]
- [[_COMMUNITY_calculate-payroll.ts|calculate-payroll.ts]]
- [[_COMMUNITY_Automation|Automation]]
- [[_COMMUNITY_Supabase Cloud Setup|Supabase Cloud Setup]]
- [[_COMMUNITY_Graphify|Graphify]]
- [[_COMMUNITY_Payroll System|Payroll System]]
- [[_COMMUNITY_hr.ts|hr.ts]]
- [[_COMMUNITY_toEmployee|toEmployee]]
- [[_COMMUNITY_HrMasterDataWriteError|HrMasterDataWriteError]]
- [[_COMMUNITY_App|App]]
- [[_COMMUNITY_EmployeeIdCard.tsx|EmployeeIdCard.tsx]]
- [[_COMMUNITY_createEmptyEmployeeForm|createEmptyEmployeeForm]]
- [[_COMMUNITY_Folder.tsx|Folder.tsx]]
- [[_COMMUNITY_supabase.ts|supabase.ts]]
- [[_COMMUNITY_formatLabel|formatLabel]]
- [[_COMMUNITY_attendance-repository.ts|attendance-repository.ts]]
- [[_COMMUNITY_payroll.ts|payroll.ts]]
- [[_COMMUNITY_leave.ts|leave.ts]]
- [[_COMMUNITY_roles.ts|roles.ts]]
- [[_COMMUNITY_employee-repository.ts|employee-repository.ts]]
- [[_COMMUNITY_regenerateRun|regenerateRun]]
- [[_COMMUNITY_toPayrollLine|toPayrollLine]]
- [[_COMMUNITY_loadAttendanceInputs|loadAttendanceInputs]]
- [[_COMMUNITY_roundMoney|roundMoney]]
- [[_COMMUNITY_getPayrollMakerCheckerConflict|getPayrollMakerCheckerConflict]]
- [[_COMMUNITY_invitation-service.ts|invitation-service.ts]]
- [[_COMMUNITY_getDefaultTaxTreatment|getDefaultTaxTreatment]]

## God Nodes (most connected - your core abstractions)
1. `getUserRoles()` - 18 edges
2. `compilerOptions` - 18 edges
3. `scripts` - 18 edges
4. `hasAnyRole()` - 17 edges
5. `compilerOptions` - 15 edges
6. `requireAuth()` - 14 edges
7. `getSupabaseServiceClient()` - 13 edges
8. `What You Must Do When Invoked` - 12 edges
9. `Project Handoff` - 12 edges
10. `compilerOptions` - 11 edges

## Surprising Connections (you probably didn't know these)
- `getSupabaseServiceClient()` --calls--> `getSupabaseServiceConfig()`  [EXTRACTED]
  backend/src/lib/supabase.ts → backend/src/config/env.ts
- `regenerateRun()` --calls--> `normalizePeriodMonth()`  [EXTRACTED]
  backend/src/modules/payroll/payroll-run-repository.ts → backend/src/modules/attendance/attendance-repository.ts
- `loadAttendanceInputs()` --calls--> `getMonthBounds()`  [EXTRACTED]
  backend/src/modules/payroll/payroll-run-repository.ts → backend/src/modules/attendance/attendance-repository.ts
- `loadAttendanceInputs()` --calls--> `buildAttendanceSummaries()`  [EXTRACTED]
  backend/src/modules/payroll/payroll-run-repository.ts → backend/src/modules/attendance/attendance-repository.ts
- `createAttendanceRouter()` --indirect_call--> `requireAuth()`  [INFERRED]
  backend/src/routes/attendance.ts → backend/src/modules/auth/auth-middleware.ts

## Import Cycles
- None detected.

## Communities (59 total, 8 thin omitted)

### Community 1 - "Project Handoff"
Cohesion: 0.25
Nodes (8): Phase 0 — Foundation, Phase 1 — Supabase Project, Auth, And RLS, Phase 2 — HR Master Data, Phase 3 — Attendance And Leave, Phase 4 — Payroll Engine, Phase 5 — Payslips, Reports, And Exports, Phase 6 — Polish, Deployment, And Demo, Phase Tracker

### Community 2 - "hr-master-data-repository.ts"
Cohesion: 0.05
Nodes (35): AuditEntry, AuditRow, bankAccountNumberSchema, bankIfscSchema, DataSource, DepartmentArchiveInput, DepartmentCreateInput, DepartmentRow (+27 more)

### Community 3 - "scripts"
Cohesion: 0.06
Nodes (33): isSupabaseConfigured, supabaseKey, supabaseUrl, husky.sh script, devDependencies, husky, lint-staged, supabase (+25 more)

### Community 4 - "App.tsx"
Cohesion: 0.03
Nodes (66): AppRole, AttendanceDashboard, AttendanceDashboardResponse, AttendanceEmployee, AttendanceEntry, AttendanceFormState, AttendanceHoliday, AttendanceMonthLock (+58 more)

### Community 5 - "dependencies"
Cohesion: 0.07
Nodes (29): dependencies, class-variance-authority, clsx, lucide-react, motion, react, react-dom, @supabase/supabase-js (+21 more)

### Community 6 - "devDependencies"
Cohesion: 0.06
Nodes (31): dependencies, cors, dotenv, express, helmet, multer, @supabase/supabase-js, @types/multer (+23 more)

### Community 7 - "app.ts"
Cohesion: 0.06
Nodes (27): AttendanceEntryRow, DataSource, HolidayRow, PayrollAdjustment, PayrollAdjustmentComponentType, PayrollAdjustmentCreateInput, PayrollAdjustmentRow, PayrollAdjustmentTaxTreatment (+19 more)

### Community 8 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 9 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 10 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 11 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, rootDir, skipLibCheck (+5 more)

### Community 12 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 13 - "update-handoff.mjs"
Cohesion: 0.22
Nodes (7): existing, handoffPath, pkg, root, scripts, snapshot, status

### Community 14 - "Phase Tracker"
Cohesion: 0.07
Nodes (39): createApp(), app, configuredCorsOrigins, env, envSchema, getSupabaseBaseConfig(), getSupabasePublicConfig(), getSupabaseServiceConfig() (+31 more)

### Community 15 - "tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, baseUrl, paths, files, @/*, references

### Community 16 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 17 - "Architecture"
Cohesion: 0.25
Nodes (7): Architecture, Core Domains, Implemented Payroll Flow, Implemented Time Flow, Runtime Shape, Security Principles, Why Express

### Community 18 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 19 - "Plan"
Cohesion: 0.40
Nodes (4): Action Items, Open Questions, Plan, Scope

### Community 20 - "UI Direction"
Cohesion: 0.40
Nodes (4): Product Feel, UI Direction, UX Rules, Visual System

### Community 21 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 22 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 23 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 24 - "VetanFlow Frontend"
Cohesion: 0.50
Nodes (3): Scripts, UI Direction, VetanFlow Frontend

### Community 31 - "Project Handoff"
Cohesion: 0.17
Nodes (12): Confirmed Stack, Current File Map, Current Phase, Current Verification Notes, Development Rules, Generated Snapshot, How To Run, How To Study The Project (+4 more)

### Community 32 - "calculate-payroll.ts"
Cohesion: 0.09
Nodes (19): ApprovalStage, DataSource, EmployeeRow, firstRelation(), getInclusiveDays(), LeaveDashboard, LeaveEmployee, LeaveRequest (+11 more)

### Community 33 - "Automation"
Cohesion: 0.29
Nodes (7): Automation, GitHub Actions, Handoff Automation, Local Git Hooks, Main Commands, Supabase Automation, Verification

### Community 34 - "Supabase Cloud Setup"
Cohesion: 0.29
Nodes (6): Backend Environment, Create A Fresh Project, Frontend Environment, Link And Push, Supabase Cloud Setup, Verification

### Community 35 - "Graphify"
Cohesion: 0.33
Nodes (5): Build Or Update Graph, Graphify, Install State, Recommended Use, Repeatable Install

### Community 36 - "Payroll System"
Cohesion: 0.33
Nodes (6): Current Status, Payroll System, Project Layout, Project Tracking, Scripts, Stack

### Community 38 - "hr.ts"
Cohesion: 0.12
Nodes (15): createHrMasterDataRepository(), departmentArchiveSchema, departmentCreateSchema, departmentUpdateSchema, hrEmployeeCreateSchema, hrEmployeeUpdateSchema, HrMasterDataRepository, locationArchiveSchema (+7 more)

### Community 39 - "toEmployee"
Cohesion: 0.50
Nodes (4): createSignedPhotoUrl(), firstRelation(), toEmployee(), toEmployeeWithPhoto()

### Community 41 - "App"
Cohesion: 0.22
Nodes (11): App(), EmployeeSelfService(), formatCurrency(), formatDate(), formatStatus(), isHrRole(), isLeaveApproverRole(), isPayrollApprovalRole() (+3 more)

### Community 42 - "EmployeeIdCard.tsx"
Cohesion: 0.43
Nodes (6): EmployeeIdCard(), EmployeeIdCardEmployee, EmployeeIdCardProps, formatDate(), formatStatus(), getInitials()

### Community 43 - "createEmptyEmployeeForm"
Cohesion: 0.20
Nodes (10): createEmptyAttendanceForm(), createEmptyEmployeeForm(), createEmptyHolidayForm(), createEmptyLeaveForm(), createFallbackAttendanceDashboard(), getCalendarDaysInPeriod(), getCurrentPeriodMonth(), getDefaultDepartmentId() (+2 more)

### Community 44 - "Folder.tsx"
Cohesion: 0.67
Nodes (3): darkenColor(), Folder(), FolderProps

### Community 45 - "supabase.ts"
Cohesion: 0.33
Nodes (11): getSupabaseServiceClient(), canWrite(), getUserRoles(), hasAnyRole(), canWrite(), inviteUser(), canWrite(), canExportPayroll() (+3 more)

### Community 46 - "formatLabel"
Cohesion: 0.40
Nodes (5): formatAttendanceStatus(), formatLabel(), formatLeaveStatus(), formatLeaveType(), formatPayrollRunStatus()

### Community 47 - "attendance-repository.ts"
Cohesion: 0.05
Nodes (42): ApprovedLeaveRow, assertMonthIsOpen(), AttendanceDashboard, AttendanceEmployee, AttendanceEntry, AttendanceEntryRow, AttendanceEntryUpsertInput, attendanceEntryUpsertSchema (+34 more)

### Community 48 - "payroll.ts"
Cohesion: 0.06
Nodes (37): calculatePayrollPreview(), PayrollInput, payrollInputSchema, PayrollPreview, roundMoney(), buildBankExport(), buildDepartmentCostExport(), buildExport() (+29 more)

### Community 49 - "leave.ts"
Cohesion: 0.20
Nodes (6): createLeaveRepository(), LeaveRepository, leaveRequestCancelSchema, leaveRequestCreateSchema, leaveRequestReviewSchema, LeaveWriteError

### Community 50 - "roles.ts"
Cohesion: 0.18
Nodes (10): AuthContext, Locals, RoleRow, EmployeeCreateInput, EmployeeDataSource, EmployeeResult, EmployeeRow, AppRole (+2 more)

### Community 51 - "employee-repository.ts"
Cohesion: 0.08
Nodes (31): buildPayslipPdf(), buildPdfDocument(), DataSource, firstRelation(), formatDate(), formatMoney(), GeneratedPayslip, getGeneratedPayslip() (+23 more)

### Community 52 - "regenerateRun"
Cohesion: 0.22
Nodes (9): buildLineInsert(), groupAdjustmentsByEmployee(), loadAdjustmentsForRun(), loadPayrollRun(), loadPreviousNetPayByEmployee(), regenerateRun(), replaceRunLines(), toPayrollAdjustment() (+1 more)

### Community 53 - "toPayrollLine"
Cohesion: 0.43
Nodes (7): getSnapshotArray(), getSnapshotNumber(), isRecord(), summarizeRun(), sumMoney(), toPayrollLine(), toPayrollRunDetail()

### Community 54 - "loadAttendanceInputs"
Cohesion: 0.40
Nodes (5): firstRelation(), loadAttendanceInputs(), toAttendanceEmployee(), toAttendanceEntry(), toHoliday()

### Community 55 - "roundMoney"
Cohesion: 0.67
Nodes (3): buildVarianceWarnings(), calculateOvertimeAmount(), roundMoney()

### Community 57 - "invitation-service.ts"
Cohesion: 0.28
Nodes (6): postgresUuidSchema, adminAssignableRoles, invitationActorRoles, InvitationInput, invitationSchema, invitationsRouter

## Knowledge Gaps
- **461 isolated node(s):** `husky.sh script`, `name`, `version`, `private`, `type` (+456 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getUserRoles()` connect `supabase.ts` to `calculate-payroll.ts`, `hr-master-data-repository.ts`, `app.ts`, `attendance-repository.ts`, `payroll.ts`, `roles.ts`, `employee-repository.ts`, `invitation-service.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `hasAnyRole()` connect `supabase.ts` to `calculate-payroll.ts`, `hr-master-data-repository.ts`, `app.ts`, `attendance-repository.ts`, `payroll.ts`, `roles.ts`, `employee-repository.ts`, `invitation-service.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `husky.sh script`, `name`, `version` to the rest of the system?**
  _461 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `hr-master-data-repository.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.025 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._