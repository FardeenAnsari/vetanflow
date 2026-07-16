# Graph Report - Payroll  (2026-07-04)

## Corpus Check
- 92 files · ~82,554 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 638 nodes · 805 edges · 51 communities (45 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.65)
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
- [[_COMMUNITY_attendance.ts|attendance.ts]]
- [[_COMMUNITY_buildSummaries|buildSummaries]]
- [[_COMMUNITY_normalizePeriodMonth|normalizePeriodMonth]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 18 edges
2. `scripts` - 18 edges
3. `compilerOptions` - 15 edges
4. `requireAuth()` - 12 edges
5. `What You Must Do When Invoked` - 12 edges
6. `Project Handoff` - 12 edges
7. `getUserRoles()` - 11 edges
8. `compilerOptions` - 11 edges
9. `getSupabaseServiceClient()` - 10 edges
10. `hasAnyRole()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `getSupabaseServiceClient()` --calls--> `getSupabaseServiceConfig()`  [EXTRACTED]
  backend/src/lib/supabase.ts → backend/src/config/env.ts
- `buildSummaries()` --calls--> `calculatePayrollPreview()`  [EXTRACTED]
  backend/src/modules/attendance/attendance-repository.ts → backend/src/modules/payroll/calculate-payroll.ts
- `createAttendanceRouter()` --indirect_call--> `requireAuth()`  [INFERRED]
  backend/src/routes/attendance.ts → backend/src/modules/auth/auth-middleware.ts
- `createEmployeesRouter()` --indirect_call--> `requireAuth()`  [INFERRED]
  backend/src/routes/employees.ts → backend/src/modules/auth/auth-middleware.ts
- `createHrRouter()` --indirect_call--> `requireAuth()`  [INFERRED]
  backend/src/routes/hr.ts → backend/src/modules/auth/auth-middleware.ts

## Import Cycles
- None detected.

## Communities (51 total, 6 thin omitted)

### Community 1 - "Project Handoff"
Cohesion: 0.25
Nodes (8): Phase 0 — Foundation, Phase 1 — Supabase Project, Auth, And RLS, Phase 2 — HR Master Data, Phase 3 — Attendance And Leave, Phase 4 — Payroll Engine, Phase 5 — Payslips, Reports, And Exports, Phase 6 — Polish, Deployment, And Demo, Phase Tracker

### Community 2 - "hr-master-data-repository.ts"
Cohesion: 0.05
Nodes (33): AuditEntry, AuditRow, DataSource, DepartmentArchiveInput, DepartmentCreateInput, DepartmentRow, DepartmentUpdateInput, employeePhotoMimeTypes (+25 more)

### Community 3 - "scripts"
Cohesion: 0.06
Nodes (33): isSupabaseConfigured, supabaseKey, supabaseUrl, husky.sh script, devDependencies, husky, lint-staged, supabase (+25 more)

### Community 4 - "App.tsx"
Cohesion: 0.04
Nodes (42): AppRole, AttendanceDashboard, AttendanceDashboardResponse, AttendanceEmployee, AttendanceEntry, AttendanceFormState, AttendanceHoliday, AttendanceMonthLock (+34 more)

### Community 5 - "dependencies"
Cohesion: 0.07
Nodes (29): dependencies, class-variance-authority, clsx, lucide-react, motion, react, react-dom, @supabase/supabase-js (+21 more)

### Community 6 - "devDependencies"
Cohesion: 0.06
Nodes (31): dependencies, cors, dotenv, express, helmet, multer, @supabase/supabase-js, @types/multer (+23 more)

### Community 7 - "app.ts"
Cohesion: 0.33
Nodes (6): calculatePayrollPreview(), PayrollInput, payrollInputSchema, PayrollPreview, roundMoney(), payrollRouter

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
Nodes (35): createApp(), app, configuredCorsOrigins, env, envSchema, getSupabaseBaseConfig(), getSupabasePublicConfig(), getSupabaseServiceConfig() (+27 more)

### Community 15 - "tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, baseUrl, paths, files, @/*, references

### Community 16 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 17 - "Architecture"
Cohesion: 0.29
Nodes (6): Architecture, Core Domains, Implemented Time Flow, Runtime Shape, Security Principles, Why Express

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
Cohesion: 0.07
Nodes (26): postgresUuidSchema, ApprovalStage, createLeaveRepository(), DataSource, EmployeeRow, firstRelation(), getInclusiveDays(), LeaveDashboard (+18 more)

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
Cohesion: 0.25
Nodes (9): App(), EmployeeSelfService(), formatCurrency(), formatDate(), formatStatus(), isHrRole(), isLeaveApproverRole(), isPayrollRole() (+1 more)

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
Cohesion: 0.11
Nodes (25): getSupabaseServiceClient(), canWrite(), adminAssignableRoles, AuthContext, invitationActorRoles, Locals, getUserRoles(), hasAnyRole() (+17 more)

### Community 46 - "formatLabel"
Cohesion: 0.50
Nodes (4): formatAttendanceStatus(), formatLabel(), formatLeaveStatus(), formatLeaveType()

### Community 47 - "attendance-repository.ts"
Cohesion: 0.06
Nodes (24): ApprovedLeaveRow, AttendanceDashboard, AttendanceEmployee, AttendanceEntry, AttendanceEntryRow, AttendanceEntryUpsertInput, AttendanceMonthLock, AttendanceMonthLockInput (+16 more)

### Community 48 - "attendance.ts"
Cohesion: 0.18
Nodes (7): attendanceEntryUpsertSchema, attendanceMonthLockSchema, attendancePeriodQuerySchema, AttendanceRepository, AttendanceWriteError, createAttendanceRepository(), holidayCreateSchema

### Community 49 - "buildSummaries"
Cohesion: 0.32
Nodes (8): buildSummaries(), getCalendarDays(), getDateKey(), getDateRange(), getFallbackDashboard(), getMonthBounds(), getOverlapDateRange(), toDateInputValue()

### Community 50 - "normalizePeriodMonth"
Cohesion: 0.67
Nodes (3): assertMonthIsOpen(), getDefaultPeriodMonth(), normalizePeriodMonth()

## Knowledge Gaps
- **384 isolated node(s):** `husky.sh script`, `name`, `version`, `private`, `type` (+379 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 4 inferred relationships involving `requireAuth()` (e.g. with `createAttendanceRouter()` and `createEmployeesRouter()`) actually correct?**
  _`requireAuth()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `husky.sh script`, `name`, `version` to the rest of the system?**
  _384 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `hr-master-data-repository.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.03773584905660377 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._