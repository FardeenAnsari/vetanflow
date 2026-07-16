export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attendance_entries: {
        Row: {
          attendance_status: string
          created_at: string
          employee_id: string
          id: string
          notes: string | null
          organization_id: string
          overtime_hours: number
          payable_hours: number
          recorded_by: string | null
          updated_at: string
          work_date: string
        }
        Insert: {
          attendance_status?: string
          created_at?: string
          employee_id: string
          id?: string
          notes?: string | null
          organization_id: string
          overtime_hours?: number
          payable_hours?: number
          recorded_by?: string | null
          updated_at?: string
          work_date: string
        }
        Update: {
          attendance_status?: string
          created_at?: string
          employee_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          overtime_hours?: number
          payable_hours?: number
          recorded_by?: string | null
          updated_at?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_month_locks: {
        Row: {
          created_at: string
          id: string
          locked_at: string
          locked_by: string | null
          notes: string | null
          organization_id: string
          period_month: string
        }
        Insert: {
          created_at?: string
          id?: string
          locked_at?: string
          locked_by?: string | null
          notes?: string | null
          organization_id: string
          period_month: string
        }
        Update: {
          created_at?: string
          id?: string
          locked_at?: string
          locked_by?: string | null
          notes?: string | null
          organization_id?: string
          period_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_month_locks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          organization_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          organization_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          annual_compensation: number
          bank_account_holder_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          bank_routing_code: string | null
          created_at: string
          department_id: string | null
          designation: string
          employee_code: string
          full_name: string
          id: string
          joining_date: string
          location: string
          manager_employee_id: string | null
          manager_profile_id: string | null
          organization_id: string
          photo_path: string | null
          profile_id: string | null
          status: Database["public"]["Enums"]["employee_status"]
          updated_at: string
          work_email: string | null
          work_location_id: string | null
        }
        Insert: {
          annual_compensation?: number
          bank_account_holder_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bank_routing_code?: string | null
          created_at?: string
          department_id?: string | null
          designation: string
          employee_code: string
          full_name: string
          id?: string
          joining_date: string
          location: string
          manager_employee_id?: string | null
          manager_profile_id?: string | null
          organization_id: string
          photo_path?: string | null
          profile_id?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
          work_email?: string | null
          work_location_id?: string | null
        }
        Update: {
          annual_compensation?: number
          bank_account_holder_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bank_routing_code?: string | null
          created_at?: string
          department_id?: string | null
          designation?: string
          employee_code?: string
          full_name?: string
          id?: string
          joining_date?: string
          location?: string
          manager_employee_id?: string | null
          manager_profile_id?: string | null
          organization_id?: string
          photo_path?: string | null
          profile_id?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
          work_email?: string | null
          work_location_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_employee_id_fkey"
            columns: ["manager_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_profile_id_fkey"
            columns: ["manager_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_work_location_id_fkey"
            columns: ["work_location_id"]
            isOneToOne: false
            referencedRelation: "work_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string
          holiday_date: string
          id: string
          name: string
          organization_id: string
          region: string
        }
        Insert: {
          created_at?: string
          holiday_date: string
          id?: string
          name: string
          organization_id: string
          region?: string
        }
        Update: {
          created_at?: string
          holiday_date?: string
          id?: string
          name?: string
          organization_id?: string
          region?: string
        }
        Relationships: [
          {
            foreignKeyName: "holidays_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approval_stage: string
          created_at: string
          decision_note: string | null
          employee_id: string
          end_date: string
          escalated_at: string | null
          escalated_by: string | null
          id: string
          leave_type: string
          organization_id: string
          reason: string
          requested_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          updated_at: string
        }
        Insert: {
          approval_stage?: string
          created_at?: string
          decision_note?: string | null
          employee_id: string
          end_date: string
          escalated_at?: string | null
          escalated_by?: string | null
          id?: string
          leave_type: string
          organization_id: string
          reason?: string
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
        }
        Update: {
          approval_stage?: string
          created_at?: string
          decision_note?: string | null
          employee_id?: string
          end_date?: string
          escalated_at?: string | null
          escalated_by?: string | null
          id?: string
          leave_type?: string
          organization_id?: string
          reason?: string
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          country_code: string
          created_at: string
          currency_code: string
          id: string
          legal_name: string | null
          locale: string
          name: string
          timezone: string
        }
        Insert: {
          country_code?: string
          created_at?: string
          currency_code?: string
          id?: string
          legal_name?: string | null
          locale?: string
          name: string
          timezone?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          currency_code?: string
          id?: string
          legal_name?: string | null
          locale?: string
          name?: string
          timezone?: string
        }
        Relationships: []
      }
      payroll_adjustments: {
        Row: {
          amount: number
          component_code: string
          component_name: string
          component_type: string
          created_at: string
          created_by: string | null
          employee_id: string
          id: string
          notes: string | null
          organization_id: string
          payroll_run_id: string
          tax_treatment: string
          updated_at: string
        }
        Insert: {
          amount: number
          component_code: string
          component_name: string
          component_type: string
          created_at?: string
          created_by?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          organization_id: string
          payroll_run_id: string
          tax_treatment?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          component_code?: string
          component_name?: string
          component_type?: string
          created_at?: string
          created_by?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          payroll_run_id?: string
          tax_treatment?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_adjustments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_adjustments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_adjustments_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_run_lines: {
        Row: {
          calculation_snapshot: Json
          created_at: string
          employee_id: string
          gross_pay: number
          id: string
          net_pay: number
          payroll_run_id: string
          total_deductions: number
          total_earnings: number
          updated_at: string
        }
        Insert: {
          calculation_snapshot?: Json
          created_at?: string
          employee_id: string
          gross_pay?: number
          id?: string
          net_pay?: number
          payroll_run_id: string
          total_deductions?: number
          total_earnings?: number
          updated_at?: string
        }
        Update: {
          calculation_snapshot?: Json
          created_at?: string
          employee_id?: string
          gross_pay?: number
          id?: string
          net_pay?: number
          payroll_run_id?: string
          total_deductions?: number
          total_earnings?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_run_lines_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_run_lines_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attendance_month_lock_id: string | null
          created_at: string
          created_by: string | null
          finalized_at: string | null
          finalized_by: string | null
          id: string
          organization_id: string
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["payroll_run_status"]
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attendance_month_lock_id?: string | null
          created_at?: string
          created_by?: string | null
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          organization_id: string
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["payroll_run_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attendance_month_lock_id?: string | null
          created_at?: string
          created_by?: string | null
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          organization_id?: string
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["payroll_run_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_runs_attendance_month_lock_id_fkey"
            columns: ["attendance_month_lock_id"]
            isOneToOne: false
            referencedRelation: "attendance_month_locks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payslips: {
        Row: {
          created_at: string
          id: string
          payroll_run_line_id: string
          published_at: string | null
          storage_path: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          payroll_run_line_id: string
          published_at?: string | null
          storage_path?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          payroll_run_line_id?: string
          published_at?: string | null
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payslips_payroll_run_line_id_fkey"
            columns: ["payroll_run_line_id"]
            isOneToOne: false
            referencedRelation: "payroll_run_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_revisions: {
        Row: {
          annual_compensation: number
          created_at: string
          created_by: string | null
          currency_code: string
          effective_from: string
          employee_id: string
          id: string
          organization_id: string
          reason: string
        }
        Insert: {
          annual_compensation: number
          created_at?: string
          created_by?: string | null
          currency_code?: string
          effective_from: string
          employee_id: string
          id?: string
          organization_id: string
          reason: string
        }
        Update: {
          annual_compensation?: number
          created_at?: string
          created_by?: string | null
          currency_code?: string
          effective_from?: string
          employee_id?: string
          id?: string
          organization_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_revisions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_revisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      work_locations: {
        Row: {
          city: string
          country_code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
          state: string
          updated_at: string
        }
        Insert: {
          city: string
          country_code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          state: string
          updated_at?: string
        }
        Update: {
          city?: string
          country_code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      record_compensation_revision: {
        Args: {
          p_actor_id?: string
          p_annual_compensation: number
          p_effective_from: string
          p_employee_id: string
          p_reason: string
        }
        Returns: {
          annual_compensation: number
          created_at: string
          created_by: string | null
          currency_code: string
          effective_from: string
          employee_id: string
          id: string
          organization_id: string
          reason: string
        }
        SetofOptions: {
          from: "*"
          to: "salary_revisions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "hr" | "finance" | "manager" | "employee"
      employee_status:
        | "draft"
        | "active"
        | "on_leave"
        | "exit_pending"
        | "inactive"
      leave_status: "pending" | "approved" | "rejected" | "cancelled"
      payroll_run_status:
        | "draft"
        | "reviewing"
        | "approved"
        | "finalized"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "admin", "hr", "finance", "manager", "employee"],
      employee_status: [
        "draft",
        "active",
        "on_leave",
        "exit_pending",
        "inactive",
      ],
      leave_status: ["pending", "approved", "rejected", "cancelled"],
      payroll_run_status: [
        "draft",
        "reviewing",
        "approved",
        "finalized",
        "cancelled",
      ],
    },
  },
} as const
