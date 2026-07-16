# Graph Report - Payroll  (2026-07-16)

## Corpus Check
- 134 files · ~110,928 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1141 nodes · 1502 edges · 78 communities (71 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a85408bc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

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
- [[_COMMUNITY_README|README.md]]
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
- [[_COMMUNITY_capture-authenticated-demo-screenshots.mjs|capture-authenticated-demo-screenshots.mjs]]
- [[_COMMUNITY_prepare-demo-data.ts|prepare-demo-data.ts]]
- [[_COMMUNITY_check-demo-readiness.mjs|check-demo-readiness.mjs]]
- [[_COMMUNITY_Recorded Demo Script|Recorded Demo Script]]
- [[_COMMUNITY_capture-demo-screenshots.mjs|capture-demo-screenshots.mjs]]
- [[_COMMUNITY_Demo Reset Checklist|Demo Reset Checklist]]
- [[_COMMUNITY_Demo Walkthrough|Demo Walkthrough]]
- [[_COMMUNITY_Deployment|Deployment]]
- [[_COMMUNITY_Screenshot Guide|Screenshot Guide]]
- [[_COMMUNITY_supabase.ts|supabase.ts]]
- [[_COMMUNITY_open-demo-profiles.mjs|open-demo-profiles.mjs]]
- [[_COMMUNITY_OperationsOverview.tsx|OperationsOverview.tsx]]
- [[_COMMUNITY_check-deploy-readiness.mjs|check-deploy-readiness.mjs]]
- [[_COMMUNITY_vercel.json|vercel.json]]
- [[_COMMUNITY_supabase.ts|supabase.ts]]
- [[_COMMUNITY_calculate-payroll.ts|calculate-payroll.ts]]
- [[_COMMUNITY_check-demo-logins.ts|check-demo-logins.ts]]
- [[_COMMUNITY_Start Here|Start Here]]

## God Nodes (most connected - your core abstractions)
1. `scripts` - 28 edges
2. `getUserRoles()` - 19 edges
3. `hasAnyRole()` - 18 edges
4. `compilerOptions` - 18 edges
5. `compilerOptions` - 15 edges
6. `getSupabaseServiceClient()` - 14 edges
7. `requireAuth()` - 14 edges
8. `WorkspaceApp()` - 14 edges
9. `What You Must Do When Invoked` - 12 edges
10. `Project Handoff` - 12 edges

## Surprising Connections (you probably didn't know these)
- `getSupabaseServiceClient()` --calls--> `getSupabaseServiceConfig()`  [EXTRACTED]
  backend/src/lib/supabase.ts → backend/src/config/env.ts
- `regenerateRun()` --calls--> `normalizePeriodMonth()`  [EXTRACTED]
  backend/src/modules/payroll/payroll-run-repository.ts → backend/src/modules/attendance/attendance-repository.ts
- `inviteUser()` --calls--> `canAssignRole()`  [EXTRACTED]
  backend/src/modules/invitations/invitation-service.ts → backend/src/modules/auth/auth-context.ts
- `createAttendanceRouter()` --indirect_call--> `requireAuth()`  [INFERRED]
  backend/src/routes/attendance.ts → backend/src/modules/auth/auth-middleware.ts
- `createEmployeesRouter()` --indirect_call--> `requireAuth()`  [INFERRED]
  backend/src/routes/employees.ts → backend/src/modules/auth/auth-middleware.ts

## Import Cycles
- None detected.

## Communities (78 total, 7 thin omitted)

### Community 1 - "Project Handoff"
Cohesion: 0.18
Nodes (10): Phase 0 — Foundation, Phase 1 — Supabase Project, Auth, And RLS, Phase 2 — HR Master Data, Phase 3 — Attendance And Leave, Phase 4 — Payroll Engine, Phase 5 — Payslips, Reports, And Exports, Phase 6 — Polish, Deployment, And Demo, Phase 7 — Productization, Global Defaults, And Role UX (+2 more)

### Community 2 - "hr-master-data-repository.ts"
Cohesion: 0.04
Nodes (36): AuditEntry, AuditRow, bankAccountNumberSchema, bankRoutingCodeSchema, DataSource, DepartmentArchiveInput, DepartmentCreateInput, DepartmentRow (+28 more)

### Community 3 - "scripts"
Cohesion: 0.04
Nodes (43): isSupabaseConfigured, supabaseKey, supabaseUrl, husky.sh script, devDependencies, husky, lint-staged, supabase (+35 more)

### Community 4 - "App.tsx"
Cohesion: 0.02
Nodes (74): AppRole, appRoles, AttendanceDashboard, AttendanceDashboardResponse, AttendanceEmployee, AttendanceEntry, AttendanceFormState, AttendanceHoliday (+66 more)

### Community 5 - "dependencies"
Cohesion: 0.07
Nodes (29): dependencies, class-variance-authority, clsx, lucide-react, motion, react, react-dom, @supabase/supabase-js (+21 more)

### Community 6 - "devDependencies"
Cohesion: 0.06
Nodes (32): dependencies, cors, dotenv, express, express-rate-limit, helmet, multer, @supabase/supabase-js (+24 more)

### Community 7 - "app.ts"
Cohesion: 0.06
Nodes (34): AttendanceEntryRow, buildVarianceWarnings(), calculateOvertimeAmount(), DataSource, ensureDifferentPayrollChecker(), getDefaultTaxTreatment(), getPayrollMakerCheckerConflict(), HolidayRow (+26 more)

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
Cohesion: 0.06
Nodes (43): createApp(), app, configuredCorsOrigins, env, envSchema, getSupabaseBaseConfig(), getSupabasePublicConfig(), getSupabaseServiceConfig() (+35 more)

### Community 15 - "tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, baseUrl, paths, files, @/*, references

### Community 16 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 17 - "Architecture"
Cohesion: 0.18
Nodes (10): Architecture, Core Domains, Deployment Shape, Implemented Output Flow, Implemented Payroll Flow, Implemented Time Flow, Role Workspaces, Runtime Shape (+2 more)

### Community 18 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 19 - "Plan"
Cohesion: 0.33
Nodes (5): Completed, Open Questions, Phase 6 Action Items, Plan, Scope

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
Cohesion: 0.15
Nodes (12): Confirmed Stack, Current File Map, Current Phase, Current Verification Notes, Development Rules, Generated Snapshot, How To Run, How To Study The Project (+4 more)

### Community 32 - "calculate-payroll.ts"
Cohesion: 0.09
Nodes (19): ApprovalStage, DataSource, EmployeeRow, firstRelation(), getInclusiveDays(), LeaveDashboard, LeaveEmployee, LeaveRequest (+11 more)

### Community 33 - "Automation"
Cohesion: 0.22
Nodes (8): Automation, GitHub Actions, Handoff Automation, Local Git Hooks, Main Commands, Phase Close-Out Rule, Supabase Automation, Verification

### Community 34 - "Supabase Cloud Setup"
Cohesion: 0.29
Nodes (6): Backend Environment, Create A Fresh Project, Frontend Environment, Link And Push, Supabase Cloud Setup, Verification

### Community 35 - "Graphify"
Cohesion: 0.33
Nodes (5): Build Or Update Graph, Graphify, Install State, Recommended Use, Repeatable Install

### Community 36 - "Payroll System"
Cohesion: 0.12
Nodes (16): Architecture, Data Model, Deployment Shape, Feature Map, How To Demonstrate The Product, Licensing, Phase Story, Product Surfaces (+8 more)

### Community 37 - "README.md"
Cohesion: 0.50
Nodes (3): Capture Command, Captured, Screenshot Manifest

### Community 38 - "hr.ts"
Cohesion: 0.12
Nodes (16): createHrMasterDataRepository(), departmentArchiveSchema, departmentCreateSchema, departmentUpdateSchema, hrEmployeeCreateSchema, hrEmployeeUpdateSchema, HrMasterDataRepository, locationArchiveSchema (+8 more)

### Community 39 - "toEmployee"
Cohesion: 0.50
Nodes (4): createSignedPhotoUrl(), firstRelation(), toEmployee(), toEmployeeWithPhoto()

### Community 41 - "App"
Cohesion: 0.18
Nodes (12): EmployeeSelfService(), formatStatus(), getAssignableInvitationRoles(), getNoticeTone(), isHrRole(), isLeaveApproverRole(), isPayrollApprovalRole(), isPayrollRole() (+4 more)

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
Cohesion: 0.32
Nodes (12): getSupabaseServiceClient(), canWrite(), getUserRoles(), hasAnyRole(), canWrite(), inviteUser(), listOrganizationMembers(), canWrite() (+4 more)

### Community 46 - "formatLabel"
Cohesion: 0.40
Nodes (5): formatAttendanceStatus(), formatLabel(), formatLeaveStatus(), formatLeaveType(), formatPayrollRunStatus()

### Community 47 - "attendance-repository.ts"
Cohesion: 0.06
Nodes (30): ApprovedLeaveRow, assertMonthIsOpen(), AttendanceDashboard, AttendanceEmployee, AttendanceEntry, AttendanceEntryRow, AttendanceEntryUpsertInput, attendanceEntryUpsertSchema (+22 more)

### Community 48 - "payroll.ts"
Cohesion: 0.07
Nodes (33): buildBankExport(), buildDeductionsExport(), buildDepartmentCostExport(), buildExport(), buildPayrollCsvExport(), createPayrollExportRepository(), firstRelation(), formatMoney() (+25 more)

### Community 49 - "leave.ts"
Cohesion: 0.18
Nodes (7): postgresUuidSchema, createLeaveRepository(), LeaveRepository, leaveRequestCancelSchema, leaveRequestCreateSchema, leaveRequestReviewSchema, LeaveWriteError

### Community 50 - "roles.ts"
Cohesion: 0.18
Nodes (11): RoleRow, createEmployeeRepository(), EmployeeCreateInput, employeeCreateSchema, EmployeeDataSource, EmployeeRepository, EmployeeResult, EmployeeRow (+3 more)

### Community 51 - "employee-repository.ts"
Cohesion: 0.08
Nodes (31): buildPayslipPdf(), buildPdfDocument(), DataSource, firstRelation(), GeneratedPayslip, getDeductionValue(), getGeneratedPayslip(), getNestedNumber() (+23 more)

### Community 52 - "regenerateRun"
Cohesion: 0.22
Nodes (9): buildLineInsert(), groupAdjustmentsByEmployee(), loadAdjustmentsForRun(), loadPayrollRun(), loadPreviousNetPayByEmployee(), regenerateRun(), replaceRunLines(), toPayrollAdjustment() (+1 more)

### Community 53 - "toPayrollLine"
Cohesion: 0.31
Nodes (9): firstRelation(), getSnapshotArray(), getSnapshotNumber(), isRecord(), summarizeRun(), sumMoney(), toAttendanceEntry(), toPayrollLine() (+1 more)

### Community 54 - "loadAttendanceInputs"
Cohesion: 0.24
Nodes (11): buildAttendanceSummaries(), getCalendarDays(), getDateKey(), getDateRange(), getFallbackDashboard(), getMonthBounds(), getOverlapDateRange(), toDateInputValue() (+3 more)

### Community 55 - "roundMoney"
Cohesion: 0.07
Nodes (29): addDays(), authUserIds, authUsers, credentialPath, credentials, currentMonth, dateOnly(), DemoCredential (+21 more)

### Community 56 - "getPayrollMakerCheckerConflict"
Cohesion: 0.09
Nodes (14): BlogArticle, blogArticles, JourneyStep, journeySteps, roleStories, trustSignals, LegalSection, licenseSections (+6 more)

### Community 57 - "invitation-service.ts"
Cohesion: 0.23
Nodes (9): adminAssignableRoles, AuthContext, canAssignRole(), invitationActorRoles, Locals, InvitationInput, MemberRoleRow, MemberRow (+1 more)

### Community 58 - "getDefaultTaxTreatment"
Cohesion: 0.25
Nodes (8): 1. Create the organization member, 2. Create the employee record, 3. Capture leave and attendance, 4. Lock the source month, 5. Calculate payroll, 6. Review, approve, and finalize, 7. Publish private outputs, The Complete Journey

### Community 59 - "capture-authenticated-demo-screenshots.mjs"
Cohesion: 0.07
Nodes (32): browser, captureSession(), CdpSession, clientOptions, credentialPath, delay(), employeeCredential, findBrowser() (+24 more)

### Community 60 - "prepare-demo-data.ts"
Cohesion: 0.11
Nodes (10): attendanceLockId, bucketIds, db, makerRole, organization, payslipRepository, period, root (+2 more)

### Community 61 - "check-demo-readiness.mjs"
Cohesion: 0.13
Nodes (6): checks, demoPeriodMonth, failures, root, symbols, warnings

### Community 62 - "Recorded Demo Script"
Cohesion: 0.17
Nodes (11): 0:00 to 0:45, Opening, 0:45 to 1:45, HR Master Data, 1:45 to 2:45, Leave And Attendance, 2:45 to 4:15, Payroll Run, 4:15 to 5:15, Approval Control, 5:15 to 6:30, Payslips And Exports, 6:30 to 7:15, Engineering Close, Recorded Demo Script (+3 more)

### Community 63 - "capture-demo-screenshots.mjs"
Cohesion: 0.25
Nodes (7): browser, findBrowser(), findExecutable(), outputDir, root, timeoutMs, viewports

### Community 64 - "Demo Reset Checklist"
Cohesion: 0.29
Nodes (6): After A Demo, Before A Demo, Demo Reset Checklist, During A Demo, Readiness Check Output, Remote Database Safety

### Community 65 - "Demo Walkthrough"
Cohesion: 0.25
Nodes (7): Before You Start, Cleanup, Demo Walkthrough, Employee Flow, Owner Flow, Role Contrast, Talking Points

### Community 66 - "Deployment"
Cohesion: 0.29
Nodes (6): 1. Supabase Cloud, 2. Backend Service, 3. Frontend Static App, 4. Smoke Test, 5. CI/CD Notes, Deployment

### Community 67 - "Screenshot Guide"
Cohesion: 0.29
Nodes (6): Authenticated Screens, Capture Notes, Manual Fallback, Quick Capture, Recommended Shot List, Screenshot Guide

### Community 68 - "supabase.ts"
Cohesion: 0.17
Nodes (13): getWorkspaceSectionFromHash(), getAllowedWorkspaceSections(), isWorkspaceSection(), roleLabels, rolePriority, roleSections, WorkspaceRole, WorkspaceSection (+5 more)

### Community 70 - "OperationsOverview.tsx"
Cohesion: 0.21
Nodes (10): getMetrics(), OperationsOverview(), OperationsOverviewProps, OverviewMetric, roleCopy, StatusBadge(), StatusBadgeProps, StatusTone (+2 more)

### Community 71 - "check-deploy-readiness.mjs"
Cohesion: 0.20
Nodes (7): checks, envHas(), failures, read(), remote, root, rootPackage

### Community 72 - "vercel.json"
Cohesion: 0.33
Nodes (5): buildCommand, framework, installCommand, outputDirectory, rewrites

### Community 73 - "supabase.ts"
Cohesion: 0.25
Nodes (5): lineIds, root, runIds, storagePaths, supabase

### Community 74 - "calculate-payroll.ts"
Cohesion: 0.38
Nodes (5): calculatePayrollPreview(), PayrollInput, payrollInputSchema, PayrollPreview, roundMoney()

### Community 75 - "check-demo-logins.ts"
Cohesion: 0.29
Nodes (4): credentialsPath, DemoCredential, results, root

### Community 76 - "Start Here"
Cohesion: 0.33
Nodes (6): 1. Install and configure, 2. Link the database, 3. Build the complete showcase, 4. Run the product, Prerequisites, Start Here

## Knowledge Gaps
- **645 isolated node(s):** `husky.sh script`, `name`, `version`, `private`, `type` (+640 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `husky.sh script`, `name`, `version` to the rest of the system?**
  _645 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `hr-master-data-repository.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.02040816326530612 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `app.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05641025641025641 - nodes in this community are weakly interconnected._