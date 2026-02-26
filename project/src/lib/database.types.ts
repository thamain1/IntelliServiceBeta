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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounting_periods: {
        Row: {
          created_at: string | null
          end_date: string
          fiscal_period: number
          fiscal_year: number
          id: string
          locked_at: string | null
          locked_by: string | null
          locked_reason: string | null
          name: string
          start_date: string
          status: Database["public"]["Enums"]["period_status"] | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          fiscal_period: number
          fiscal_year: number
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          locked_reason?: string | null
          name: string
          start_date: string
          status?: Database["public"]["Enums"]["period_status"] | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          fiscal_period?: number
          fiscal_year?: number
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          locked_reason?: string | null
          name?: string
          start_date?: string
          status?: Database["public"]["Enums"]["period_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "accounting_periods_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_periods_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "accounting_periods_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "accounting_periods_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      accounting_settings: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          display_name: string
          display_order: number
          id: string
          is_editable: boolean
          setting_key: string
          setting_type: Database["public"]["Enums"]["setting_type"]
          setting_value: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          display_name: string
          display_order?: number
          id?: string
          is_editable?: boolean
          setting_key: string
          setting_type?: Database["public"]["Enums"]["setting_type"]
          setting_value: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          display_name?: string
          display_order?: number
          id?: string
          is_editable?: boolean
          setting_key?: string
          setting_type?: Database["public"]["Enums"]["setting_type"]
          setting_value?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      admin_audit_events: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          target_entity_id: string | null
          target_entity_type: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          target_entity_id?: string | null
          target_entity_type?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          target_entity_id?: string | null
          target_entity_type?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_events_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_events_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "admin_audit_events_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "admin_audit_events_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "admin_audit_events_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_events_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "admin_audit_events_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "admin_audit_events_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      ahs_audit_log: {
        Row: {
          action: string
          entity_id: string | null
          entity_type: string
          id: string
          new_value: Json | null
          notes: string | null
          old_value: Json | null
          performed_at: string | null
          performed_by: string | null
        }
        Insert: {
          action: string
          entity_id?: string | null
          entity_type: string
          id?: string
          new_value?: Json | null
          notes?: string | null
          old_value?: Json | null
          performed_at?: string | null
          performed_by?: string | null
        }
        Update: {
          action?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_value?: Json | null
          notes?: string | null
          old_value?: Json | null
          performed_at?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ahs_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ahs_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ahs_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "ahs_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      bank_reconciliations: {
        Row: {
          account_id: string
          book_balance: number | null
          calculated_book_balance: number | null
          cancelled_at: string | null
          cancelled_by: string | null
          cleared_balance: number | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          created_by: string | null
          difference: number | null
          id: string
          notes: string | null
          reconciled_by: string | null
          reconciliation_date: string
          rolled_back_at: string | null
          rolled_back_by: string | null
          statement_balance: number | null
          statement_end_date: string | null
          statement_ending_balance: number | null
          statement_start_date: string | null
          status: Database["public"]["Enums"]["reconciliation_status"] | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          book_balance?: number | null
          calculated_book_balance?: number | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cleared_balance?: number | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          difference?: number | null
          id?: string
          notes?: string | null
          reconciled_by?: string | null
          reconciliation_date?: string
          rolled_back_at?: string | null
          rolled_back_by?: string | null
          statement_balance?: number | null
          statement_end_date?: string | null
          statement_ending_balance?: number | null
          statement_start_date?: string | null
          status?: Database["public"]["Enums"]["reconciliation_status"] | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          book_balance?: number | null
          calculated_book_balance?: number | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cleared_balance?: number | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          difference?: number | null
          id?: string
          notes?: string | null
          reconciled_by?: string | null
          reconciliation_date?: string
          rolled_back_at?: string | null
          rolled_back_by?: string | null
          statement_balance?: number | null
          statement_end_date?: string | null
          statement_ending_balance?: number | null
          statement_start_date?: string | null
          status?: Database["public"]["Enums"]["reconciliation_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "gl_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "bank_reconciliations_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliations_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bank_reconciliations_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "bank_reconciliations_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "bank_reconciliations_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliations_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bank_reconciliations_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "bank_reconciliations_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "bank_reconciliations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bank_reconciliations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "bank_reconciliations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "bank_reconciliations_reconciled_by_fkey"
            columns: ["reconciled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliations_reconciled_by_fkey"
            columns: ["reconciled_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bank_reconciliations_reconciled_by_fkey"
            columns: ["reconciled_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "bank_reconciliations_reconciled_by_fkey"
            columns: ["reconciled_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "bank_reconciliations_rolled_back_by_fkey"
            columns: ["rolled_back_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliations_rolled_back_by_fkey"
            columns: ["rolled_back_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bank_reconciliations_rolled_back_by_fkey"
            columns: ["rolled_back_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "bank_reconciliations_rolled_back_by_fkey"
            columns: ["rolled_back_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      bank_statement_lines: {
        Row: {
          amount: number
          balance: number | null
          created_at: string | null
          description: string
          external_transaction_id: string | null
          id: string
          match_status:
            | Database["public"]["Enums"]["bank_line_match_status"]
            | null
          matched_at: string | null
          matched_by: string | null
          matched_gl_entry_id: string | null
          notes: string | null
          reconciliation_id: string
          transaction_date: string
        }
        Insert: {
          amount: number
          balance?: number | null
          created_at?: string | null
          description: string
          external_transaction_id?: string | null
          id?: string
          match_status?:
            | Database["public"]["Enums"]["bank_line_match_status"]
            | null
          matched_at?: string | null
          matched_by?: string | null
          matched_gl_entry_id?: string | null
          notes?: string | null
          reconciliation_id: string
          transaction_date: string
        }
        Update: {
          amount?: number
          balance?: number | null
          created_at?: string | null
          description?: string
          external_transaction_id?: string | null
          id?: string
          match_status?:
            | Database["public"]["Enums"]["bank_line_match_status"]
            | null
          matched_at?: string | null
          matched_by?: string | null
          matched_gl_entry_id?: string | null
          notes?: string | null
          reconciliation_id?: string
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_statement_lines_matched_by_fkey"
            columns: ["matched_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_statement_lines_matched_by_fkey"
            columns: ["matched_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bank_statement_lines_matched_by_fkey"
            columns: ["matched_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "bank_statement_lines_matched_by_fkey"
            columns: ["matched_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "bank_statement_lines_matched_gl_entry_id_fkey"
            columns: ["matched_gl_entry_id"]
            isOneToOne: false
            referencedRelation: "gl_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_statement_lines_matched_gl_entry_id_fkey"
            columns: ["matched_gl_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entry_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_statement_lines_reconciliation_id_fkey"
            columns: ["reconciliation_id"]
            isOneToOne: false
            referencedRelation: "bank_reconciliations"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_line_items: {
        Row: {
          amount: number
          bill_id: string
          created_at: string | null
          description: string
          gl_account_id: string | null
          id: string
          quantity: number
          sort_order: number | null
          unit_price: number
        }
        Insert: {
          amount: number
          bill_id: string
          created_at?: string | null
          description: string
          gl_account_id?: string | null
          id?: string
          quantity?: number
          sort_order?: number | null
          unit_price: number
        }
        Update: {
          amount?: number
          bill_id?: string
          created_at?: string | null
          description?: string
          gl_account_id?: string | null
          id?: string
          quantity?: number
          sort_order?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "bill_line_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_line_items_gl_account_id_fkey"
            columns: ["gl_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_line_items_gl_account_id_fkey"
            columns: ["gl_account_id"]
            isOneToOne: false
            referencedRelation: "gl_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_line_items_gl_account_id_fkey"
            columns: ["gl_account_id"]
            isOneToOne: false
            referencedRelation: "vw_trial_balance"
            referencedColumns: ["account_id"]
          },
        ]
      }
      bills: {
        Row: {
          amount_paid: number
          balance_due: number
          bill_date: string
          bill_number: string
          created_at: string | null
          created_by: string | null
          due_date: string
          id: string
          notes: string | null
          payment_terms: string | null
          received_date: string | null
          reference_number: string | null
          status: string
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          amount_paid?: number
          balance_due?: number
          bill_date: string
          bill_number: string
          created_at?: string | null
          created_by?: string | null
          due_date: string
          id?: string
          notes?: string | null
          payment_terms?: string | null
          received_date?: string | null
          reference_number?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          amount_paid?: number
          balance_due?: number
          bill_date?: string
          bill_number?: string
          created_at?: string | null
          created_by?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          payment_terms?: string | null
          received_date?: string | null
          reference_number?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bills_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "bills_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "bills_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_1099_report"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "bills_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_aging"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "bills_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_vendor_lead_time_metrics"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          account_code: string
          account_name: string
          account_subtype: string | null
          account_type: Database["public"]["Enums"]["account_type"]
          cash_flow_section: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_cash_account: boolean
          normal_balance: Database["public"]["Enums"]["normal_balance"]
          parent_account_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_code: string
          account_name: string
          account_subtype?: string | null
          account_type: Database["public"]["Enums"]["account_type"]
          cash_flow_section?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_cash_account?: boolean
          normal_balance: Database["public"]["Enums"]["normal_balance"]
          parent_account_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_code?: string
          account_name?: string
          account_subtype?: string | null
          account_type?: Database["public"]["Enums"]["account_type"]
          cash_flow_section?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_cash_account?: boolean
          normal_balance?: Database["public"]["Enums"]["normal_balance"]
          parent_account_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "gl_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "vw_trial_balance"
            referencedColumns: ["account_id"]
          },
        ]
      }
      contract_plans: {
        Row: {
          billing_frequency:
            | Database["public"]["Enums"]["contract_billing_frequency"]
            | null
          created_at: string | null
          created_by: string | null
          default_base_fee: number | null
          description: string | null
          id: string
          included_visits_per_year: number | null
          includes_after_hours_rate_reduction: boolean | null
          includes_emergency_service: boolean | null
          is_active: boolean | null
          labor_discount_percent: number | null
          labor_fixed_rate: number | null
          labor_rate_type: Database["public"]["Enums"]["labor_rate_type"] | null
          name: string
          parts_discount_percent: number | null
          priority_level: Database["public"]["Enums"]["priority_level"] | null
          response_time_sla_hours: number | null
          trip_charge_discount_percent: number | null
          updated_at: string | null
          updated_by: string | null
          waive_trip_charge: boolean | null
        }
        Insert: {
          billing_frequency?:
            | Database["public"]["Enums"]["contract_billing_frequency"]
            | null
          created_at?: string | null
          created_by?: string | null
          default_base_fee?: number | null
          description?: string | null
          id?: string
          included_visits_per_year?: number | null
          includes_after_hours_rate_reduction?: boolean | null
          includes_emergency_service?: boolean | null
          is_active?: boolean | null
          labor_discount_percent?: number | null
          labor_fixed_rate?: number | null
          labor_rate_type?:
            | Database["public"]["Enums"]["labor_rate_type"]
            | null
          name: string
          parts_discount_percent?: number | null
          priority_level?: Database["public"]["Enums"]["priority_level"] | null
          response_time_sla_hours?: number | null
          trip_charge_discount_percent?: number | null
          updated_at?: string | null
          updated_by?: string | null
          waive_trip_charge?: boolean | null
        }
        Update: {
          billing_frequency?:
            | Database["public"]["Enums"]["contract_billing_frequency"]
            | null
          created_at?: string | null
          created_by?: string | null
          default_base_fee?: number | null
          description?: string | null
          id?: string
          included_visits_per_year?: number | null
          includes_after_hours_rate_reduction?: boolean | null
          includes_emergency_service?: boolean | null
          is_active?: boolean | null
          labor_discount_percent?: number | null
          labor_fixed_rate?: number | null
          labor_rate_type?:
            | Database["public"]["Enums"]["labor_rate_type"]
            | null
          name?: string
          parts_discount_percent?: number | null
          priority_level?: Database["public"]["Enums"]["priority_level"] | null
          response_time_sla_hours?: number | null
          trip_charge_discount_percent?: number | null
          updated_at?: string | null
          updated_by?: string | null
          waive_trip_charge?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contract_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "contract_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "contract_plans_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_plans_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contract_plans_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "contract_plans_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      customer_account_sequences: {
        Row: {
          customer_type: Database["public"]["Enums"]["customer_type"]
          last_number: number
        }
        Insert: {
          customer_type: Database["public"]["Enums"]["customer_type"]
          last_number?: number
        }
        Update: {
          customer_type?: Database["public"]["Enums"]["customer_type"]
          last_number?: number
        }
        Relationships: []
      }
      customer_contacts: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: string
          email: string | null
          id: string
          is_billing_contact: boolean | null
          is_primary: boolean | null
          is_technical_contact: boolean | null
          location_id: string | null
          mobile: string | null
          name: string
          notes: string | null
          phone: string | null
          receive_estimates: boolean | null
          receive_invoices: boolean | null
          title: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          email?: string | null
          id?: string
          is_billing_contact?: boolean | null
          is_primary?: boolean | null
          is_technical_contact?: boolean | null
          location_id?: string | null
          mobile?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          receive_estimates?: boolean | null
          receive_invoices?: boolean | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          email?: string | null
          id?: string
          is_billing_contact?: boolean | null
          is_primary?: boolean | null
          is_technical_contact?: boolean | null
          location_id?: string | null
          mobile?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          receive_estimates?: boolean | null
          receive_invoices?: boolean | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "customer_contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "customer_contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "customer_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_contacts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "customer_location_summary"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "customer_contacts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "customer_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_contacts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "customer_contacts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "customer_contacts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "customer_contacts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_contacts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "customer_contacts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "customer_contacts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      customer_interactions: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: string
          direction: string | null
          duration_minutes: number | null
          follow_up_date: string | null
          id: string
          interaction_type: string
          notes: string | null
          outcome: string | null
          related_estimate_id: string | null
          related_ticket_id: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          direction?: string | null
          duration_minutes?: number | null
          follow_up_date?: string | null
          id?: string
          interaction_type: string
          notes?: string | null
          outcome?: string | null
          related_estimate_id?: string | null
          related_ticket_id?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          direction?: string | null
          duration_minutes?: number | null
          follow_up_date?: string | null
          id?: string
          interaction_type?: string
          notes?: string | null
          outcome?: string | null
          related_estimate_id?: string | null
          related_ticket_id?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_interactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_interactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "customer_interactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "customer_interactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "customer_interactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_interactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_interactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_interactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_interactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_interactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_interactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_interactions_related_estimate_id_fkey"
            columns: ["related_estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_interactions_related_estimate_id_fkey"
            columns: ["related_estimate_id"]
            isOneToOne: false
            referencedRelation: "vw_estimate_margin"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "customer_interactions_related_estimate_id_fkey"
            columns: ["related_estimate_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "customer_interactions_related_ticket_id_fkey"
            columns: ["related_ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "customer_interactions_related_ticket_id_fkey"
            columns: ["related_ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "customer_interactions_related_ticket_id_fkey"
            columns: ["related_ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "customer_interactions_related_ticket_id_fkey"
            columns: ["related_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_interactions_related_ticket_id_fkey"
            columns: ["related_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_interactions_related_ticket_id_fkey"
            columns: ["related_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "customer_interactions_related_ticket_id_fkey"
            columns: ["related_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "customer_interactions_related_ticket_id_fkey"
            columns: ["related_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "customer_interactions_related_ticket_id_fkey"
            columns: ["related_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_interactions_related_ticket_id_fkey"
            columns: ["related_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "customer_interactions_related_ticket_id_fkey"
            columns: ["related_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "customer_interactions_related_ticket_id_fkey"
            columns: ["related_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "customer_interactions_related_ticket_id_fkey"
            columns: ["related_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      customer_locations: {
        Row: {
          address: string | null
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          customer_id: string
          id: string
          import_batch_id: string | null
          is_active: boolean | null
          is_primary: boolean | null
          location_name: string
          location_notes: string | null
          state: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          import_batch_id?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          location_name?: string
          location_notes?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          import_batch_id?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          location_name?: string
          location_notes?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_locations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_locations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_locations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_locations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_locations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_locations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_locations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_locations_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_parts_installed: {
        Row: {
          created_at: string | null
          customer_id: string
          equipment_id: string | null
          id: string
          installation_date: string
          installed_by: string | null
          location_notes: string | null
          notes: string | null
          part_id: string
          quantity: number
          ticket_id: string | null
          updated_at: string | null
          warranty_expiration: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          equipment_id?: string | null
          id?: string
          installation_date?: string
          installed_by?: string | null
          location_notes?: string | null
          notes?: string | null
          part_id: string
          quantity?: number
          ticket_id?: string | null
          updated_at?: string | null
          warranty_expiration?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          equipment_id?: string | null
          id?: string
          installation_date?: string
          installed_by?: string | null
          location_notes?: string | null
          notes?: string | null
          part_id?: string
          quantity?: number
          ticket_id?: string | null
          updated_at?: string | null
          warranty_expiration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_parts_installed_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_parts_installed_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_parts_installed_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_parts_installed_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_parts_installed_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_parts_installed_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_parts_installed_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_parts_installed_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "customer_parts_installed_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_parts_installed_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "customer_parts_installed_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_with_installed_parts"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "customer_parts_installed_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "customer_parts_installed_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_parts_installed_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "customer_parts_installed_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "customer_parts_installed_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "customer_parts_installed_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "customer_parts_installed_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "customer_parts_installed_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_parts_installed_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "customer_parts_installed_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_parts_installed_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "customer_parts_installed_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_parts_installed_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "customer_parts_installed_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "customer_parts_installed_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "customer_parts_installed_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_parts_installed_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_parts_installed_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "customer_parts_installed_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "customer_parts_installed_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "customer_parts_installed_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_parts_installed_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "customer_parts_installed_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "customer_parts_installed_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "customer_parts_installed_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      customer_revenue_summary: {
        Row: {
          average_ticket_value: number | null
          completed_tickets: number | null
          created_at: string | null
          customer_id: string
          last_invoice_date: string | null
          last_service_date: string | null
          outstanding_balance: number | null
          total_billed: number | null
          total_collected: number | null
          total_labor_cost: number | null
          total_parts_cost: number | null
          total_revenue: number | null
          total_tickets: number | null
          updated_at: string | null
          ytd_billed: number | null
          ytd_collected: number | null
          ytd_revenue: number | null
        }
        Insert: {
          average_ticket_value?: number | null
          completed_tickets?: number | null
          created_at?: string | null
          customer_id: string
          last_invoice_date?: string | null
          last_service_date?: string | null
          outstanding_balance?: number | null
          total_billed?: number | null
          total_collected?: number | null
          total_labor_cost?: number | null
          total_parts_cost?: number | null
          total_revenue?: number | null
          total_tickets?: number | null
          updated_at?: string | null
          ytd_billed?: number | null
          ytd_collected?: number | null
          ytd_revenue?: number | null
        }
        Update: {
          average_ticket_value?: number | null
          completed_tickets?: number | null
          created_at?: string | null
          customer_id?: string
          last_invoice_date?: string | null
          last_service_date?: string | null
          outstanding_balance?: number | null
          total_billed?: number | null
          total_collected?: number | null
          total_labor_cost?: number | null
          total_parts_cost?: number | null
          total_revenue?: number | null
          total_tickets?: number | null
          updated_at?: string | null
          ytd_billed?: number | null
          ytd_collected?: number | null
          ytd_revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_revenue_summary_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_revenue_summary_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_revenue_summary_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_revenue_summary_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_revenue_summary_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_revenue_summary_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_revenue_summary_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customers: {
        Row: {
          account_number: string | null
          address: string | null
          balance: number | null
          churned_at: string | null
          city: string | null
          converted_at: string | null
          created_at: string | null
          created_by: string | null
          credit_terms: string | null
          customer_type: Database["public"]["Enums"]["customer_type"] | null
          email: string | null
          external_customer_id: string | null
          external_id: string | null
          geocode_source: string | null
          geocoded_at: string | null
          id: string
          import_batch_id: string | null
          imported_at: string | null
          latitude: number | null
          lead_source: string | null
          longitude: number | null
          name: string
          notes: string | null
          phone: string | null
          place_id: string | null
          prospect_replacement_flag: boolean | null
          site_contact_name: string | null
          site_contact_phone: string | null
          state: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
          zip_code: string | null
        }
        Insert: {
          account_number?: string | null
          address?: string | null
          balance?: number | null
          churned_at?: string | null
          city?: string | null
          converted_at?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_terms?: string | null
          customer_type?: Database["public"]["Enums"]["customer_type"] | null
          email?: string | null
          external_customer_id?: string | null
          external_id?: string | null
          geocode_source?: string | null
          geocoded_at?: string | null
          id?: string
          import_batch_id?: string | null
          imported_at?: string | null
          latitude?: number | null
          lead_source?: string | null
          longitude?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          place_id?: string | null
          prospect_replacement_flag?: boolean | null
          site_contact_name?: string | null
          site_contact_phone?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          zip_code?: string | null
        }
        Update: {
          account_number?: string | null
          address?: string | null
          balance?: number | null
          churned_at?: string | null
          city?: string | null
          converted_at?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_terms?: string | null
          customer_type?: Database["public"]["Enums"]["customer_type"] | null
          email?: string | null
          external_customer_id?: string | null
          external_id?: string | null
          geocode_source?: string | null
          geocoded_at?: string | null
          id?: string
          import_batch_id?: string | null
          imported_at?: string | null
          latitude?: number | null
          lead_source?: string | null
          longitude?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          place_id?: string | null
          prospect_replacement_flag?: boolean | null
          site_contact_name?: string | null
          site_contact_phone?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "customers_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "customers_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "customers_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      deal_pipelines: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      deal_stages: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_lost: boolean | null
          is_won: boolean | null
          name: string
          pipeline_id: string
          probability: number | null
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_lost?: boolean | null
          is_won?: boolean | null
          name: string
          pipeline_id: string
          probability?: number | null
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_lost?: boolean | null
          is_won?: boolean | null
          name?: string
          pipeline_id?: string
          probability?: number | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "deal_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_deductions: {
        Row: {
          amount: number | null
          created_at: string | null
          deduction_id: string
          id: string
          is_active: boolean | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          deduction_id: string
          id?: string
          is_active?: boolean | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          deduction_id?: string
          id?: string
          is_active?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_deductions_deduction_id_fkey"
            columns: ["deduction_id"]
            isOneToOne: false
            referencedRelation: "payroll_deductions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_deductions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_deductions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "employee_deductions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "employee_deductions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      employee_pay_rates: {
        Row: {
          bonus_eligible: boolean | null
          created_at: string | null
          effective_date: string
          end_date: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          overtime_rate: number | null
          overtime_threshold: number | null
          pay_frequency: Database["public"]["Enums"]["pay_frequency"] | null
          per_diem_rate: number | null
          salary_amount: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bonus_eligible?: boolean | null
          created_at?: string | null
          effective_date?: string
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          overtime_rate?: number | null
          overtime_threshold?: number | null
          pay_frequency?: Database["public"]["Enums"]["pay_frequency"] | null
          per_diem_rate?: number | null
          salary_amount?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bonus_eligible?: boolean | null
          created_at?: string | null
          effective_date?: string
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          overtime_rate?: number | null
          overtime_threshold?: number | null
          pay_frequency?: Database["public"]["Enums"]["pay_frequency"] | null
          per_diem_rate?: number | null
          salary_amount?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_pay_rates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_pay_rates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "employee_pay_rates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "employee_pay_rates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      equipment: {
        Row: {
          created_at: string | null
          customer_id: string | null
          equipment_type: string
          id: string
          installation_date: string | null
          is_active: boolean | null
          location: string | null
          location_id: string | null
          manufacturer: string
          model_number: string
          notes: string | null
          serial_number: string
          updated_at: string | null
          warranty_expiration: string | null
          warranty_status: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          equipment_type: string
          id?: string
          installation_date?: string | null
          is_active?: boolean | null
          location?: string | null
          location_id?: string | null
          manufacturer: string
          model_number: string
          notes?: string | null
          serial_number: string
          updated_at?: string | null
          warranty_expiration?: string | null
          warranty_status?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          equipment_type?: string
          id?: string
          installation_date?: string | null
          is_active?: boolean | null
          location?: string | null
          location_id?: string | null
          manufacturer?: string
          model_number?: string
          notes?: string | null
          serial_number?: string
          updated_at?: string | null
          warranty_expiration?: string | null
          warranty_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "equipment_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "equipment_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "equipment_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "equipment_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "equipment_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "customer_location_summary"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "equipment_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "customer_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "equipment_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "equipment_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["location_id"]
          },
        ]
      }
      estimate_activity_log: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          estimate_id: string
          id: string
          new_status: Database["public"]["Enums"]["estimate_status"] | null
          old_status: Database["public"]["Enums"]["estimate_status"] | null
          performed_by: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          estimate_id: string
          id?: string
          new_status?: Database["public"]["Enums"]["estimate_status"] | null
          old_status?: Database["public"]["Enums"]["estimate_status"] | null
          performed_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          estimate_id?: string
          id?: string
          new_status?: Database["public"]["Enums"]["estimate_status"] | null
          old_status?: Database["public"]["Enums"]["estimate_status"] | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_activity_log_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_activity_log_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "vw_estimate_margin"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "estimate_activity_log_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "estimate_activity_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_activity_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "estimate_activity_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "estimate_activity_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      estimate_attachments: {
        Row: {
          created_at: string | null
          description: string | null
          estimate_id: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimate_id: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimate_id?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_attachments_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_attachments_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "vw_estimate_margin"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "estimate_attachments_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "estimate_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "estimate_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "estimate_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      estimate_conversions: {
        Row: {
          created_at: string | null
          created_by: string | null
          estimate_id: string
          id: string
          metadata: Json | null
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          estimate_id: string
          id?: string
          metadata?: Json | null
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          estimate_id?: string
          id?: string
          metadata?: Json | null
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_conversions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_conversions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "estimate_conversions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "estimate_conversions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "estimate_conversions_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: true
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_conversions_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: true
            referencedRelation: "vw_estimate_margin"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "estimate_conversions_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: true
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["estimate_id"]
          },
        ]
      }
      estimate_delivery_attempts: {
        Row: {
          channel: string
          created_at: string | null
          created_by: string | null
          delivered_at: string | null
          error: string | null
          failed_at: string | null
          id: string
          link_id: string
          provider: string
          provider_message_id: string | null
          sent_at: string | null
          status: string
          to_address: string
        }
        Insert: {
          channel: string
          created_at?: string | null
          created_by?: string | null
          delivered_at?: string | null
          error?: string | null
          failed_at?: string | null
          id?: string
          link_id: string
          provider: string
          provider_message_id?: string | null
          sent_at?: string | null
          status: string
          to_address: string
        }
        Update: {
          channel?: string
          created_at?: string | null
          created_by?: string | null
          delivered_at?: string | null
          error?: string | null
          failed_at?: string | null
          id?: string
          link_id?: string
          provider?: string
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          to_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_delivery_attempts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_delivery_attempts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "estimate_delivery_attempts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "estimate_delivery_attempts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "estimate_delivery_attempts_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "estimate_public_links"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_events: {
        Row: {
          actor_ip: string | null
          actor_type: string
          actor_user_agent: string | null
          actor_user_id: string | null
          created_at: string | null
          estimate_id: string
          event_type: string
          id: string
          link_id: string | null
          metadata: Json
        }
        Insert: {
          actor_ip?: string | null
          actor_type: string
          actor_user_agent?: string | null
          actor_user_id?: string | null
          created_at?: string | null
          estimate_id: string
          event_type: string
          id?: string
          link_id?: string | null
          metadata?: Json
        }
        Update: {
          actor_ip?: string | null
          actor_type?: string
          actor_user_agent?: string | null
          actor_user_id?: string | null
          created_at?: string | null
          estimate_id?: string
          event_type?: string
          id?: string
          link_id?: string | null
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "estimate_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "estimate_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "estimate_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "estimate_events_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_events_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "vw_estimate_margin"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "estimate_events_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "estimate_events_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "estimate_public_links"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_line_items: {
        Row: {
          bill_rate: number | null
          contract_id_applied: string | null
          cost_as_of: string | null
          cost_source: string | null
          created_at: string | null
          description: string
          equipment_id: string | null
          estimate_id: string
          ext_cost: number | null
          id: string
          is_covered: boolean | null
          item_type: Database["public"]["Enums"]["estimate_line_item_type"]
          labor_hours: number | null
          labor_rate: number | null
          line_order: number
          line_total: number
          notes: string | null
          overridden_at: string | null
          overridden_by: string | null
          override_reason: string | null
          part_id: string | null
          payer_type: Database["public"]["Enums"]["payer_type"] | null
          quantity: number | null
          rate_source: Database["public"]["Enums"]["rate_source"] | null
          rate_type: Database["public"]["Enums"]["labor_rate_tier"] | null
          unit_cost: number | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          bill_rate?: number | null
          contract_id_applied?: string | null
          cost_as_of?: string | null
          cost_source?: string | null
          created_at?: string | null
          description: string
          equipment_id?: string | null
          estimate_id: string
          ext_cost?: number | null
          id?: string
          is_covered?: boolean | null
          item_type: Database["public"]["Enums"]["estimate_line_item_type"]
          labor_hours?: number | null
          labor_rate?: number | null
          line_order?: number
          line_total: number
          notes?: string | null
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          part_id?: string | null
          payer_type?: Database["public"]["Enums"]["payer_type"] | null
          quantity?: number | null
          rate_source?: Database["public"]["Enums"]["rate_source"] | null
          rate_type?: Database["public"]["Enums"]["labor_rate_tier"] | null
          unit_cost?: number | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          bill_rate?: number | null
          contract_id_applied?: string | null
          cost_as_of?: string | null
          cost_source?: string | null
          created_at?: string | null
          description?: string
          equipment_id?: string | null
          estimate_id?: string
          ext_cost?: number | null
          id?: string
          is_covered?: boolean | null
          item_type?: Database["public"]["Enums"]["estimate_line_item_type"]
          labor_hours?: number | null
          labor_rate?: number | null
          line_order?: number
          line_total?: number
          notes?: string | null
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          part_id?: string | null
          payer_type?: Database["public"]["Enums"]["payer_type"] | null
          quantity?: number | null
          rate_source?: Database["public"]["Enums"]["rate_source"] | null
          rate_type?: Database["public"]["Enums"]["labor_rate_tier"] | null
          unit_cost?: number | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_line_items_contract_id_applied_fkey"
            columns: ["contract_id_applied"]
            isOneToOne: false
            referencedRelation: "service_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_line_items_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "estimate_line_items_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_line_items_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "estimate_line_items_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_with_installed_parts"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "estimate_line_items_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "estimate_line_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_line_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "vw_estimate_margin"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "estimate_line_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "estimate_line_items_overridden_by_fkey"
            columns: ["overridden_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_line_items_overridden_by_fkey"
            columns: ["overridden_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "estimate_line_items_overridden_by_fkey"
            columns: ["overridden_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "estimate_line_items_overridden_by_fkey"
            columns: ["overridden_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "estimate_line_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "estimate_line_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "estimate_line_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_line_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "estimate_line_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_line_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "estimate_line_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_public_links: {
        Row: {
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string
          decided_at: string | null
          decided_ip: string | null
          decided_name: string | null
          decided_user_agent: string | null
          decision: string | null
          decision_comment: string | null
          estimate_id: string
          expires_at: string | null
          id: string
          last_viewed_at: string | null
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          token: string | null
          token_hash: string
          view_count: number | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          decided_at?: string | null
          decided_ip?: string | null
          decided_name?: string | null
          decided_user_agent?: string | null
          decision?: string | null
          decision_comment?: string | null
          estimate_id: string
          expires_at?: string | null
          id?: string
          last_viewed_at?: string | null
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          token?: string | null
          token_hash: string
          view_count?: number | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          decided_at?: string | null
          decided_ip?: string | null
          decided_name?: string | null
          decided_user_agent?: string | null
          decision?: string | null
          decision_comment?: string | null
          estimate_id?: string
          expires_at?: string | null
          id?: string
          last_viewed_at?: string | null
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          token?: string | null
          token_hash?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_public_links_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "customer_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_public_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_public_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "estimate_public_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "estimate_public_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "estimate_public_links_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "estimate_public_links_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "estimate_public_links_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_public_links_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "estimate_public_links_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_public_links_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "estimate_public_links_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "estimate_public_links_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_public_links_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "vw_estimate_margin"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "estimate_public_links_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "estimate_public_links_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_public_links_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "estimate_public_links_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "estimate_public_links_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      estimate_sequences: {
        Row: {
          created_at: string | null
          day_of_month: number
          id: string
          last_sequence: number | null
          updated_at: string | null
          year_month: string
        }
        Insert: {
          created_at?: string | null
          day_of_month: number
          id?: string
          last_sequence?: number | null
          updated_at?: string | null
          year_month: string
        }
        Update: {
          created_at?: string | null
          day_of_month?: number
          id?: string
          last_sequence?: number | null
          updated_at?: string | null
          year_month?: string
        }
        Relationships: []
      }
      estimates: {
        Row: {
          accepted_date: string | null
          assigned_to: string | null
          conversion_date: string | null
          converted_to_project_id: string | null
          converted_to_ticket_id: string | null
          created_at: string | null
          created_by: string
          customer_id: string
          days_in_stage: number | null
          deal_stage_id: string | null
          discount_amount: number | null
          estimate_date: string | null
          estimate_number: string
          expected_close_date: string | null
          expiration_date: string | null
          id: string
          internal_notes: string | null
          job_description: string | null
          job_title: string
          location_id: string | null
          lost_reason: string | null
          notes: string | null
          pricing_tier:
            | Database["public"]["Enums"]["estimate_pricing_tier"]
            | null
          rejected_date: string | null
          sent_date: string | null
          service_contract_id: string | null
          site_location: string | null
          stage_entered_at: string | null
          status: Database["public"]["Enums"]["estimate_status"] | null
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          terms_and_conditions: string | null
          total_amount: number | null
          updated_at: string | null
          updated_by: string | null
          viewed_date: string | null
        }
        Insert: {
          accepted_date?: string | null
          assigned_to?: string | null
          conversion_date?: string | null
          converted_to_project_id?: string | null
          converted_to_ticket_id?: string | null
          created_at?: string | null
          created_by: string
          customer_id: string
          days_in_stage?: number | null
          deal_stage_id?: string | null
          discount_amount?: number | null
          estimate_date?: string | null
          estimate_number: string
          expected_close_date?: string | null
          expiration_date?: string | null
          id?: string
          internal_notes?: string | null
          job_description?: string | null
          job_title: string
          location_id?: string | null
          lost_reason?: string | null
          notes?: string | null
          pricing_tier?:
            | Database["public"]["Enums"]["estimate_pricing_tier"]
            | null
          rejected_date?: string | null
          sent_date?: string | null
          service_contract_id?: string | null
          site_location?: string | null
          stage_entered_at?: string | null
          status?: Database["public"]["Enums"]["estimate_status"] | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          terms_and_conditions?: string | null
          total_amount?: number | null
          updated_at?: string | null
          updated_by?: string | null
          viewed_date?: string | null
        }
        Update: {
          accepted_date?: string | null
          assigned_to?: string | null
          conversion_date?: string | null
          converted_to_project_id?: string | null
          converted_to_ticket_id?: string | null
          created_at?: string | null
          created_by?: string
          customer_id?: string
          days_in_stage?: number | null
          deal_stage_id?: string | null
          discount_amount?: number | null
          estimate_date?: string | null
          estimate_number?: string
          expected_close_date?: string | null
          expiration_date?: string | null
          id?: string
          internal_notes?: string | null
          job_description?: string | null
          job_title?: string
          location_id?: string | null
          lost_reason?: string | null
          notes?: string | null
          pricing_tier?:
            | Database["public"]["Enums"]["estimate_pricing_tier"]
            | null
          rejected_date?: string | null
          sent_date?: string | null
          service_contract_id?: string | null
          site_location?: string | null
          stage_entered_at?: string | null
          status?: Database["public"]["Enums"]["estimate_status"] | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          terms_and_conditions?: string | null
          total_amount?: number | null
          updated_at?: string | null
          updated_by?: string | null
          viewed_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "estimates_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "estimates_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "estimates_converted_to_project_id_fkey"
            columns: ["converted_to_project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "estimates_converted_to_project_id_fkey"
            columns: ["converted_to_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_converted_to_project_id_fkey"
            columns: ["converted_to_project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "estimates_converted_to_project_id_fkey"
            columns: ["converted_to_project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "estimates_converted_to_project_id_fkey"
            columns: ["converted_to_project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
          {
            foreignKeyName: "estimates_converted_to_ticket_id_fkey"
            columns: ["converted_to_ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "estimates_converted_to_ticket_id_fkey"
            columns: ["converted_to_ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "estimates_converted_to_ticket_id_fkey"
            columns: ["converted_to_ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "estimates_converted_to_ticket_id_fkey"
            columns: ["converted_to_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_converted_to_ticket_id_fkey"
            columns: ["converted_to_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_converted_to_ticket_id_fkey"
            columns: ["converted_to_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "estimates_converted_to_ticket_id_fkey"
            columns: ["converted_to_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "estimates_converted_to_ticket_id_fkey"
            columns: ["converted_to_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "estimates_converted_to_ticket_id_fkey"
            columns: ["converted_to_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_converted_to_ticket_id_fkey"
            columns: ["converted_to_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "estimates_converted_to_ticket_id_fkey"
            columns: ["converted_to_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "estimates_converted_to_ticket_id_fkey"
            columns: ["converted_to_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "estimates_converted_to_ticket_id_fkey"
            columns: ["converted_to_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "estimates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "estimates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "estimates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "estimates_deal_stage_id_fkey"
            columns: ["deal_stage_id"]
            isOneToOne: false
            referencedRelation: "deal_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "customer_location_summary"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "estimates_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "customer_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "estimates_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "estimates_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "estimates_service_contract_id_fkey"
            columns: ["service_contract_id"]
            isOneToOne: false
            referencedRelation: "service_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "estimates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "estimates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      gl_audit_log: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          changed_fields: Json | null
          created_at: string | null
          entry_number: string | null
          gl_entry_id: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          performed_by: string | null
          reason: string | null
          user_agent: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          changed_fields?: Json | null
          created_at?: string | null
          entry_number?: string | null
          gl_entry_id?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
          reason?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          changed_fields?: Json | null
          created_at?: string | null
          entry_number?: string | null
          gl_entry_id?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
          reason?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gl_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "gl_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "gl_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      gl_entries: {
        Row: {
          account_id: string
          cleared_at: string | null
          cleared_by_user_id: string | null
          created_at: string | null
          created_by: string | null
          credit_amount: number | null
          debit_amount: number | null
          description: string
          entry_date: string
          entry_number: string
          fiscal_period: number
          fiscal_year: number
          id: string
          import_batch_id: string | null
          is_posted: boolean | null
          is_voided: boolean | null
          posted_by: string
          reconciliation_id: string | null
          reference_id: string | null
          reference_type: string | null
          reversing_entry_id: string | null
          updated_at: string | null
          updated_by: string | null
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          account_id: string
          cleared_at?: string | null
          cleared_by_user_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description: string
          entry_date?: string
          entry_number: string
          fiscal_period: number
          fiscal_year: number
          id?: string
          import_batch_id?: string | null
          is_posted?: boolean | null
          is_voided?: boolean | null
          posted_by: string
          reconciliation_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          reversing_entry_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          account_id?: string
          cleared_at?: string | null
          cleared_by_user_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string
          entry_date?: string
          entry_number?: string
          fiscal_period?: number
          fiscal_year?: number
          id?: string
          import_batch_id?: string | null
          is_posted?: boolean | null
          is_voided?: boolean | null
          posted_by?: string
          reconciliation_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          reversing_entry_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gl_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "gl_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "gl_entries_cleared_by_user_id_fkey"
            columns: ["cleared_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_entries_cleared_by_user_id_fkey"
            columns: ["cleared_by_user_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "gl_entries_cleared_by_user_id_fkey"
            columns: ["cleared_by_user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "gl_entries_cleared_by_user_id_fkey"
            columns: ["cleared_by_user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "gl_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "gl_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "gl_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "gl_entries_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_entries_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_entries_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "gl_entries_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "gl_entries_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "gl_entries_reconciliation_id_fkey"
            columns: ["reconciliation_id"]
            isOneToOne: false
            referencedRelation: "bank_reconciliations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_entries_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_entries_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "gl_entries_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "gl_entries_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "gl_entries_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_entries_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "gl_entries_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "gl_entries_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      import_ar_staging: {
        Row: {
          aging_bucket: string | null
          balance_due: number | null
          created_at: string | null
          current_amount: number | null
          days_1_30: number | null
          days_31_60: number | null
          days_61_90: number | null
          days_90_plus: number | null
          description: string | null
          due_date: string | null
          external_customer_id: string | null
          external_invoice_number: string | null
          id: string
          import_batch_id: string
          imported_at: string | null
          imported_customer_id: string | null
          imported_invoice_id: string | null
          invoice_amount: number | null
          issue_date: string | null
          raw_row_json: Json
          row_number: number
          validation_errors: Json | null
          validation_status:
            | Database["public"]["Enums"]["import_validation_status"]
            | null
        }
        Insert: {
          aging_bucket?: string | null
          balance_due?: number | null
          created_at?: string | null
          current_amount?: number | null
          days_1_30?: number | null
          days_31_60?: number | null
          days_61_90?: number | null
          days_90_plus?: number | null
          description?: string | null
          due_date?: string | null
          external_customer_id?: string | null
          external_invoice_number?: string | null
          id?: string
          import_batch_id: string
          imported_at?: string | null
          imported_customer_id?: string | null
          imported_invoice_id?: string | null
          invoice_amount?: number | null
          issue_date?: string | null
          raw_row_json: Json
          row_number: number
          validation_errors?: Json | null
          validation_status?:
            | Database["public"]["Enums"]["import_validation_status"]
            | null
        }
        Update: {
          aging_bucket?: string | null
          balance_due?: number | null
          created_at?: string | null
          current_amount?: number | null
          days_1_30?: number | null
          days_31_60?: number | null
          days_61_90?: number | null
          days_90_plus?: number | null
          description?: string | null
          due_date?: string | null
          external_customer_id?: string | null
          external_invoice_number?: string | null
          id?: string
          import_batch_id?: string
          imported_at?: string | null
          imported_customer_id?: string | null
          imported_invoice_id?: string | null
          invoice_amount?: number | null
          issue_date?: string | null
          raw_row_json?: Json
          row_number?: number
          validation_errors?: Json | null
          validation_status?:
            | Database["public"]["Enums"]["import_validation_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "import_ar_staging_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          batch_number: string
          committed_rows: number | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          entity_type: Database["public"]["Enums"]["import_entity_type"]
          error_summary: string | null
          file_encoding: string | null
          file_name: string
          file_size: number | null
          id: string
          is_cancel_requested: boolean | null
          is_rollback_requested: boolean | null
          last_error_at: string | null
          last_error_message: string | null
          mapping_config: Json | null
          phase: Database["public"]["Enums"]["import_phase"] | null
          rolled_back_at: string | null
          rows_error: number | null
          rows_imported: number | null
          rows_total: number | null
          rows_valid: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["import_batch_status"]
          supports_rollback: boolean | null
          updated_at: string | null
          validated_rows: number | null
        }
        Insert: {
          batch_number: string
          committed_rows?: number | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          entity_type: Database["public"]["Enums"]["import_entity_type"]
          error_summary?: string | null
          file_encoding?: string | null
          file_name: string
          file_size?: number | null
          id?: string
          is_cancel_requested?: boolean | null
          is_rollback_requested?: boolean | null
          last_error_at?: string | null
          last_error_message?: string | null
          mapping_config?: Json | null
          phase?: Database["public"]["Enums"]["import_phase"] | null
          rolled_back_at?: string | null
          rows_error?: number | null
          rows_imported?: number | null
          rows_total?: number | null
          rows_valid?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["import_batch_status"]
          supports_rollback?: boolean | null
          updated_at?: string | null
          validated_rows?: number | null
        }
        Update: {
          batch_number?: string
          committed_rows?: number | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          entity_type?: Database["public"]["Enums"]["import_entity_type"]
          error_summary?: string | null
          file_encoding?: string | null
          file_name?: string
          file_size?: number | null
          id?: string
          is_cancel_requested?: boolean | null
          is_rollback_requested?: boolean | null
          last_error_at?: string | null
          last_error_message?: string | null
          mapping_config?: Json | null
          phase?: Database["public"]["Enums"]["import_phase"] | null
          rolled_back_at?: string | null
          rows_error?: number | null
          rows_imported?: number | null
          rows_total?: number | null
          rows_valid?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["import_batch_status"]
          supports_rollback?: boolean | null
          updated_at?: string | null
          validated_rows?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "import_batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "import_batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      import_customers_staging: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          customer_type: string | null
          email: string | null
          external_customer_id: string | null
          id: string
          import_batch_id: string
          imported_at: string | null
          imported_customer_id: string | null
          name: string | null
          notes: string | null
          phone: string | null
          raw_row_json: Json
          row_number: number
          state: string | null
          validation_errors: Json | null
          validation_status:
            | Database["public"]["Enums"]["import_validation_status"]
            | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          customer_type?: string | null
          email?: string | null
          external_customer_id?: string | null
          id?: string
          import_batch_id: string
          imported_at?: string | null
          imported_customer_id?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          raw_row_json: Json
          row_number: number
          state?: string | null
          validation_errors?: Json | null
          validation_status?:
            | Database["public"]["Enums"]["import_validation_status"]
            | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          customer_type?: string | null
          email?: string | null
          external_customer_id?: string | null
          id?: string
          import_batch_id?: string
          imported_at?: string | null
          imported_customer_id?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          raw_row_json?: Json
          row_number?: number
          state?: string | null
          validation_errors?: Json | null
          validation_status?:
            | Database["public"]["Enums"]["import_validation_status"]
            | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_customers_staging_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      import_history_staging: {
        Row: {
          amount: number | null
          completed_date: string | null
          created_at: string | null
          description: string | null
          document_date: string | null
          document_number: string | null
          due_date: string | null
          external_customer_id: string | null
          external_id: string | null
          id: string
          import_batch_id: string
          imported_invoice_id: string | null
          imported_payment_id: string | null
          imported_ticket_id: string | null
          matched_customer_id: string | null
          paid_amount: number | null
          paid_date: string | null
          payment_method: string | null
          priority: string | null
          raw_row_json: Json | null
          record_type: string
          reference_number: string | null
          row_number: number
          status: string | null
          ticket_type: string | null
          validation_errors: Json | null
          validation_status: string
        }
        Insert: {
          amount?: number | null
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          document_date?: string | null
          document_number?: string | null
          due_date?: string | null
          external_customer_id?: string | null
          external_id?: string | null
          id?: string
          import_batch_id: string
          imported_invoice_id?: string | null
          imported_payment_id?: string | null
          imported_ticket_id?: string | null
          matched_customer_id?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          priority?: string | null
          raw_row_json?: Json | null
          record_type: string
          reference_number?: string | null
          row_number: number
          status?: string | null
          ticket_type?: string | null
          validation_errors?: Json | null
          validation_status?: string
        }
        Update: {
          amount?: number | null
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          document_date?: string | null
          document_number?: string | null
          due_date?: string | null
          external_customer_id?: string | null
          external_id?: string | null
          id?: string
          import_batch_id?: string
          imported_invoice_id?: string | null
          imported_payment_id?: string | null
          imported_ticket_id?: string | null
          matched_customer_id?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          priority?: string | null
          raw_row_json?: Json | null
          record_type?: string
          reference_number?: string | null
          row_number?: number
          status?: string | null
          ticket_type?: string | null
          validation_errors?: Json | null
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_history_staging_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_history_staging_imported_invoice_id_fkey"
            columns: ["imported_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "import_history_staging_imported_invoice_id_fkey"
            columns: ["imported_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_traceability_report"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "import_history_staging_imported_invoice_id_fkey"
            columns: ["imported_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_history_staging_imported_ticket_id_fkey"
            columns: ["imported_ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "import_history_staging_imported_ticket_id_fkey"
            columns: ["imported_ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "import_history_staging_imported_ticket_id_fkey"
            columns: ["imported_ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "import_history_staging_imported_ticket_id_fkey"
            columns: ["imported_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_history_staging_imported_ticket_id_fkey"
            columns: ["imported_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_history_staging_imported_ticket_id_fkey"
            columns: ["imported_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "import_history_staging_imported_ticket_id_fkey"
            columns: ["imported_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "import_history_staging_imported_ticket_id_fkey"
            columns: ["imported_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "import_history_staging_imported_ticket_id_fkey"
            columns: ["imported_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_history_staging_imported_ticket_id_fkey"
            columns: ["imported_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "import_history_staging_imported_ticket_id_fkey"
            columns: ["imported_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "import_history_staging_imported_ticket_id_fkey"
            columns: ["imported_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "import_history_staging_imported_ticket_id_fkey"
            columns: ["imported_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "import_history_staging_matched_customer_id_fkey"
            columns: ["matched_customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "import_history_staging_matched_customer_id_fkey"
            columns: ["matched_customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "import_history_staging_matched_customer_id_fkey"
            columns: ["matched_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_history_staging_matched_customer_id_fkey"
            columns: ["matched_customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "import_history_staging_matched_customer_id_fkey"
            columns: ["matched_customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_history_staging_matched_customer_id_fkey"
            columns: ["matched_customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "import_history_staging_matched_customer_id_fkey"
            columns: ["matched_customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      import_items_staging: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          external_item_id: string | null
          id: string
          import_batch_id: string
          imported_part_id: string | null
          matched_vendor_id: string | null
          name: string | null
          quantity_on_hand: number | null
          raw_row_json: Json | null
          reorder_point: number | null
          row_number: number
          sku: string | null
          unit_cost: number | null
          unit_price: number | null
          validation_errors: Json | null
          validation_status: string
          vendor_code: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          external_item_id?: string | null
          id?: string
          import_batch_id: string
          imported_part_id?: string | null
          matched_vendor_id?: string | null
          name?: string | null
          quantity_on_hand?: number | null
          raw_row_json?: Json | null
          reorder_point?: number | null
          row_number: number
          sku?: string | null
          unit_cost?: number | null
          unit_price?: number | null
          validation_errors?: Json | null
          validation_status?: string
          vendor_code?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          external_item_id?: string | null
          id?: string
          import_batch_id?: string
          imported_part_id?: string | null
          matched_vendor_id?: string | null
          name?: string | null
          quantity_on_hand?: number | null
          raw_row_json?: Json | null
          reorder_point?: number | null
          row_number?: number
          sku?: string | null
          unit_cost?: number | null
          unit_price?: number | null
          validation_errors?: Json | null
          validation_status?: string
          vendor_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_items_staging_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_items_staging_imported_part_id_fkey"
            columns: ["imported_part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "import_items_staging_imported_part_id_fkey"
            columns: ["imported_part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "import_items_staging_imported_part_id_fkey"
            columns: ["imported_part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_items_staging_imported_part_id_fkey"
            columns: ["imported_part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "import_items_staging_imported_part_id_fkey"
            columns: ["imported_part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_items_staging_imported_part_id_fkey"
            columns: ["imported_part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "import_items_staging_imported_part_id_fkey"
            columns: ["imported_part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_items_staging_matched_vendor_id_fkey"
            columns: ["matched_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_items_staging_matched_vendor_id_fkey"
            columns: ["matched_vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_1099_report"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "import_items_staging_matched_vendor_id_fkey"
            columns: ["matched_vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_aging"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "import_items_staging_matched_vendor_id_fkey"
            columns: ["matched_vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_vendor_lead_time_metrics"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      import_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          import_batch_id: string
          log_level: Database["public"]["Enums"]["import_log_level"] | null
          message: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          import_batch_id: string
          log_level?: Database["public"]["Enums"]["import_log_level"] | null
          message: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          import_batch_id?: string
          log_level?: Database["public"]["Enums"]["import_log_level"] | null
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_logs_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      import_rollback_logs: {
        Row: {
          action: string
          created_at: string | null
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          import_batch_id: string
          reason: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          import_batch_id: string
          reason?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          import_batch_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_rollback_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_rollback_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "import_rollback_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "import_rollback_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "import_rollback_logs_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      import_vendors_staging: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string | null
          external_vendor_id: string | null
          id: string
          import_batch_id: string
          imported_vendor_id: string | null
          name: string | null
          notes: string | null
          payment_terms: string | null
          phone: string | null
          postal_code: string | null
          raw_row_json: Json | null
          row_number: number
          state: string | null
          tax_id: string | null
          validation_errors: Json | null
          validation_status: string
          vendor_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          external_vendor_id?: string | null
          id?: string
          import_batch_id: string
          imported_vendor_id?: string | null
          name?: string | null
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          raw_row_json?: Json | null
          row_number: number
          state?: string | null
          tax_id?: string | null
          validation_errors?: Json | null
          validation_status?: string
          vendor_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          external_vendor_id?: string | null
          id?: string
          import_batch_id?: string
          imported_vendor_id?: string | null
          name?: string | null
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          raw_row_json?: Json | null
          row_number?: number
          state?: string | null
          tax_id?: string | null
          validation_errors?: Json | null
          validation_status?: string
          vendor_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_vendors_staging_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_vendors_staging_imported_vendor_id_fkey"
            columns: ["imported_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_vendors_staging_imported_vendor_id_fkey"
            columns: ["imported_vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_1099_report"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "import_vendors_staging_imported_vendor_id_fkey"
            columns: ["imported_vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_aging"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "import_vendors_staging_imported_vendor_id_fkey"
            columns: ["imported_vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_vendor_lead_time_metrics"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      inventory_balances: {
        Row: {
          id: string
          last_counted_at: string | null
          last_counted_by: string | null
          location_id: string
          part_id: string
          quantity: number | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          last_counted_at?: string | null
          last_counted_by?: string | null
          location_id: string
          part_id: string
          quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          last_counted_at?: string | null
          last_counted_by?: string | null
          location_id?: string
          part_id?: string
          quantity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_balances_last_counted_by_fkey"
            columns: ["last_counted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_balances_last_counted_by_fkey"
            columns: ["last_counted_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "inventory_balances_last_counted_by_fkey"
            columns: ["last_counted_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "inventory_balances_last_counted_by_fkey"
            columns: ["last_counted_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "inventory_balances_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_balances_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_balances_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inventory_with_serials"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_balances_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_balances_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "inventory_balances_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "inventory_balances_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_balances_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "inventory_balances_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_balances_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "inventory_balances_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string | null
          created_by: string | null
          from_location_id: string | null
          id: string
          moved_by: string | null
          movement_date: string | null
          movement_type: Database["public"]["Enums"]["movement_type"]
          notes: string | null
          part_id: string
          po_id: string | null
          project_id: string | null
          quantity: number | null
          reference_id: string | null
          reference_type: string | null
          serialized_part_id: string | null
          ticket_id: string | null
          to_location_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          from_location_id?: string | null
          id?: string
          moved_by?: string | null
          movement_date?: string | null
          movement_type: Database["public"]["Enums"]["movement_type"]
          notes?: string | null
          part_id: string
          po_id?: string | null
          project_id?: string | null
          quantity?: number | null
          reference_id?: string | null
          reference_type?: string | null
          serialized_part_id?: string | null
          ticket_id?: string | null
          to_location_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          from_location_id?: string | null
          id?: string
          moved_by?: string | null
          movement_date?: string | null
          movement_type?: Database["public"]["Enums"]["movement_type"]
          notes?: string | null
          part_id?: string
          po_id?: string | null
          project_id?: string | null
          quantity?: number | null
          reference_id?: string | null
          reference_type?: string | null
          serialized_part_id?: string | null
          ticket_id?: string | null
          to_location_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "inventory_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "inventory_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "inventory_movements_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_movements_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inventory_with_serials"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_movements_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_movements_moved_by_fkey"
            columns: ["moved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_moved_by_fkey"
            columns: ["moved_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "inventory_movements_moved_by_fkey"
            columns: ["moved_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "inventory_movements_moved_by_fkey"
            columns: ["moved_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "inventory_movements_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "inventory_movements_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "inventory_movements_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "inventory_movements_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "inventory_movements_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "inventory_movements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "inventory_movements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "inventory_movements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
          {
            foreignKeyName: "inventory_movements_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "equipment_with_installed_parts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "inventory_movements_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "serialized_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "serialized_parts_available_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "serialized_parts_installed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["serialized_part_id"]
          },
          {
            foreignKeyName: "inventory_movements_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "inventory_movements_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "inventory_movements_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "inventory_movements_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "inventory_movements_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "inventory_movements_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "inventory_movements_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "inventory_movements_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "inventory_movements_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "inventory_movements_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "inventory_movements_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_movements_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inventory_with_serials"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_movements_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_movements_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "inventory_movements_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "inventory_movements_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      inventory_reorder_policies: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          lead_days_override: number | null
          location_id: string | null
          max_qty: number
          min_qty: number
          notes: string | null
          part_id: string
          reorder_method: Database["public"]["Enums"]["reorder_method"] | null
          review_period_days: number | null
          safety_stock_qty: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          lead_days_override?: number | null
          location_id?: string | null
          max_qty?: number
          min_qty?: number
          notes?: string | null
          part_id: string
          reorder_method?: Database["public"]["Enums"]["reorder_method"] | null
          review_period_days?: number | null
          safety_stock_qty?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          lead_days_override?: number | null
          location_id?: string | null
          max_qty?: number
          min_qty?: number
          notes?: string | null
          part_id?: string
          reorder_method?: Database["public"]["Enums"]["reorder_method"] | null
          review_period_days?: number | null
          safety_stock_qty?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reorder_policies_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_reorder_policies_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reorder_policies_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inventory_with_serials"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_reorder_policies_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_reorder_policies_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "inventory_reorder_policies_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "inventory_reorder_policies_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reorder_policies_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "inventory_reorder_policies_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reorder_policies_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "inventory_reorder_policies_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          import_batch_id: string | null
          invoice_id: string
          is_deposit: boolean | null
          is_retainage: boolean | null
          item_type: Database["public"]["Enums"]["invoice_line_item_type"]
          line_total: number
          part_id: string | null
          payer_type: Database["public"]["Enums"]["payer_type"] | null
          project_billing_schedule_id: string | null
          project_id: string | null
          project_task_id: string | null
          quantity: number
          sort_order: number | null
          taxable: boolean | null
          ticket_id: string | null
          time_log_id: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          import_batch_id?: string | null
          invoice_id: string
          is_deposit?: boolean | null
          is_retainage?: boolean | null
          item_type: Database["public"]["Enums"]["invoice_line_item_type"]
          line_total: number
          part_id?: string | null
          payer_type?: Database["public"]["Enums"]["payer_type"] | null
          project_billing_schedule_id?: string | null
          project_id?: string | null
          project_task_id?: string | null
          quantity?: number
          sort_order?: number | null
          taxable?: boolean | null
          ticket_id?: string | null
          time_log_id?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          import_batch_id?: string | null
          invoice_id?: string
          is_deposit?: boolean | null
          is_retainage?: boolean | null
          item_type?: Database["public"]["Enums"]["invoice_line_item_type"]
          line_total?: number
          part_id?: string | null
          payer_type?: Database["public"]["Enums"]["payer_type"] | null
          project_billing_schedule_id?: string | null
          project_id?: string | null
          project_task_id?: string | null
          quantity?: number
          sort_order?: number | null
          taxable?: boolean | null
          ticket_id?: string | null
          time_log_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_traceability_report"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "invoice_line_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "invoice_line_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "invoice_line_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "invoice_line_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_project_billing_schedule_id_fkey"
            columns: ["project_billing_schedule_id"]
            isOneToOne: false
            referencedRelation: "project_billing_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "invoice_line_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "invoice_line_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "invoice_line_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
          {
            foreignKeyName: "invoice_line_items_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoice_line_items_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "invoice_line_items_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoice_line_items_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "invoice_line_items_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "invoice_line_items_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoice_line_items_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoice_line_items_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoice_line_items_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoice_line_items_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoice_line_items_time_log_id_fkey"
            columns: ["time_log_id"]
            isOneToOne: false
            referencedRelation: "labor_profitability_summary"
            referencedColumns: ["time_log_id"]
          },
          {
            foreignKeyName: "invoice_line_items_time_log_id_fkey"
            columns: ["time_log_id"]
            isOneToOne: false
            referencedRelation: "time_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          balance_due: number
          created_at: string | null
          created_by: string
          customer_id: string
          customer_notes: string | null
          discount_amount: number
          due_date: string
          external_invoice_number: string | null
          gl_entry_ids: string[] | null
          gl_posted: boolean | null
          gl_posted_at: string | null
          id: string
          import_batch_id: string | null
          imported_at: string | null
          invoice_number: string
          is_historical: boolean | null
          is_migrated_opening_balance: boolean | null
          issue_date: string
          notes: string | null
          paid_date: string | null
          payment_terms: string | null
          project_id: string | null
          service_contract_id: string | null
          site_id: string | null
          source_ticket_id: string | null
          source_type: Database["public"]["Enums"]["invoice_source_type"] | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          subtotal: number
          tax_amount: number
          tax_rate: number
          ticket_id: string | null
          total_amount: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          amount_paid?: number
          balance_due?: number
          created_at?: string | null
          created_by: string
          customer_id: string
          customer_notes?: string | null
          discount_amount?: number
          due_date: string
          external_invoice_number?: string | null
          gl_entry_ids?: string[] | null
          gl_posted?: boolean | null
          gl_posted_at?: string | null
          id?: string
          import_batch_id?: string | null
          imported_at?: string | null
          invoice_number: string
          is_historical?: boolean | null
          is_migrated_opening_balance?: boolean | null
          issue_date?: string
          notes?: string | null
          paid_date?: string | null
          payment_terms?: string | null
          project_id?: string | null
          service_contract_id?: string | null
          site_id?: string | null
          source_ticket_id?: string | null
          source_type?:
            | Database["public"]["Enums"]["invoice_source_type"]
            | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          ticket_id?: string | null
          total_amount?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          amount_paid?: number
          balance_due?: number
          created_at?: string | null
          created_by?: string
          customer_id?: string
          customer_notes?: string | null
          discount_amount?: number
          due_date?: string
          external_invoice_number?: string | null
          gl_entry_ids?: string[] | null
          gl_posted?: boolean | null
          gl_posted_at?: string | null
          id?: string
          import_batch_id?: string | null
          imported_at?: string | null
          invoice_number?: string
          is_historical?: boolean | null
          is_migrated_opening_balance?: boolean | null
          issue_date?: string
          notes?: string | null
          paid_date?: string | null
          payment_terms?: string | null
          project_id?: string | null
          service_contract_id?: string | null
          site_id?: string | null
          source_ticket_id?: string | null
          source_type?:
            | Database["public"]["Enums"]["invoice_source_type"]
            | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          ticket_id?: string | null
          total_amount?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "invoices_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
          {
            foreignKeyName: "invoices_service_contract_id_fkey"
            columns: ["service_contract_id"]
            isOneToOne: false
            referencedRelation: "service_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "customer_location_summary"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "invoices_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "customer_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "invoices_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "invoices_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "invoices_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "invoices_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      labor_rate_profile: {
        Row: {
          after_hours_rate: number
          created_at: string | null
          description: string | null
          emergency_rate: number
          id: string
          is_active: boolean | null
          notes: string | null
          profile_name: string | null
          standard_hours_end: string | null
          standard_hours_start: string | null
          standard_rate: number
          updated_at: string | null
        }
        Insert: {
          after_hours_rate?: number
          created_at?: string | null
          description?: string | null
          emergency_rate?: number
          id?: string
          is_active?: boolean | null
          notes?: string | null
          profile_name?: string | null
          standard_hours_end?: string | null
          standard_hours_start?: string | null
          standard_rate?: number
          updated_at?: string | null
        }
        Update: {
          after_hours_rate?: number
          created_at?: string | null
          description?: string | null
          emergency_rate?: number
          id?: string
          is_active?: boolean | null
          notes?: string | null
          profile_name?: string | null
          standard_hours_end?: string | null
          standard_hours_start?: string | null
          standard_rate?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          notification_type: string
          read_at: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          notification_type: string
          read_at?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string
          read_at?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      organization_features: {
        Row: {
          config: Json | null
          created_at: string | null
          description: string | null
          display_name: string
          feature_key: string
          id: string
          is_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          display_name: string
          feature_key: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          feature_key?: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      part_installations: {
        Row: {
          created_at: string | null
          equipment_location_notes: string | null
          from_location_id: string | null
          id: string
          installation_date: string | null
          installed_at_site_id: string
          installed_by: string | null
          installed_on_equipment_id: string | null
          notes: string | null
          part_id: string
          project_task_id: string | null
          quantity: number | null
          removal_date: string | null
          removal_reason: string | null
          removed_by: string | null
          serialized_part_id: string | null
          ticket_id: string | null
          updated_at: string | null
          warranty_end_date: string | null
          warranty_months: number | null
          warranty_start_date: string | null
        }
        Insert: {
          created_at?: string | null
          equipment_location_notes?: string | null
          from_location_id?: string | null
          id?: string
          installation_date?: string | null
          installed_at_site_id: string
          installed_by?: string | null
          installed_on_equipment_id?: string | null
          notes?: string | null
          part_id: string
          project_task_id?: string | null
          quantity?: number | null
          removal_date?: string | null
          removal_reason?: string | null
          removed_by?: string | null
          serialized_part_id?: string | null
          ticket_id?: string | null
          updated_at?: string | null
          warranty_end_date?: string | null
          warranty_months?: number | null
          warranty_start_date?: string | null
        }
        Update: {
          created_at?: string | null
          equipment_location_notes?: string | null
          from_location_id?: string | null
          id?: string
          installation_date?: string | null
          installed_at_site_id?: string
          installed_by?: string | null
          installed_on_equipment_id?: string | null
          notes?: string | null
          part_id?: string
          project_task_id?: string | null
          quantity?: number | null
          removal_date?: string | null
          removal_reason?: string | null
          removed_by?: string | null
          serialized_part_id?: string | null
          ticket_id?: string | null
          updated_at?: string | null
          warranty_end_date?: string | null
          warranty_months?: number | null
          warranty_start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "part_installations_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "part_installations_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inventory_with_serials"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "part_installations_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "part_installations_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "part_installations_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "part_installations_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "part_installations_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "part_installations_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "part_installations_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "part_installations_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "part_installations_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "part_installations_installed_on_equipment_id_fkey"
            columns: ["installed_on_equipment_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "part_installations_installed_on_equipment_id_fkey"
            columns: ["installed_on_equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_installed_on_equipment_id_fkey"
            columns: ["installed_on_equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "part_installations_installed_on_equipment_id_fkey"
            columns: ["installed_on_equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_with_installed_parts"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "part_installations_installed_on_equipment_id_fkey"
            columns: ["installed_on_equipment_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "part_installations_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_installations_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_installations_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_installations_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_installations_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "part_installations_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "part_installations_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "part_installations_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "equipment_with_installed_parts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_installations_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "serialized_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "serialized_parts_available_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "serialized_parts_installed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["serialized_part_id"]
          },
          {
            foreignKeyName: "part_installations_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      part_inventory: {
        Row: {
          created_at: string | null
          id: string
          part_id: string
          quantity: number
          reserved_at: string | null
          reserved_by: string | null
          reserved_for_ticket_id: string | null
          stock_location_id: string
          unit_cost: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          part_id: string
          quantity?: number
          reserved_at?: string | null
          reserved_by?: string | null
          reserved_for_ticket_id?: string | null
          stock_location_id: string
          unit_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          part_id?: string
          quantity?: number
          reserved_at?: string | null
          reserved_by?: string | null
          reserved_for_ticket_id?: string | null
          stock_location_id?: string
          unit_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "part_inventory_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_inventory_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_inventory_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_inventory_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_inventory_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_inventory_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_inventory_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_inventory_reserved_by_fkey"
            columns: ["reserved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_inventory_reserved_by_fkey"
            columns: ["reserved_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "part_inventory_reserved_by_fkey"
            columns: ["reserved_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "part_inventory_reserved_by_fkey"
            columns: ["reserved_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "part_inventory_reserved_for_ticket_id_fkey"
            columns: ["reserved_for_ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_inventory_reserved_for_ticket_id_fkey"
            columns: ["reserved_for_ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "part_inventory_reserved_for_ticket_id_fkey"
            columns: ["reserved_for_ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_inventory_reserved_for_ticket_id_fkey"
            columns: ["reserved_for_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_inventory_reserved_for_ticket_id_fkey"
            columns: ["reserved_for_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_inventory_reserved_for_ticket_id_fkey"
            columns: ["reserved_for_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "part_inventory_reserved_for_ticket_id_fkey"
            columns: ["reserved_for_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "part_inventory_reserved_for_ticket_id_fkey"
            columns: ["reserved_for_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_inventory_reserved_for_ticket_id_fkey"
            columns: ["reserved_for_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_inventory_reserved_for_ticket_id_fkey"
            columns: ["reserved_for_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_inventory_reserved_for_ticket_id_fkey"
            columns: ["reserved_for_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_inventory_reserved_for_ticket_id_fkey"
            columns: ["reserved_for_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_inventory_reserved_for_ticket_id_fkey"
            columns: ["reserved_for_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_inventory_stock_location_id_fkey"
            columns: ["stock_location_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "part_inventory_stock_location_id_fkey"
            columns: ["stock_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_inventory_stock_location_id_fkey"
            columns: ["stock_location_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inventory_with_serials"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "part_inventory_stock_location_id_fkey"
            columns: ["stock_location_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["location_id"]
          },
        ]
      }
      part_usage_log: {
        Row: {
          created_at: string | null
          from_location_id: string | null
          id: string
          notes: string | null
          part_id: string
          project_id: string | null
          quantity_used: number
          serialized_part_id: string | null
          ticket_id: string | null
          total_cost: number | null
          unit_cost: number | null
          usage_date: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string | null
          from_location_id?: string | null
          id?: string
          notes?: string | null
          part_id: string
          project_id?: string | null
          quantity_used: number
          serialized_part_id?: string | null
          ticket_id?: string | null
          total_cost?: number | null
          unit_cost?: number | null
          usage_date?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string | null
          from_location_id?: string | null
          id?: string
          notes?: string | null
          part_id?: string
          project_id?: string | null
          quantity_used?: number
          serialized_part_id?: string | null
          ticket_id?: string | null
          total_cost?: number | null
          unit_cost?: number | null
          usage_date?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "part_usage_log_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "part_usage_log_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_usage_log_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inventory_with_serials"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "part_usage_log_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "part_usage_log_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_usage_log_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_usage_log_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_usage_log_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_usage_log_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_usage_log_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_usage_log_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_usage_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "part_usage_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_usage_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "part_usage_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "part_usage_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
          {
            foreignKeyName: "part_usage_log_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "equipment_with_installed_parts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_usage_log_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "serialized_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_usage_log_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "serialized_parts_available_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_usage_log_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "serialized_parts_installed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_usage_log_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["serialized_part_id"]
          },
          {
            foreignKeyName: "part_usage_log_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_usage_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_usage_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "part_usage_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_usage_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_usage_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_usage_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "part_usage_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "part_usage_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_usage_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_usage_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_usage_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_usage_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_usage_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_usage_log_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_usage_log_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "part_usage_log_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "part_usage_log_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      parts: {
        Row: {
          asset_tag: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          default_warranty_months: number | null
          description: string | null
          id: string
          is_returnable: boolean
          is_serialized: boolean | null
          item_type: string
          location: string | null
          manufacturer: string | null
          name: string
          part_number: string
          preferred_vendor_id: string | null
          quantity_on_hand: number | null
          registration_url: string | null
          reorder_level: number | null
          reorder_point: number | null
          reorder_quantity: number | null
          requires_registration: boolean | null
          tool_category: string | null
          unit_price: number | null
          updated_at: string | null
          updated_by: string | null
          vendor_part_number: string | null
          warranty_period_months: number | null
        }
        Insert: {
          asset_tag?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          default_warranty_months?: number | null
          description?: string | null
          id?: string
          is_returnable?: boolean
          is_serialized?: boolean | null
          item_type?: string
          location?: string | null
          manufacturer?: string | null
          name: string
          part_number: string
          preferred_vendor_id?: string | null
          quantity_on_hand?: number | null
          registration_url?: string | null
          reorder_level?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          requires_registration?: boolean | null
          tool_category?: string | null
          unit_price?: number | null
          updated_at?: string | null
          updated_by?: string | null
          vendor_part_number?: string | null
          warranty_period_months?: number | null
        }
        Update: {
          asset_tag?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          default_warranty_months?: number | null
          description?: string | null
          id?: string
          is_returnable?: boolean
          is_serialized?: boolean | null
          item_type?: string
          location?: string | null
          manufacturer?: string | null
          name?: string
          part_number?: string
          preferred_vendor_id?: string | null
          quantity_on_hand?: number | null
          registration_url?: string | null
          reorder_level?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          requires_registration?: boolean | null
          tool_category?: string | null
          unit_price?: number | null
          updated_at?: string | null
          updated_by?: string | null
          vendor_part_number?: string | null
          warranty_period_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "parts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "parts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "parts_preferred_vendor_id_fkey"
            columns: ["preferred_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_preferred_vendor_id_fkey"
            columns: ["preferred_vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_1099_report"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "parts_preferred_vendor_id_fkey"
            columns: ["preferred_vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_aging"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "parts_preferred_vendor_id_fkey"
            columns: ["preferred_vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_vendor_lead_time_metrics"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "parts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "parts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "parts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      parts_usage: {
        Row: {
          created_at: string | null
          id: string
          part_id: string
          quantity_used: number
          recorded_by: string
          ticket_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          part_id: string
          quantity_used?: number
          recorded_by: string
          ticket_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          part_id?: string
          quantity_used?: number
          recorded_by?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parts_usage_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "parts_usage_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "parts_usage_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_usage_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "parts_usage_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_usage_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "parts_usage_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_usage_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_usage_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "parts_usage_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "parts_usage_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "parts_usage_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "parts_usage_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "parts_usage_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "parts_usage_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_usage_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_usage_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "parts_usage_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "parts_usage_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "parts_usage_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_usage_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "parts_usage_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "parts_usage_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "parts_usage_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          gl_entry_ids: string[] | null
          gl_posted: boolean | null
          gl_posted_at: string | null
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: string
          recorded_by: string
          reference_number: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          gl_entry_ids?: string[] | null
          gl_posted?: boolean | null
          gl_posted_at?: string | null
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_method: string
          recorded_by: string
          reference_number?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          gl_entry_ids?: string[] | null
          gl_posted?: boolean | null
          gl_posted_at?: string | null
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          recorded_by?: string
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_traceability_report"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      payroll_deductions: {
        Row: {
          calculation_method:
            | Database["public"]["Enums"]["calculation_method"]
            | null
          created_at: string | null
          deduction_name: string
          deduction_type: Database["public"]["Enums"]["deduction_type"]
          default_amount: number | null
          id: string
          is_active: boolean | null
          is_pre_tax: boolean | null
        }
        Insert: {
          calculation_method?:
            | Database["public"]["Enums"]["calculation_method"]
            | null
          created_at?: string | null
          deduction_name: string
          deduction_type: Database["public"]["Enums"]["deduction_type"]
          default_amount?: number | null
          id?: string
          is_active?: boolean | null
          is_pre_tax?: boolean | null
        }
        Update: {
          calculation_method?:
            | Database["public"]["Enums"]["calculation_method"]
            | null
          created_at?: string | null
          deduction_name?: string
          deduction_type?: Database["public"]["Enums"]["deduction_type"]
          default_amount?: number | null
          id?: string
          is_active?: boolean | null
          is_pre_tax?: boolean | null
        }
        Relationships: []
      }
      payroll_details: {
        Row: {
          bonus_hours: number | null
          bonus_pay: number | null
          created_at: string | null
          federal_tax: number | null
          gross_pay: number | null
          id: string
          medicare: number | null
          net_pay: number | null
          notes: string | null
          other_deductions: number | null
          overtime_hours: number | null
          overtime_pay: number | null
          payroll_run_id: string
          per_diem_pay: number | null
          regular_hours: number | null
          regular_pay: number | null
          social_security: number | null
          state_tax: number | null
          total_deductions: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bonus_hours?: number | null
          bonus_pay?: number | null
          created_at?: string | null
          federal_tax?: number | null
          gross_pay?: number | null
          id?: string
          medicare?: number | null
          net_pay?: number | null
          notes?: string | null
          other_deductions?: number | null
          overtime_hours?: number | null
          overtime_pay?: number | null
          payroll_run_id: string
          per_diem_pay?: number | null
          regular_hours?: number | null
          regular_pay?: number | null
          social_security?: number | null
          state_tax?: number | null
          total_deductions?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bonus_hours?: number | null
          bonus_pay?: number | null
          created_at?: string | null
          federal_tax?: number | null
          gross_pay?: number | null
          id?: string
          medicare?: number | null
          net_pay?: number | null
          notes?: string | null
          other_deductions?: number | null
          overtime_hours?: number | null
          overtime_pay?: number | null
          payroll_run_id?: string
          per_diem_pay?: number | null
          regular_hours?: number | null
          regular_pay?: number | null
          social_security?: number | null
          state_tax?: number | null
          total_deductions?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_details_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "payroll_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "payroll_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          employee_count: number | null
          gl_posted: boolean | null
          id: string
          notes: string | null
          pay_date: string
          period_end_date: string
          period_start_date: string
          processed_by: string
          run_number: string
          status: Database["public"]["Enums"]["payroll_run_status"] | null
          total_deductions: number | null
          total_gross_pay: number | null
          total_net_pay: number | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          employee_count?: number | null
          gl_posted?: boolean | null
          id?: string
          notes?: string | null
          pay_date: string
          period_end_date: string
          period_start_date: string
          processed_by: string
          run_number: string
          status?: Database["public"]["Enums"]["payroll_run_status"] | null
          total_deductions?: number | null
          total_gross_pay?: number | null
          total_net_pay?: number | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          employee_count?: number | null
          gl_posted?: boolean | null
          id?: string
          notes?: string | null
          pay_date?: string
          period_end_date?: string
          period_start_date?: string
          processed_by?: string
          run_number?: string
          status?: Database["public"]["Enums"]["payroll_run_status"] | null
          total_deductions?: number | null
          total_gross_pay?: number | null
          total_net_pay?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_runs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "payroll_runs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "payroll_runs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "payroll_runs_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "payroll_runs_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "payroll_runs_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          default_vehicle_id: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          labor_cost_per_hour: number | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          default_vehicle_id?: string | null
          email: string
          full_name: string
          id: string
          is_active?: boolean | null
          labor_cost_per_hour?: number | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          default_vehicle_id?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          labor_cost_per_hour?: number | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_vehicle_id_fkey"
            columns: ["default_vehicle_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "profiles_default_vehicle_id_fkey"
            columns: ["default_vehicle_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_default_vehicle_id_fkey"
            columns: ["default_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inventory_with_serials"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "profiles_default_vehicle_id_fkey"
            columns: ["default_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["location_id"]
          },
        ]
      }
      project_billing_schedules: {
        Row: {
          amount: number | null
          billed_amount: number | null
          billing_type: Database["public"]["Enums"]["billing_type"]
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          invoice_id: string | null
          is_deposit: boolean | null
          is_retainage: boolean | null
          name: string
          percent_of_contract: number | null
          project_id: string
          sequence: number
          status: Database["public"]["Enums"]["billing_schedule_status"] | null
          target_date: string | null
          target_event: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          amount?: number | null
          billed_amount?: number | null
          billing_type?: Database["public"]["Enums"]["billing_type"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          is_deposit?: boolean | null
          is_retainage?: boolean | null
          name: string
          percent_of_contract?: number | null
          project_id: string
          sequence?: number
          status?: Database["public"]["Enums"]["billing_schedule_status"] | null
          target_date?: string | null
          target_event?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          amount?: number | null
          billed_amount?: number | null
          billing_type?: Database["public"]["Enums"]["billing_type"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          is_deposit?: boolean | null
          is_retainage?: boolean | null
          name?: string
          percent_of_contract?: number | null
          project_id?: string
          sequence?: number
          status?: Database["public"]["Enums"]["billing_schedule_status"] | null
          target_date?: string | null
          target_event?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_billing_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_billing_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "project_billing_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "project_billing_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "project_billing_schedules_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "project_billing_schedules_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_traceability_report"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "project_billing_schedules_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_billing_schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_billing_schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_billing_schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "project_billing_schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_billing_schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
          {
            foreignKeyName: "project_billing_schedules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_billing_schedules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "project_billing_schedules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "project_billing_schedules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      project_change_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          change_number: string
          cost_impact: number | null
          created_at: string | null
          description: string
          id: string
          project_id: string
          reason: string | null
          requested_by: string
          status: Database["public"]["Enums"]["change_order_status"] | null
          time_impact_days: number | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          change_number: string
          cost_impact?: number | null
          created_at?: string | null
          description: string
          id?: string
          project_id: string
          reason?: string | null
          requested_by: string
          status?: Database["public"]["Enums"]["change_order_status"] | null
          time_impact_days?: number | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          change_number?: string
          cost_impact?: number | null
          created_at?: string | null
          description?: string
          id?: string
          project_id?: string
          reason?: string | null
          requested_by?: string
          status?: Database["public"]["Enums"]["change_order_status"] | null
          time_impact_days?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_change_orders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_change_orders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "project_change_orders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "project_change_orders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "project_change_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_change_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_change_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "project_change_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_change_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
          {
            foreignKeyName: "project_change_orders_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_change_orders_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "project_change_orders_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "project_change_orders_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      project_deposit_releases: {
        Row: {
          created_at: string | null
          created_by: string | null
          deposit_amount: number
          deposit_invoice_id: string
          deposit_invoice_line_id: string | null
          gl_entry_id: string | null
          gl_posted: boolean | null
          gl_posted_at: string | null
          id: string
          notes: string | null
          project_id: string
          related_invoice_id: string | null
          related_milestone_id: string | null
          release_amount: number
          release_date: string
          release_reason: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deposit_amount: number
          deposit_invoice_id: string
          deposit_invoice_line_id?: string | null
          gl_entry_id?: string | null
          gl_posted?: boolean | null
          gl_posted_at?: string | null
          id?: string
          notes?: string | null
          project_id: string
          related_invoice_id?: string | null
          related_milestone_id?: string | null
          release_amount: number
          release_date?: string
          release_reason?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deposit_amount?: number
          deposit_invoice_id?: string
          deposit_invoice_line_id?: string | null
          gl_entry_id?: string | null
          gl_posted?: boolean | null
          gl_posted_at?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          related_invoice_id?: string | null
          related_milestone_id?: string | null
          release_amount?: number
          release_date?: string
          release_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_deposit_releases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_deposit_releases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "project_deposit_releases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "project_deposit_releases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "project_deposit_releases_deposit_invoice_id_fkey"
            columns: ["deposit_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "project_deposit_releases_deposit_invoice_id_fkey"
            columns: ["deposit_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_traceability_report"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "project_deposit_releases_deposit_invoice_id_fkey"
            columns: ["deposit_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_deposit_releases_deposit_invoice_line_id_fkey"
            columns: ["deposit_invoice_line_id"]
            isOneToOne: false
            referencedRelation: "invoice_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_deposit_releases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_deposit_releases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_deposit_releases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "project_deposit_releases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_deposit_releases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
          {
            foreignKeyName: "project_deposit_releases_related_invoice_id_fkey"
            columns: ["related_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "project_deposit_releases_related_invoice_id_fkey"
            columns: ["related_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_traceability_report"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "project_deposit_releases_related_invoice_id_fkey"
            columns: ["related_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_deposit_releases_related_milestone_id_fkey"
            columns: ["related_milestone_id"]
            isOneToOne: false
            referencedRelation: "project_billing_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents: {
        Row: {
          created_at: string | null
          document_type: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          notes: string | null
          project_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          document_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          notes?: string | null
          project_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          notes?: string | null
          project_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
          {
            foreignKeyName: "project_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "project_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "project_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      project_issues: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          impact_cost: number | null
          impact_schedule_days: number | null
          issue_type: Database["public"]["Enums"]["issue_type"] | null
          project_id: string
          resolution: string | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["issue_severity"] | null
          status: Database["public"]["Enums"]["issue_status"] | null
          task_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          impact_cost?: number | null
          impact_schedule_days?: number | null
          issue_type?: Database["public"]["Enums"]["issue_type"] | null
          project_id: string
          resolution?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["issue_severity"] | null
          status?: Database["public"]["Enums"]["issue_status"] | null
          task_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          impact_cost?: number | null
          impact_schedule_days?: number | null
          issue_type?: Database["public"]["Enums"]["issue_type"] | null
          project_id?: string
          resolution?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["issue_severity"] | null
          status?: Database["public"]["Enums"]["issue_status"] | null
          task_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_issues_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_issues_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "project_issues_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "project_issues_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "project_issues_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_issues_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "project_issues_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "project_issues_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "project_issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "project_issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
          {
            foreignKeyName: "project_issues_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          budget_allocation: number | null
          completed_date: string | null
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          name: string
          project_id: string
          sort_order: number | null
          status: Database["public"]["Enums"]["milestone_status"] | null
        }
        Insert: {
          budget_allocation?: number | null
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          name: string
          project_id: string
          sort_order?: number | null
          status?: Database["public"]["Enums"]["milestone_status"] | null
        }
        Update: {
          budget_allocation?: number | null
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          name?: string
          project_id?: string
          sort_order?: number | null
          status?: Database["public"]["Enums"]["milestone_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
        ]
      }
      project_phases: {
        Row: {
          actual_amount: number | null
          budget_amount: number | null
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          is_milestone: boolean | null
          name: string
          percent_complete: number | null
          phase_order: number | null
          project_id: string
          start_date: string
          status: Database["public"]["Enums"]["milestone_status"] | null
          updated_at: string | null
        }
        Insert: {
          actual_amount?: number | null
          budget_amount?: number | null
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          is_milestone?: boolean | null
          name: string
          percent_complete?: number | null
          phase_order?: number | null
          project_id: string
          start_date: string
          status?: Database["public"]["Enums"]["milestone_status"] | null
          updated_at?: string | null
        }
        Update: {
          actual_amount?: number | null
          budget_amount?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          is_milestone?: boolean | null
          name?: string
          percent_complete?: number | null
          phase_order?: number | null
          project_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["milestone_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
        ]
      }
      project_resource_allocation: {
        Row: {
          cost_allocated: number | null
          created_at: string | null
          hours_allocated: number | null
          id: string
          quantity_allocated: number | null
          resource_id: string
          resource_type: Database["public"]["Enums"]["resource_type"]
          task_id: string
        }
        Insert: {
          cost_allocated?: number | null
          created_at?: string | null
          hours_allocated?: number | null
          id?: string
          quantity_allocated?: number | null
          resource_id: string
          resource_type: Database["public"]["Enums"]["resource_type"]
          task_id: string
        }
        Update: {
          cost_allocated?: number | null
          created_at?: string | null
          hours_allocated?: number | null
          id?: string
          quantity_allocated?: number | null
          resource_id?: string
          resource_type?: Database["public"]["Enums"]["resource_type"]
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_resource_allocation_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      project_resource_allocations: {
        Row: {
          actual_cost: number | null
          actual_quantity: number | null
          cost_allocated: number | null
          created_at: string | null
          hours_allocated: number | null
          id: string
          project_id: string
          quantity: number | null
          resource_id: string
          resource_type: Database["public"]["Enums"]["resource_type"]
          task_id: string
          updated_at: string | null
        }
        Insert: {
          actual_cost?: number | null
          actual_quantity?: number | null
          cost_allocated?: number | null
          created_at?: string | null
          hours_allocated?: number | null
          id?: string
          project_id: string
          quantity?: number | null
          resource_id: string
          resource_type: Database["public"]["Enums"]["resource_type"]
          task_id: string
          updated_at?: string | null
        }
        Update: {
          actual_cost?: number | null
          actual_quantity?: number | null
          cost_allocated?: number | null
          created_at?: string | null
          hours_allocated?: number | null
          id?: string
          project_id?: string
          quantity?: number | null
          resource_id?: string
          resource_type?: Database["public"]["Enums"]["resource_type"]
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_resource_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_resource_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_resource_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "project_resource_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_resource_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
          {
            foreignKeyName: "project_resource_allocations_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          created_at: string | null
          dependencies: string[] | null
          description: string | null
          end_date: string
          estimated_hours: number | null
          id: string
          location: string | null
          name: string
          notes: string | null
          percent_complete: number | null
          phase_id: string | null
          priority: Database["public"]["Enums"]["ticket_priority"] | null
          project_id: string
          start_date: string
          status: Database["public"]["Enums"]["task_status"] | null
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          end_date: string
          estimated_hours?: number | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          percent_complete?: number | null
          phase_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          project_id: string
          start_date: string
          status?: Database["public"]["Enums"]["task_status"] | null
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          end_date?: string
          estimated_hours?: number | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          percent_complete?: number | null
          phase_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          project_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["task_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "project_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "project_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "project_tasks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
        ]
      }
      project_team_members: {
        Row: {
          assigned_date: string | null
          created_at: string | null
          id: string
          project_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          assigned_date?: string | null
          created_at?: string | null
          id?: string
          project_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          assigned_date?: string | null
          created_at?: string | null
          id?: string
          project_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_team_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_team_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_team_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "project_team_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_team_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
          {
            foreignKeyName: "project_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "project_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "project_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      project_template_phases: {
        Row: {
          budget_percent: number | null
          description: string | null
          duration_days: number | null
          id: string
          is_milestone: boolean | null
          name: string
          phase_order: number | null
          template_id: string
        }
        Insert: {
          budget_percent?: number | null
          description?: string | null
          duration_days?: number | null
          id?: string
          is_milestone?: boolean | null
          name: string
          phase_order?: number | null
          template_id: string
        }
        Update: {
          budget_percent?: number | null
          description?: string | null
          duration_days?: number | null
          id?: string
          is_milestone?: boolean | null
          name?: string
          phase_order?: number | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_template_phases_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "project_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      project_template_tasks: {
        Row: {
          description: string | null
          estimated_hours: number | null
          id: string
          name: string
          task_order: number | null
          template_phase_id: string
        }
        Insert: {
          description?: string | null
          estimated_hours?: number | null
          id?: string
          name: string
          task_order?: number | null
          template_phase_id: string
        }
        Update: {
          description?: string | null
          estimated_hours?: number | null
          id?: string
          name?: string
          task_order?: number | null
          template_phase_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_template_tasks_template_phase_id_fkey"
            columns: ["template_phase_id"]
            isOneToOne: false
            referencedRelation: "project_template_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      project_templates: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string
          default_budget: number | null
          default_duration_days: number | null
          description: string | null
          id: string
          is_active: boolean | null
          template_name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by: string
          default_budget?: number | null
          default_duration_days?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          template_name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string
          default_budget?: number | null
          default_duration_days?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          template_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "project_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "project_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_cost: number | null
          actual_hours: number | null
          budget: number | null
          budget_equipment: number | null
          budget_labor: number | null
          budget_overhead: number | null
          budget_parts: number | null
          budget_travel: number | null
          contract_value_site: number | null
          contract_value_total: number | null
          created_at: string | null
          created_by: string
          customer_id: string
          description: string | null
          end_date: string | null
          estimated_hours: number | null
          id: string
          is_master_project: boolean | null
          location: string | null
          manager_id: string | null
          name: string
          parent_project_id: string | null
          priority: Database["public"]["Enums"]["ticket_priority"] | null
          profit_margin: number | null
          project_number: string
          project_type: string | null
          sequence_number: number | null
          site_address: string | null
          site_name: string | null
          source_estimate_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["project_status"] | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          actual_cost?: number | null
          actual_hours?: number | null
          budget?: number | null
          budget_equipment?: number | null
          budget_labor?: number | null
          budget_overhead?: number | null
          budget_parts?: number | null
          budget_travel?: number | null
          contract_value_site?: number | null
          contract_value_total?: number | null
          created_at?: string | null
          created_by: string
          customer_id: string
          description?: string | null
          end_date?: string | null
          estimated_hours?: number | null
          id?: string
          is_master_project?: boolean | null
          location?: string | null
          manager_id?: string | null
          name: string
          parent_project_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          profit_margin?: number | null
          project_number: string
          project_type?: string | null
          sequence_number?: number | null
          site_address?: string | null
          site_name?: string | null
          source_estimate_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["project_status"] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          actual_cost?: number | null
          actual_hours?: number | null
          budget?: number | null
          budget_equipment?: number | null
          budget_labor?: number | null
          budget_overhead?: number | null
          budget_parts?: number | null
          budget_travel?: number | null
          contract_value_site?: number | null
          contract_value_total?: number | null
          created_at?: string | null
          created_by?: string
          customer_id?: string
          description?: string | null
          end_date?: string | null
          estimated_hours?: number | null
          id?: string
          is_master_project?: boolean | null
          location?: string | null
          manager_id?: string | null
          name?: string
          parent_project_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          profit_margin?: number | null
          project_number?: string
          project_type?: string | null
          sequence_number?: number | null
          site_address?: string | null
          site_name?: string | null
          source_estimate_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["project_status"] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "projects_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "projects_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "projects_parent_project_id_fkey"
            columns: ["parent_project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "projects_parent_project_id_fkey"
            columns: ["parent_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_parent_project_id_fkey"
            columns: ["parent_project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "projects_parent_project_id_fkey"
            columns: ["parent_project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "projects_parent_project_id_fkey"
            columns: ["parent_project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
          {
            foreignKeyName: "projects_source_estimate_id_fkey"
            columns: ["source_estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_source_estimate_id_fkey"
            columns: ["source_estimate_id"]
            isOneToOne: false
            referencedRelation: "vw_estimate_margin"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "projects_source_estimate_id_fkey"
            columns: ["source_estimate_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "projects_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "projects_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "projects_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      purchase_order_lines: {
        Row: {
          created_at: string | null
          description: string
          expected_date: string | null
          id: string
          line_number: number
          line_total: number
          linked_request_id: string | null
          linked_ticket_id: string | null
          notes: string | null
          part_id: string
          po_id: string
          quantity_damaged: number | null
          quantity_ordered: number
          quantity_received: number | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          expected_date?: string | null
          id?: string
          line_number: number
          line_total: number
          linked_request_id?: string | null
          linked_ticket_id?: string | null
          notes?: string | null
          part_id: string
          po_id: string
          quantity_damaged?: number | null
          quantity_ordered: number
          quantity_received?: number | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          expected_date?: string | null
          id?: string
          line_number?: number
          line_total?: number
          linked_request_id?: string | null
          linked_ticket_id?: string | null
          notes?: string | null
          part_id?: string
          po_id?: string
          quantity_damaged?: number | null
          quantity_ordered?: number
          quantity_received?: number | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_lines_linked_request_id_fkey"
            columns: ["linked_request_id"]
            isOneToOne: false
            referencedRelation: "ticket_parts_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_lines_linked_request_id_fkey"
            columns: ["linked_request_id"]
            isOneToOne: false
            referencedRelation: "vw_parts_request_queue"
            referencedColumns: ["request_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_linked_request_id_fkey"
            columns: ["linked_request_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["parts_request_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_linked_ticket_id_fkey"
            columns: ["linked_ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_linked_ticket_id_fkey"
            columns: ["linked_ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_linked_ticket_id_fkey"
            columns: ["linked_ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_linked_ticket_id_fkey"
            columns: ["linked_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_lines_linked_ticket_id_fkey"
            columns: ["linked_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_lines_linked_ticket_id_fkey"
            columns: ["linked_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_linked_ticket_id_fkey"
            columns: ["linked_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_linked_ticket_id_fkey"
            columns: ["linked_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_linked_ticket_id_fkey"
            columns: ["linked_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_lines_linked_ticket_id_fkey"
            columns: ["linked_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_linked_ticket_id_fkey"
            columns: ["linked_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_linked_ticket_id_fkey"
            columns: ["linked_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_linked_ticket_id_fkey"
            columns: ["linked_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_lines_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_lines_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_lines_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_receipts: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          packing_slip_number: string | null
          po_id: string
          po_line_id: string
          quantity_received: number
          receipt_date: string | null
          received_at_location_id: string | null
          received_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          packing_slip_number?: string | null
          po_id: string
          po_line_id: string
          quantity_received: number
          receipt_date?: string | null
          received_at_location_id?: string | null
          received_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          packing_slip_number?: string | null
          po_id?: string
          po_line_id?: string
          quantity_received?: number
          receipt_date?: string | null
          received_at_location_id?: string | null
          received_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_receipts_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_receipts_po_line_id_fkey"
            columns: ["po_line_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_receipts_received_at_location_id_fkey"
            columns: ["received_at_location_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "purchase_order_receipts_received_at_location_id_fkey"
            columns: ["received_at_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_receipts_received_at_location_id_fkey"
            columns: ["received_at_location_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inventory_with_serials"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "purchase_order_receipts_received_at_location_id_fkey"
            columns: ["received_at_location_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "purchase_order_receipts_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_receipts_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "purchase_order_receipts_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "purchase_order_receipts_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          delivery_location_id: string | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string | null
          po_number: string
          po_source: string | null
          project_id: string | null
          shipping_amount: number | null
          status: Database["public"]["Enums"]["purchase_order_status"] | null
          subtotal: number | null
          tax_amount: number | null
          terms: string | null
          ticket_id: string | null
          total_amount: number | null
          updated_at: string | null
          updated_by: string | null
          vendor_contract_id: string | null
          vendor_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          delivery_location_id?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          po_number: string
          po_source?: string | null
          project_id?: string | null
          shipping_amount?: number | null
          status?: Database["public"]["Enums"]["purchase_order_status"] | null
          subtotal?: number | null
          tax_amount?: number | null
          terms?: string | null
          ticket_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
          updated_by?: string | null
          vendor_contract_id?: string | null
          vendor_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          delivery_location_id?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          po_number?: string
          po_source?: string | null
          project_id?: string | null
          shipping_amount?: number | null
          status?: Database["public"]["Enums"]["purchase_order_status"] | null
          subtotal?: number | null
          tax_amount?: number | null
          terms?: string | null
          ticket_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
          updated_by?: string | null
          vendor_contract_id?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "purchase_orders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "purchase_orders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "purchase_orders_delivery_location_id_fkey"
            columns: ["delivery_location_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "purchase_orders_delivery_location_id_fkey"
            columns: ["delivery_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_delivery_location_id_fkey"
            columns: ["delivery_location_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inventory_with_serials"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "purchase_orders_delivery_location_id_fkey"
            columns: ["delivery_location_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
          {
            foreignKeyName: "purchase_orders_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "purchase_orders_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "purchase_orders_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "purchase_orders_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "purchase_orders_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "purchase_orders_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "purchase_orders_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "purchase_orders_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "purchase_orders_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "purchase_orders_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "purchase_orders_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "purchase_orders_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "purchase_orders_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "purchase_orders_vendor_contract_id_fkey"
            columns: ["vendor_contract_id"]
            isOneToOne: false
            referencedRelation: "v_vendor_contracts_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_vendor_contract_id_fkey"
            columns: ["vendor_contract_id"]
            isOneToOne: false
            referencedRelation: "vendor_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_1099_report"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_aging"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_vendor_lead_time_metrics"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      receipt_serial_numbers: {
        Row: {
          created_at: string | null
          id: string
          manufacture_date: string | null
          notes: string | null
          receipt_id: string
          serial_number: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          manufacture_date?: string | null
          notes?: string | null
          receipt_id: string
          serial_number: string
        }
        Update: {
          created_at?: string | null
          id?: string
          manufacture_date?: string | null
          notes?: string | null
          receipt_id?: string
          serial_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_serial_numbers_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_adjustments: {
        Row: {
          adjustment_type: Database["public"]["Enums"]["reconciliation_adjustment_type"]
          amount: number
          created_at: string | null
          created_by: string
          credit_account_id: string | null
          debit_account_id: string | null
          description: string
          gl_entry_id: string | null
          id: string
          reconciliation_id: string
        }
        Insert: {
          adjustment_type: Database["public"]["Enums"]["reconciliation_adjustment_type"]
          amount: number
          created_at?: string | null
          created_by: string
          credit_account_id?: string | null
          debit_account_id?: string | null
          description: string
          gl_entry_id?: string | null
          id?: string
          reconciliation_id: string
        }
        Update: {
          adjustment_type?: Database["public"]["Enums"]["reconciliation_adjustment_type"]
          amount?: number
          created_at?: string | null
          created_by?: string
          credit_account_id?: string | null
          debit_account_id?: string | null
          description?: string
          gl_entry_id?: string | null
          id?: string
          reconciliation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_adjustments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_adjustments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "reconciliation_adjustments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "reconciliation_adjustments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "reconciliation_adjustments_credit_account_id_fkey"
            columns: ["credit_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_adjustments_credit_account_id_fkey"
            columns: ["credit_account_id"]
            isOneToOne: false
            referencedRelation: "gl_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_adjustments_credit_account_id_fkey"
            columns: ["credit_account_id"]
            isOneToOne: false
            referencedRelation: "vw_trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "reconciliation_adjustments_debit_account_id_fkey"
            columns: ["debit_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_adjustments_debit_account_id_fkey"
            columns: ["debit_account_id"]
            isOneToOne: false
            referencedRelation: "gl_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_adjustments_debit_account_id_fkey"
            columns: ["debit_account_id"]
            isOneToOne: false
            referencedRelation: "vw_trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "reconciliation_adjustments_gl_entry_id_fkey"
            columns: ["gl_entry_id"]
            isOneToOne: false
            referencedRelation: "gl_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_adjustments_gl_entry_id_fkey"
            columns: ["gl_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entry_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_adjustments_reconciliation_id_fkey"
            columns: ["reconciliation_id"]
            isOneToOne: false
            referencedRelation: "bank_reconciliations"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permissions: string[] | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          permissions?: string[] | null
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          permissions?: string[] | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      serialized_parts: {
        Row: {
          created_at: string | null
          current_location_id: string | null
          id: string
          installation_date: string | null
          installed_at_site_id: string | null
          installed_by: string | null
          installed_on_equipment_id: string | null
          installed_on_ticket_id: string | null
          manufacture_date: string | null
          notes: string | null
          part_id: string
          po_id: string | null
          po_line_id: string | null
          purchase_date: string | null
          received_date: string | null
          serial_number: string
          status: Database["public"]["Enums"]["serialized_part_status"] | null
          unit_cost: number | null
          updated_at: string | null
          vendor_id: string | null
          warranty_end_date: string | null
          warranty_notes: string | null
          warranty_provider: string | null
          warranty_start_date: string | null
          warranty_term_months_snapshot: number | null
        }
        Insert: {
          created_at?: string | null
          current_location_id?: string | null
          id?: string
          installation_date?: string | null
          installed_at_site_id?: string | null
          installed_by?: string | null
          installed_on_equipment_id?: string | null
          installed_on_ticket_id?: string | null
          manufacture_date?: string | null
          notes?: string | null
          part_id: string
          po_id?: string | null
          po_line_id?: string | null
          purchase_date?: string | null
          received_date?: string | null
          serial_number: string
          status?: Database["public"]["Enums"]["serialized_part_status"] | null
          unit_cost?: number | null
          updated_at?: string | null
          vendor_id?: string | null
          warranty_end_date?: string | null
          warranty_notes?: string | null
          warranty_provider?: string | null
          warranty_start_date?: string | null
          warranty_term_months_snapshot?: number | null
        }
        Update: {
          created_at?: string | null
          current_location_id?: string | null
          id?: string
          installation_date?: string | null
          installed_at_site_id?: string | null
          installed_by?: string | null
          installed_on_equipment_id?: string | null
          installed_on_ticket_id?: string | null
          manufacture_date?: string | null
          notes?: string | null
          part_id?: string
          po_id?: string | null
          po_line_id?: string | null
          purchase_date?: string | null
          received_date?: string | null
          serial_number?: string
          status?: Database["public"]["Enums"]["serialized_part_status"] | null
          unit_cost?: number | null
          updated_at?: string | null
          vendor_id?: string | null
          warranty_end_date?: string | null
          warranty_notes?: string | null
          warranty_provider?: string | null
          warranty_start_date?: string | null
          warranty_term_months_snapshot?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "serialized_parts_current_location_id_fkey"
            columns: ["current_location_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "serialized_parts_current_location_id_fkey"
            columns: ["current_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_current_location_id_fkey"
            columns: ["current_location_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inventory_with_serials"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "serialized_parts_current_location_id_fkey"
            columns: ["current_location_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_equipment_id_fkey"
            columns: ["installed_on_equipment_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_equipment_id_fkey"
            columns: ["installed_on_equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_equipment_id_fkey"
            columns: ["installed_on_equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_equipment_id_fkey"
            columns: ["installed_on_equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_with_installed_parts"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_equipment_id_fkey"
            columns: ["installed_on_equipment_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_po_line_id_fkey"
            columns: ["po_line_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_1099_report"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "serialized_parts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_aging"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "serialized_parts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_vendor_lead_time_metrics"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      service_contract_coverage: {
        Row: {
          coverage_type: Database["public"]["Enums"]["coverage_type"] | null
          created_at: string | null
          equipment_group: string | null
          equipment_id: string | null
          id: string
          labor_coverage_level:
            | Database["public"]["Enums"]["labor_coverage_level"]
            | null
          max_visits_per_year_for_item: number | null
          parts_coverage_level:
            | Database["public"]["Enums"]["parts_coverage_level"]
            | null
          service_contract_id: string
          system_tag: string | null
          updated_at: string | null
        }
        Insert: {
          coverage_type?: Database["public"]["Enums"]["coverage_type"] | null
          created_at?: string | null
          equipment_group?: string | null
          equipment_id?: string | null
          id?: string
          labor_coverage_level?:
            | Database["public"]["Enums"]["labor_coverage_level"]
            | null
          max_visits_per_year_for_item?: number | null
          parts_coverage_level?:
            | Database["public"]["Enums"]["parts_coverage_level"]
            | null
          service_contract_id: string
          system_tag?: string | null
          updated_at?: string | null
        }
        Update: {
          coverage_type?: Database["public"]["Enums"]["coverage_type"] | null
          created_at?: string | null
          equipment_group?: string | null
          equipment_id?: string | null
          id?: string
          labor_coverage_level?:
            | Database["public"]["Enums"]["labor_coverage_level"]
            | null
          max_visits_per_year_for_item?: number | null
          parts_coverage_level?:
            | Database["public"]["Enums"]["parts_coverage_level"]
            | null
          service_contract_id?: string
          system_tag?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_contract_coverage_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "service_contract_coverage_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_contract_coverage_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "service_contract_coverage_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_with_installed_parts"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "service_contract_coverage_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "service_contract_coverage_service_contract_id_fkey"
            columns: ["service_contract_id"]
            isOneToOne: false
            referencedRelation: "service_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      service_contracts: {
        Row: {
          auto_renew: boolean | null
          base_fee: number | null
          billing_frequency:
            | Database["public"]["Enums"]["contract_billing_frequency"]
            | null
          contract_plan_id: string
          created_at: string | null
          created_by: string | null
          customer_id: string
          customer_location_id: string | null
          end_date: string | null
          id: string
          included_visits_per_year: number | null
          includes_after_hours_rate_reduction: boolean | null
          includes_emergency_service: boolean | null
          labor_discount_percent: number | null
          labor_fixed_rate: number | null
          labor_rate_type: Database["public"]["Enums"]["labor_rate_type"] | null
          last_billed_date: string | null
          last_renewed_at: string | null
          name: string
          next_billing_date: string | null
          notes: string | null
          parts_discount_percent: number | null
          priority_level: Database["public"]["Enums"]["priority_level"] | null
          response_time_sla_hours: number | null
          start_date: string
          status: Database["public"]["Enums"]["service_contract_status"] | null
          trip_charge_discount_percent: number | null
          updated_at: string | null
          updated_by: string | null
          visits_used_current_term: number | null
          waive_trip_charge: boolean | null
        }
        Insert: {
          auto_renew?: boolean | null
          base_fee?: number | null
          billing_frequency?:
            | Database["public"]["Enums"]["contract_billing_frequency"]
            | null
          contract_plan_id: string
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          customer_location_id?: string | null
          end_date?: string | null
          id?: string
          included_visits_per_year?: number | null
          includes_after_hours_rate_reduction?: boolean | null
          includes_emergency_service?: boolean | null
          labor_discount_percent?: number | null
          labor_fixed_rate?: number | null
          labor_rate_type?:
            | Database["public"]["Enums"]["labor_rate_type"]
            | null
          last_billed_date?: string | null
          last_renewed_at?: string | null
          name: string
          next_billing_date?: string | null
          notes?: string | null
          parts_discount_percent?: number | null
          priority_level?: Database["public"]["Enums"]["priority_level"] | null
          response_time_sla_hours?: number | null
          start_date: string
          status?: Database["public"]["Enums"]["service_contract_status"] | null
          trip_charge_discount_percent?: number | null
          updated_at?: string | null
          updated_by?: string | null
          visits_used_current_term?: number | null
          waive_trip_charge?: boolean | null
        }
        Update: {
          auto_renew?: boolean | null
          base_fee?: number | null
          billing_frequency?:
            | Database["public"]["Enums"]["contract_billing_frequency"]
            | null
          contract_plan_id?: string
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          customer_location_id?: string | null
          end_date?: string | null
          id?: string
          included_visits_per_year?: number | null
          includes_after_hours_rate_reduction?: boolean | null
          includes_emergency_service?: boolean | null
          labor_discount_percent?: number | null
          labor_fixed_rate?: number | null
          labor_rate_type?:
            | Database["public"]["Enums"]["labor_rate_type"]
            | null
          last_billed_date?: string | null
          last_renewed_at?: string | null
          name?: string
          next_billing_date?: string | null
          notes?: string | null
          parts_discount_percent?: number | null
          priority_level?: Database["public"]["Enums"]["priority_level"] | null
          response_time_sla_hours?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["service_contract_status"] | null
          trip_charge_discount_percent?: number | null
          updated_at?: string | null
          updated_by?: string | null
          visits_used_current_term?: number | null
          waive_trip_charge?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "service_contracts_contract_plan_id_fkey"
            columns: ["contract_plan_id"]
            isOneToOne: false
            referencedRelation: "contract_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "service_contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "service_contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "service_contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "service_contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "service_contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "service_contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "service_contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "service_contracts_customer_location_id_fkey"
            columns: ["customer_location_id"]
            isOneToOne: false
            referencedRelation: "customer_location_summary"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "service_contracts_customer_location_id_fkey"
            columns: ["customer_location_id"]
            isOneToOne: false
            referencedRelation: "customer_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_contracts_customer_location_id_fkey"
            columns: ["customer_location_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "service_contracts_customer_location_id_fkey"
            columns: ["customer_location_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "service_contracts_customer_location_id_fkey"
            columns: ["customer_location_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "service_contracts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_contracts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "service_contracts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "service_contracts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      spc_points: {
        Row: {
          created_at: string | null
          id: string
          measured_value: number
          measurement_id: string | null
          sequence: number | null
          subgroup_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          measured_value: number
          measurement_id?: string | null
          sequence?: number | null
          subgroup_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          measured_value?: number
          measurement_id?: string | null
          sequence?: number | null
          subgroup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spc_points_subgroup_id_fkey"
            columns: ["subgroup_id"]
            isOneToOne: false
            referencedRelation: "spc_subgroups"
            referencedColumns: ["id"]
          },
        ]
      }
      spc_rule_violations: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          acknowledgment_notes: string | null
          characteristic_id: string
          created_at: string | null
          details: Json | null
          detected_at: string
          id: string
          subgroup_id: string | null
          violation_type: Database["public"]["Enums"]["spc_violation_type"]
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          acknowledgment_notes?: string | null
          characteristic_id: string
          created_at?: string | null
          details?: Json | null
          detected_at?: string
          id?: string
          subgroup_id?: string | null
          violation_type: Database["public"]["Enums"]["spc_violation_type"]
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          acknowledgment_notes?: string | null
          characteristic_id?: string
          created_at?: string | null
          details?: Json | null
          detected_at?: string
          id?: string
          subgroup_id?: string | null
          violation_type?: Database["public"]["Enums"]["spc_violation_type"]
        }
        Relationships: [
          {
            foreignKeyName: "spc_rule_violations_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spc_rule_violations_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "spc_rule_violations_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "spc_rule_violations_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "spc_rule_violations_subgroup_id_fkey"
            columns: ["subgroup_id"]
            isOneToOne: false
            referencedRelation: "spc_subgroups"
            referencedColumns: ["id"]
          },
        ]
      }
      spc_subgroups: {
        Row: {
          characteristic_id: string
          created_at: string | null
          equipment_asset_id: string | null
          id: string
          max_value: number | null
          mean: number | null
          min_value: number | null
          n: number
          operation_id: string | null
          product_id: string | null
          range_value: number | null
          stddev: number | null
          subgroup_ts: string
          updated_at: string | null
          work_center_id: string | null
        }
        Insert: {
          characteristic_id: string
          created_at?: string | null
          equipment_asset_id?: string | null
          id?: string
          max_value?: number | null
          mean?: number | null
          min_value?: number | null
          n?: number
          operation_id?: string | null
          product_id?: string | null
          range_value?: number | null
          stddev?: number | null
          subgroup_ts?: string
          updated_at?: string | null
          work_center_id?: string | null
        }
        Update: {
          characteristic_id?: string
          created_at?: string | null
          equipment_asset_id?: string | null
          id?: string
          max_value?: number | null
          mean?: number | null
          min_value?: number | null
          n?: number
          operation_id?: string | null
          product_id?: string | null
          range_value?: number | null
          stddev?: number | null
          subgroup_ts?: string
          updated_at?: string | null
          work_center_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spc_subgroups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "spc_subgroups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "spc_subgroups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spc_subgroups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "spc_subgroups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spc_subgroups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "spc_subgroups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      standard_codes: {
        Row: {
          category: string | null
          code: string
          code_type: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_critical_safety: boolean | null
          label: string
          severity: number | null
          sort_order: number | null
          triggers_sales_lead: boolean | null
          triggers_urgent_review: boolean | null
        }
        Insert: {
          category?: string | null
          code: string
          code_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_critical_safety?: boolean | null
          label: string
          severity?: number | null
          sort_order?: number | null
          triggers_sales_lead?: boolean | null
          triggers_urgent_review?: boolean | null
        }
        Update: {
          category?: string | null
          code?: string
          code_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_critical_safety?: boolean | null
          label?: string
          severity?: number | null
          sort_order?: number | null
          triggers_sales_lead?: boolean | null
          triggers_urgent_review?: boolean | null
        }
        Relationships: []
      }
      stock_locations: {
        Row: {
          address: string | null
          assigned_to_user_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_mobile: boolean | null
          location_code: string
          location_type: Database["public"]["Enums"]["stock_location_type"]
          name: string
          notes: string | null
          parent_location_id: string | null
          technician_id: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          address?: string | null
          assigned_to_user_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_mobile?: boolean | null
          location_code: string
          location_type: Database["public"]["Enums"]["stock_location_type"]
          name: string
          notes?: string | null
          parent_location_id?: string | null
          technician_id?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          address?: string | null
          assigned_to_user_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_mobile?: boolean | null
          location_code?: string
          location_type?: Database["public"]["Enums"]["stock_location_type"]
          name?: string
          notes?: string | null
          parent_location_id?: string | null
          technician_id?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_locations_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_locations_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "stock_locations_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "stock_locations_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "stock_locations_parent_location_id_fkey"
            columns: ["parent_location_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "stock_locations_parent_location_id_fkey"
            columns: ["parent_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_locations_parent_location_id_fkey"
            columns: ["parent_location_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inventory_with_serials"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "stock_locations_parent_location_id_fkey"
            columns: ["parent_location_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "stock_locations_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_locations_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "stock_locations_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "stock_locations_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      tax_jurisdictions: {
        Row: {
          agency_name: string | null
          code: string | null
          created_at: string | null
          effective_date: string | null
          id: string
          is_active: boolean | null
          level: string | null
          name: string
          state_code: string | null
          tax_rate: number
        }
        Insert: {
          agency_name?: string | null
          code?: string | null
          created_at?: string | null
          effective_date?: string | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          name: string
          state_code?: string | null
          tax_rate: number
        }
        Update: {
          agency_name?: string | null
          code?: string | null
          created_at?: string | null
          effective_date?: string | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          name?: string
          state_code?: string | null
          tax_rate?: number
        }
        Relationships: []
      }
      tax_ledger: {
        Row: {
          created_at: string | null
          id: string
          is_remitted: boolean | null
          jurisdiction_id: string | null
          remitted_at: string | null
          tax_amount: number
          taxable_amount: number
          transaction_date: string
          transaction_source_id: string
          transaction_source_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_remitted?: boolean | null
          jurisdiction_id?: string | null
          remitted_at?: string | null
          tax_amount: number
          taxable_amount: number
          transaction_date: string
          transaction_source_id: string
          transaction_source_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_remitted?: boolean | null
          jurisdiction_id?: string | null
          remitted_at?: string | null
          tax_amount?: number
          taxable_amount?: number
          transaction_date?: string
          transaction_source_id?: string
          transaction_source_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_ledger_jurisdiction_id_fkey"
            columns: ["jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "tax_jurisdictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_ledger_jurisdiction_id_fkey"
            columns: ["jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_tax_liability"
            referencedColumns: ["jurisdiction_id"]
          },
        ]
      }
      technician_locations: {
        Row: {
          accuracy: number | null
          id: string
          latitude: number
          longitude: number
          technician_id: string
          timestamp: string | null
        }
        Insert: {
          accuracy?: number | null
          id?: string
          latitude: number
          longitude: number
          technician_id: string
          timestamp?: string | null
        }
        Update: {
          accuracy?: number | null
          id?: string
          latitude?: number
          longitude?: number
          technician_id?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technician_locations_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_locations_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "technician_locations_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "technician_locations_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      ticket_assignments: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          technician_id: string
          ticket_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          technician_id: string
          ticket_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          technician_id?: string
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ticket_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "ticket_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "ticket_assignments_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_assignments_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ticket_assignments_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "ticket_assignments_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "ticket_assignments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_assignments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "ticket_assignments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_assignments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_assignments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_assignments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "ticket_assignments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "ticket_assignments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_assignments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_assignments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_assignments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_assignments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_assignments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      ticket_charges_planned: {
        Row: {
          charge_type: string
          created_at: string | null
          description: string
          id: string
          line_total: number | null
          notes: string | null
          quantity: number
          source_line_id: string | null
          ticket_id: string
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          charge_type?: string
          created_at?: string | null
          description: string
          id?: string
          line_total?: number | null
          notes?: string | null
          quantity?: number
          source_line_id?: string | null
          ticket_id: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          charge_type?: string
          created_at?: string | null
          description?: string
          id?: string
          line_total?: number | null
          notes?: string | null
          quantity?: number
          source_line_id?: string | null
          ticket_id?: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_charges_planned_source_line_id_fkey"
            columns: ["source_line_id"]
            isOneToOne: false
            referencedRelation: "estimate_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_charges_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_charges_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "ticket_charges_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_charges_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_charges_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_charges_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "ticket_charges_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "ticket_charges_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_charges_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_charges_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_charges_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_charges_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_charges_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      ticket_fees: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          description: string | null
          fee_type: string
          id: string
          payer_type: Database["public"]["Enums"]["payer_type"] | null
          ticket_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fee_type: string
          id?: string
          payer_type?: Database["public"]["Enums"]["payer_type"] | null
          ticket_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fee_type?: string
          id?: string
          payer_type?: Database["public"]["Enums"]["payer_type"] | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_fees_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_fees_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ticket_fees_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "ticket_fees_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "ticket_fees_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_fees_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "ticket_fees_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_fees_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_fees_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_fees_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "ticket_fees_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "ticket_fees_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_fees_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_fees_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_fees_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_fees_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_fees_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      ticket_holds: {
        Row: {
          created_at: string | null
          created_by: string | null
          hold_type: string
          id: string
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          summary: string | null
          ticket_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          hold_type: string
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          summary?: string | null
          ticket_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          hold_type?: string
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          summary?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_holds_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_holds_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "ticket_holds_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_holds_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_holds_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_holds_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "ticket_holds_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "ticket_holds_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_holds_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_holds_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_holds_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_holds_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_holds_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      ticket_invoice_links: {
        Row: {
          amount_contributed: number
          created_at: string | null
          id: string
          invoice_id: string
          ticket_id: string
        }
        Insert: {
          amount_contributed?: number
          created_at?: string | null
          id?: string
          invoice_id: string
          ticket_id: string
        }
        Update: {
          amount_contributed?: number
          created_at?: string | null
          id?: string
          invoice_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_invoice_links_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "ticket_invoice_links_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_traceability_report"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "ticket_invoice_links_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_invoice_links_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_invoice_links_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "ticket_invoice_links_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_invoice_links_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_invoice_links_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_invoice_links_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "ticket_invoice_links_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "ticket_invoice_links_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_invoice_links_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_invoice_links_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_invoice_links_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_invoice_links_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_invoice_links_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      ticket_issue_reports: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string
          hold_id: string | null
          id: string
          metadata: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          ticket_id: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description: string
          hold_id?: string | null
          id?: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          ticket_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          hold_id?: string | null
          id?: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_issue_reports_hold_id_fkey"
            columns: ["hold_id"]
            isOneToOne: false
            referencedRelation: "ticket_holds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_issue_reports_hold_id_fkey"
            columns: ["hold_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["hold_id"]
          },
          {
            foreignKeyName: "ticket_issue_reports_hold_id_fkey"
            columns: ["hold_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["hold_id"]
          },
          {
            foreignKeyName: "ticket_issue_reports_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_issue_reports_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "ticket_issue_reports_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_issue_reports_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_issue_reports_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_issue_reports_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "ticket_issue_reports_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "ticket_issue_reports_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_issue_reports_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_issue_reports_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_issue_reports_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_issue_reports_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_issue_reports_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      ticket_labor_planned: {
        Row: {
          created_at: string | null
          description: string
          id: string
          labor_hours: number
          labor_rate: number | null
          line_total: number | null
          notes: string | null
          source_line_id: string | null
          ticket_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          labor_hours?: number
          labor_rate?: number | null
          line_total?: number | null
          notes?: string | null
          source_line_id?: string | null
          ticket_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          labor_hours?: number
          labor_rate?: number | null
          line_total?: number | null
          notes?: string | null
          source_line_id?: string | null
          ticket_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_labor_planned_source_line_id_fkey"
            columns: ["source_line_id"]
            isOneToOne: false
            referencedRelation: "estimate_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_labor_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_labor_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "ticket_labor_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_labor_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_labor_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_labor_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "ticket_labor_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "ticket_labor_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_labor_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_labor_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_labor_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_labor_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_labor_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      ticket_notes: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          id: string
          note_type: Database["public"]["Enums"]["note_type"] | null
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          note_type?: Database["public"]["Enums"]["note_type"] | null
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          note_type?: Database["public"]["Enums"]["note_type"] | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ticket_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "ticket_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "ticket_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "ticket_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "ticket_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "ticket_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      ticket_parts_planned: {
        Row: {
          created_at: string | null
          description: string
          id: string
          line_total: number | null
          notes: string | null
          part_id: string | null
          quantity: number
          source_line_id: string | null
          ticket_id: string
          unit_cost: number | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          line_total?: number | null
          notes?: string | null
          part_id?: string | null
          quantity?: number
          source_line_id?: string | null
          ticket_id: string
          unit_cost?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          line_total?: number | null
          notes?: string | null
          part_id?: string | null
          quantity?: number
          source_line_id?: string | null
          ticket_id?: string
          unit_cost?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_parts_planned_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "ticket_parts_planned_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "ticket_parts_planned_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_planned_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "ticket_parts_planned_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_planned_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "ticket_parts_planned_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_planned_source_line_id_fkey"
            columns: ["source_line_id"]
            isOneToOne: false
            referencedRelation: "estimate_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_planned_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      ticket_parts_request_lines: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          part_id: string
          preferred_source_location_id: string | null
          quantity_fulfilled: number | null
          quantity_requested: number
          request_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          part_id: string
          preferred_source_location_id?: string | null
          quantity_fulfilled?: number | null
          quantity_requested: number
          request_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          part_id?: string
          preferred_source_location_id?: string | null
          quantity_fulfilled?: number | null
          quantity_requested?: number
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_parts_request_lines_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "ticket_parts_request_lines_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "ticket_parts_request_lines_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_request_lines_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "ticket_parts_request_lines_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_request_lines_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "ticket_parts_request_lines_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_request_lines_preferred_source_location_id_fkey"
            columns: ["preferred_source_location_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "ticket_parts_request_lines_preferred_source_location_id_fkey"
            columns: ["preferred_source_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_request_lines_preferred_source_location_id_fkey"
            columns: ["preferred_source_location_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inventory_with_serials"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "ticket_parts_request_lines_preferred_source_location_id_fkey"
            columns: ["preferred_source_location_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "ticket_parts_request_lines_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "ticket_parts_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_request_lines_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "vw_parts_request_queue"
            referencedColumns: ["request_id"]
          },
          {
            foreignKeyName: "ticket_parts_request_lines_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["parts_request_id"]
          },
        ]
      }
      ticket_parts_requests: {
        Row: {
          created_at: string | null
          created_by: string | null
          fulfilled_at: string | null
          fulfilled_by: string | null
          hold_id: string | null
          id: string
          notes: string | null
          po_id: string | null
          status: string
          ticket_id: string
          urgency: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          hold_id?: string | null
          id?: string
          notes?: string | null
          po_id?: string | null
          status?: string
          ticket_id: string
          urgency?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          hold_id?: string | null
          id?: string
          notes?: string | null
          po_id?: string | null
          status?: string
          ticket_id?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_parts_requests_hold_id_fkey"
            columns: ["hold_id"]
            isOneToOne: false
            referencedRelation: "ticket_holds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_hold_id_fkey"
            columns: ["hold_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["hold_id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_hold_id_fkey"
            columns: ["hold_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["hold_id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      ticket_parts_used: {
        Row: {
          created_at: string | null
          id: string
          installed_by: string | null
          notes: string | null
          part_id: string
          quantity: number
          ticket_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          installed_by?: string | null
          notes?: string | null
          part_id: string
          quantity?: number
          ticket_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          installed_by?: string | null
          notes?: string | null
          part_id?: string
          quantity?: number
          ticket_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_parts_used_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_used_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_used_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_used_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      ticket_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          photo_type: string | null
          photo_url: string
          ticket_id: string
          uploaded_by: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          photo_type?: string | null
          photo_url: string
          ticket_id: string
          uploaded_by: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          photo_type?: string | null
          photo_url?: string
          ticket_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_photos_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_photos_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "ticket_photos_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_photos_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_photos_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_photos_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "ticket_photos_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "ticket_photos_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_photos_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_photos_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_photos_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_photos_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_photos_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ticket_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "ticket_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      ticket_pick_list_items: {
        Row: {
          id: string
          notes: string | null
          part_id: string
          pick_list_id: string
          picked_up: boolean | null
          picked_up_at: string | null
          quantity: number
          source_location_id: string
        }
        Insert: {
          id?: string
          notes?: string | null
          part_id: string
          pick_list_id: string
          picked_up?: boolean | null
          picked_up_at?: string | null
          quantity?: number
          source_location_id: string
        }
        Update: {
          id?: string
          notes?: string | null
          part_id?: string
          pick_list_id?: string
          picked_up?: boolean | null
          picked_up_at?: string | null
          quantity?: number
          source_location_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_pick_list_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "ticket_pick_list_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "ticket_pick_list_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_pick_list_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "ticket_pick_list_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_pick_list_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "ticket_pick_list_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_pick_list_items_pick_list_id_fkey"
            columns: ["pick_list_id"]
            isOneToOne: false
            referencedRelation: "ticket_pick_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_pick_list_items_pick_list_id_fkey"
            columns: ["pick_list_id"]
            isOneToOne: false
            referencedRelation: "vw_parts_ready_for_pickup"
            referencedColumns: ["pick_list_id"]
          },
          {
            foreignKeyName: "ticket_pick_list_items_source_location_id_fkey"
            columns: ["source_location_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "ticket_pick_list_items_source_location_id_fkey"
            columns: ["source_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_pick_list_items_source_location_id_fkey"
            columns: ["source_location_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inventory_with_serials"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "ticket_pick_list_items_source_location_id_fkey"
            columns: ["source_location_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["location_id"]
          },
        ]
      }
      ticket_pick_lists: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          id: string
          notes: string | null
          picked_up_at: string | null
          picked_up_by: string | null
          status: string
          ticket_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          picked_up_at?: string | null
          picked_up_by?: string | null
          status?: string
          ticket_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          picked_up_at?: string | null
          picked_up_by?: string | null
          status?: string
          ticket_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_pick_lists_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_picked_up_by_fkey"
            columns: ["picked_up_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_picked_up_by_fkey"
            columns: ["picked_up_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_picked_up_by_fkey"
            columns: ["picked_up_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_picked_up_by_fkey"
            columns: ["picked_up_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      ticket_sequences: {
        Row: {
          created_at: string | null
          day_of_month: number | null
          id: string
          last_sequence: number | null
          project_id: string | null
          ticket_type: Database["public"]["Enums"]["ticket_type"]
          updated_at: string | null
          year_month: string
        }
        Insert: {
          created_at?: string | null
          day_of_month?: number | null
          id?: string
          last_sequence?: number | null
          project_id?: string | null
          ticket_type: Database["public"]["Enums"]["ticket_type"]
          updated_at?: string | null
          year_month: string
        }
        Update: {
          created_at?: string | null
          day_of_month?: number | null
          id?: string
          last_sequence?: number | null
          project_id?: string | null
          ticket_type?: Database["public"]["Enums"]["ticket_type"]
          updated_at?: string | null
          year_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_sequences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ticket_sequences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_sequences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "ticket_sequences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ticket_sequences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
        ]
      }
      ticket_updates: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          progress_percent: number | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          technician_id: string | null
          ticket_id: string
          update_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          progress_percent?: number | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          technician_id?: string | null
          ticket_id: string
          update_type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          progress_percent?: number | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          technician_id?: string | null
          ticket_id?: string
          update_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_updates_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_updates_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ticket_updates_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "ticket_updates_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "ticket_updates_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_updates_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "ticket_updates_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_updates_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_updates_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_updates_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "ticket_updates_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "ticket_updates_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_updates_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_updates_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_updates_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_updates_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_updates_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      tickets: {
        Row: {
          accepted_at: string | null
          actual_duration_minutes: number | null
          ahs_authorization_date: string | null
          ahs_covered_amount: number | null
          ahs_diagnosis_fee_amount: number | null
          ahs_dispatch_number: string | null
          ahs_labor_rate_per_hour: number | null
          ahs_portal_submission_date: string | null
          arrived_onsite_at: string | null
          assigned_to: string | null
          billable: boolean | null
          billed_amount: number | null
          billed_at: string | null
          closed_billed_date: string | null
          completed_at: string | null
          completed_date: string | null
          created_at: string | null
          created_by: string
          customer_id: string
          description: string | null
          equipment_id: string | null
          estimated_duration: number
          estimated_minutes: number | null
          geocode_source: string | null
          geocoded_at: string | null
          hold_active: boolean | null
          hold_issue_active: boolean
          hold_parts_active: boolean
          hold_type: string | null
          hours_onsite: number | null
          id: string
          invoice_id: string | null
          labor_cost_estimate: number | null
          latitude: number | null
          longitude: number | null
          parts_used: Json | null
          phase_milestone: string | null
          photos: Json | null
          place_id: string | null
          priority: Database["public"]["Enums"]["ticket_priority"] | null
          problem_code: string | null
          project_id: string | null
          project_task_id: string | null
          ready_to_invoice_at: string | null
          resolution_code: string | null
          revisit_required: boolean | null
          sales_opportunity_flag: boolean | null
          scheduled_date: string | null
          service_contract_id: string | null
          service_type: string | null
          site_contact_name: string | null
          site_contact_phone: string | null
          site_id: string | null
          source_estimate_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          technician_notes: string | null
          ticket_number: string
          ticket_type: Database["public"]["Enums"]["ticket_type"] | null
          title: string
          updated_at: string | null
          updated_by: string | null
          urgent_review_flag: boolean | null
          work_started_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          actual_duration_minutes?: number | null
          ahs_authorization_date?: string | null
          ahs_covered_amount?: number | null
          ahs_diagnosis_fee_amount?: number | null
          ahs_dispatch_number?: string | null
          ahs_labor_rate_per_hour?: number | null
          ahs_portal_submission_date?: string | null
          arrived_onsite_at?: string | null
          assigned_to?: string | null
          billable?: boolean | null
          billed_amount?: number | null
          billed_at?: string | null
          closed_billed_date?: string | null
          completed_at?: string | null
          completed_date?: string | null
          created_at?: string | null
          created_by: string
          customer_id: string
          description?: string | null
          equipment_id?: string | null
          estimated_duration?: number
          estimated_minutes?: number | null
          geocode_source?: string | null
          geocoded_at?: string | null
          hold_active?: boolean | null
          hold_issue_active?: boolean
          hold_parts_active?: boolean
          hold_type?: string | null
          hours_onsite?: number | null
          id?: string
          invoice_id?: string | null
          labor_cost_estimate?: number | null
          latitude?: number | null
          longitude?: number | null
          parts_used?: Json | null
          phase_milestone?: string | null
          photos?: Json | null
          place_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          problem_code?: string | null
          project_id?: string | null
          project_task_id?: string | null
          ready_to_invoice_at?: string | null
          resolution_code?: string | null
          revisit_required?: boolean | null
          sales_opportunity_flag?: boolean | null
          scheduled_date?: string | null
          service_contract_id?: string | null
          service_type?: string | null
          site_contact_name?: string | null
          site_contact_phone?: string | null
          site_id?: string | null
          source_estimate_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          technician_notes?: string | null
          ticket_number: string
          ticket_type?: Database["public"]["Enums"]["ticket_type"] | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
          urgent_review_flag?: boolean | null
          work_started_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          actual_duration_minutes?: number | null
          ahs_authorization_date?: string | null
          ahs_covered_amount?: number | null
          ahs_diagnosis_fee_amount?: number | null
          ahs_dispatch_number?: string | null
          ahs_labor_rate_per_hour?: number | null
          ahs_portal_submission_date?: string | null
          arrived_onsite_at?: string | null
          assigned_to?: string | null
          billable?: boolean | null
          billed_amount?: number | null
          billed_at?: string | null
          closed_billed_date?: string | null
          completed_at?: string | null
          completed_date?: string | null
          created_at?: string | null
          created_by?: string
          customer_id?: string
          description?: string | null
          equipment_id?: string | null
          estimated_duration?: number
          estimated_minutes?: number | null
          geocode_source?: string | null
          geocoded_at?: string | null
          hold_active?: boolean | null
          hold_issue_active?: boolean
          hold_parts_active?: boolean
          hold_type?: string | null
          hours_onsite?: number | null
          id?: string
          invoice_id?: string | null
          labor_cost_estimate?: number | null
          latitude?: number | null
          longitude?: number | null
          parts_used?: Json | null
          phase_milestone?: string | null
          photos?: Json | null
          place_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          problem_code?: string | null
          project_id?: string | null
          project_task_id?: string | null
          ready_to_invoice_at?: string | null
          resolution_code?: string | null
          revisit_required?: boolean | null
          sales_opportunity_flag?: boolean | null
          scheduled_date?: string | null
          service_contract_id?: string | null
          service_type?: string | null
          site_contact_name?: string | null
          site_contact_phone?: string | null
          site_id?: string | null
          source_estimate_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          technician_notes?: string | null
          ticket_number?: string
          ticket_type?: Database["public"]["Enums"]["ticket_type"] | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          urgent_review_flag?: boolean | null
          work_started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "tickets_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "tickets_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_with_installed_parts"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "tickets_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "tickets_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "tickets_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_traceability_report"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "tickets_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_problem_code_fkey"
            columns: ["problem_code"]
            isOneToOne: false
            referencedRelation: "standard_codes"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tickets_problem_code_fkey"
            columns: ["problem_code"]
            isOneToOne: false
            referencedRelation: "vw_problem_pareto"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tickets_problem_code_fkey"
            columns: ["problem_code"]
            isOneToOne: false
            referencedRelation: "vw_resolution_pareto"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
          {
            foreignKeyName: "tickets_project_task_id_fkey"
            columns: ["project_task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_resolution_code_fkey"
            columns: ["resolution_code"]
            isOneToOne: false
            referencedRelation: "standard_codes"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tickets_resolution_code_fkey"
            columns: ["resolution_code"]
            isOneToOne: false
            referencedRelation: "vw_problem_pareto"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tickets_resolution_code_fkey"
            columns: ["resolution_code"]
            isOneToOne: false
            referencedRelation: "vw_resolution_pareto"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tickets_service_contract_id_fkey"
            columns: ["service_contract_id"]
            isOneToOne: false
            referencedRelation: "service_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "customer_location_summary"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "tickets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "customer_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "tickets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "tickets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "tickets_source_estimate_id_fkey"
            columns: ["source_estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_source_estimate_id_fkey"
            columns: ["source_estimate_id"]
            isOneToOne: false
            referencedRelation: "vw_estimate_margin"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "tickets_source_estimate_id_fkey"
            columns: ["source_estimate_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "tickets_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "tickets_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "tickets_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      time_adjustments: {
        Row: {
          adjusted_by: string
          adjustment_type: string
          created_at: string | null
          hours_adjusted: number
          id: string
          reason: string
          time_log_id: string
        }
        Insert: {
          adjusted_by: string
          adjustment_type: string
          created_at?: string | null
          hours_adjusted: number
          id?: string
          reason: string
          time_log_id: string
        }
        Update: {
          adjusted_by?: string
          adjustment_type?: string
          created_at?: string | null
          hours_adjusted?: number
          id?: string
          reason?: string
          time_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_adjustments_adjusted_by_fkey"
            columns: ["adjusted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_adjustments_adjusted_by_fkey"
            columns: ["adjusted_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "time_adjustments_adjusted_by_fkey"
            columns: ["adjusted_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "time_adjustments_adjusted_by_fkey"
            columns: ["adjusted_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "time_adjustments_time_log_id_fkey"
            columns: ["time_log_id"]
            isOneToOne: false
            referencedRelation: "labor_profitability_summary"
            referencedColumns: ["time_log_id"]
          },
          {
            foreignKeyName: "time_adjustments_time_log_id_fkey"
            columns: ["time_log_id"]
            isOneToOne: false
            referencedRelation: "time_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      time_logs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          billing_rate_applied: number | null
          break_duration: number | null
          clock_in_time: string
          clock_out_time: string | null
          contract_id_applied: string | null
          created_at: string | null
          id: string
          is_covered: boolean | null
          labor_cost_applied: number | null
          labor_margin: number | null
          location_lat: number | null
          location_lng: number | null
          notes: string | null
          overridden_at: string | null
          overridden_by: string | null
          override_reason: string | null
          project_id: string | null
          project_task_id: string | null
          rate_source: Database["public"]["Enums"]["rate_source"] | null
          rate_tier: Database["public"]["Enums"]["labor_rate_tier"] | null
          status: Database["public"]["Enums"]["time_log_status"] | null
          ticket_id: string | null
          time_type: Database["public"]["Enums"]["time_log_type"] | null
          total_billed_amount: number | null
          total_cost_amount: number | null
          total_hours: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          billing_rate_applied?: number | null
          break_duration?: number | null
          clock_in_time: string
          clock_out_time?: string | null
          contract_id_applied?: string | null
          created_at?: string | null
          id?: string
          is_covered?: boolean | null
          labor_cost_applied?: number | null
          labor_margin?: number | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          project_id?: string | null
          project_task_id?: string | null
          rate_source?: Database["public"]["Enums"]["rate_source"] | null
          rate_tier?: Database["public"]["Enums"]["labor_rate_tier"] | null
          status?: Database["public"]["Enums"]["time_log_status"] | null
          ticket_id?: string | null
          time_type?: Database["public"]["Enums"]["time_log_type"] | null
          total_billed_amount?: number | null
          total_cost_amount?: number | null
          total_hours?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          billing_rate_applied?: number | null
          break_duration?: number | null
          clock_in_time?: string
          clock_out_time?: string | null
          contract_id_applied?: string | null
          created_at?: string | null
          id?: string
          is_covered?: boolean | null
          labor_cost_applied?: number | null
          labor_margin?: number | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          project_id?: string | null
          project_task_id?: string | null
          rate_source?: Database["public"]["Enums"]["rate_source"] | null
          rate_tier?: Database["public"]["Enums"]["labor_rate_tier"] | null
          status?: Database["public"]["Enums"]["time_log_status"] | null
          ticket_id?: string | null
          time_type?: Database["public"]["Enums"]["time_log_type"] | null
          total_billed_amount?: number | null
          total_cost_amount?: number | null
          total_hours?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_logs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "time_logs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "time_logs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "time_logs_contract_id_applied_fkey"
            columns: ["contract_id_applied"]
            isOneToOne: false
            referencedRelation: "service_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_overridden_by_fkey"
            columns: ["overridden_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_overridden_by_fkey"
            columns: ["overridden_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "time_logs_overridden_by_fkey"
            columns: ["overridden_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "time_logs_overridden_by_fkey"
            columns: ["overridden_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "time_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "time_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "time_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "time_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
          {
            foreignKeyName: "time_logs_project_task_id_fkey"
            columns: ["project_task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "time_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "time_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "time_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      vendor_audit_log: {
        Row: {
          action_type: string
          description: string | null
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
          performed_at: string | null
          performed_by: string | null
          vendor_id: string
        }
        Insert: {
          action_type: string
          description?: string | null
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_at?: string | null
          performed_by?: string | null
          vendor_id: string
        }
        Update: {
          action_type?: string
          description?: string | null
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_at?: string | null
          performed_by?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "vendor_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "vendor_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "vendor_audit_log_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_audit_log_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_1099_report"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "vendor_audit_log_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_aging"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "vendor_audit_log_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_vendor_lead_time_metrics"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      vendor_bills: {
        Row: {
          amount: number
          amount_paid: number | null
          balance_due: number
          bill_date: string
          bill_number: string
          category: string | null
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string
          gl_posted: boolean | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["ap_status"] | null
          updated_at: string | null
          vendor_id: string | null
          vendor_name: string
        }
        Insert: {
          amount: number
          amount_paid?: number | null
          balance_due: number
          bill_date?: string
          bill_number: string
          category?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date: string
          gl_posted?: boolean | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["ap_status"] | null
          updated_at?: string | null
          vendor_id?: string | null
          vendor_name: string
        }
        Update: {
          amount?: number
          amount_paid?: number | null
          balance_due?: number
          bill_date?: string
          bill_number?: string
          category?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string
          gl_posted?: boolean | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["ap_status"] | null
          updated_at?: string | null
          vendor_id?: string | null
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_bills_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_bills_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "vendor_bills_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "vendor_bills_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      vendor_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      vendor_contacts: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_billing_contact: boolean | null
          is_primary: boolean | null
          is_shipping_contact: boolean | null
          mobile: string | null
          name: string
          notes: string | null
          phone: string | null
          role: string | null
          title: string | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_billing_contact?: boolean | null
          is_primary?: boolean | null
          is_shipping_contact?: boolean | null
          mobile?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          title?: string | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_billing_contact?: boolean | null
          is_primary?: boolean | null
          is_shipping_contact?: boolean | null
          mobile?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          title?: string | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_contacts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contacts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_1099_report"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "vendor_contacts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_aging"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "vendor_contacts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_vendor_lead_time_metrics"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      vendor_contract_documents: {
        Row: {
          document_type: Database["public"]["Enums"]["contract_document_type"]
          expires_at: string | null
          file_name: string
          file_size_bytes: number | null
          id: string
          mime_type: string | null
          storage_key: string | null
          uploaded_at: string | null
          uploaded_by_user_id: string | null
          vendor_contract_id: string
        }
        Insert: {
          document_type: Database["public"]["Enums"]["contract_document_type"]
          expires_at?: string | null
          file_name: string
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          storage_key?: string | null
          uploaded_at?: string | null
          uploaded_by_user_id?: string | null
          vendor_contract_id: string
        }
        Update: {
          document_type?: Database["public"]["Enums"]["contract_document_type"]
          expires_at?: string | null
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          storage_key?: string | null
          uploaded_at?: string | null
          uploaded_by_user_id?: string | null
          vendor_contract_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_contract_documents_uploaded_by_user_id_fkey"
            columns: ["uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contract_documents_uploaded_by_user_id_fkey"
            columns: ["uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "vendor_contract_documents_uploaded_by_user_id_fkey"
            columns: ["uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "vendor_contract_documents_uploaded_by_user_id_fkey"
            columns: ["uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "vendor_contract_documents_vendor_contract_id_fkey"
            columns: ["vendor_contract_id"]
            isOneToOne: false
            referencedRelation: "v_vendor_contracts_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contract_documents_vendor_contract_id_fkey"
            columns: ["vendor_contract_id"]
            isOneToOne: false
            referencedRelation: "vendor_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_contract_items: {
        Row: {
          contract_price: number | null
          created_at: string | null
          discount_percent: number | null
          effective_end_date: string | null
          effective_start_date: string | null
          end_quantity_break: number | null
          id: string
          is_core_item: boolean | null
          item_description_override: string | null
          lead_time_days_override: number | null
          notes: string | null
          part_category: string | null
          part_id: string | null
          price_type: Database["public"]["Enums"]["contract_price_type"]
          pricing_basis: Database["public"]["Enums"]["pricing_basis"] | null
          start_quantity_break: number | null
          updated_at: string | null
          vendor_contract_id: string
        }
        Insert: {
          contract_price?: number | null
          created_at?: string | null
          discount_percent?: number | null
          effective_end_date?: string | null
          effective_start_date?: string | null
          end_quantity_break?: number | null
          id?: string
          is_core_item?: boolean | null
          item_description_override?: string | null
          lead_time_days_override?: number | null
          notes?: string | null
          part_category?: string | null
          part_id?: string | null
          price_type?: Database["public"]["Enums"]["contract_price_type"]
          pricing_basis?: Database["public"]["Enums"]["pricing_basis"] | null
          start_quantity_break?: number | null
          updated_at?: string | null
          vendor_contract_id: string
        }
        Update: {
          contract_price?: number | null
          created_at?: string | null
          discount_percent?: number | null
          effective_end_date?: string | null
          effective_start_date?: string | null
          end_quantity_break?: number | null
          id?: string
          is_core_item?: boolean | null
          item_description_override?: string | null
          lead_time_days_override?: number | null
          notes?: string | null
          part_category?: string | null
          part_id?: string | null
          price_type?: Database["public"]["Enums"]["contract_price_type"]
          pricing_basis?: Database["public"]["Enums"]["pricing_basis"] | null
          start_quantity_break?: number | null
          updated_at?: string | null
          vendor_contract_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_contract_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "vendor_contract_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "vendor_contract_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contract_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "vendor_contract_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contract_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "vendor_contract_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contract_items_vendor_contract_id_fkey"
            columns: ["vendor_contract_id"]
            isOneToOne: false
            referencedRelation: "v_vendor_contracts_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contract_items_vendor_contract_id_fkey"
            columns: ["vendor_contract_id"]
            isOneToOne: false
            referencedRelation: "vendor_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_contract_slas: {
        Row: {
          breach_threshold: number | null
          created_at: string | null
          id: string
          metric: Database["public"]["Enums"]["contract_sla_metric"]
          metric_description: string | null
          notes: string | null
          target_unit: string
          target_value: number
          updated_at: string | null
          vendor_contract_id: string
        }
        Insert: {
          breach_threshold?: number | null
          created_at?: string | null
          id?: string
          metric: Database["public"]["Enums"]["contract_sla_metric"]
          metric_description?: string | null
          notes?: string | null
          target_unit: string
          target_value: number
          updated_at?: string | null
          vendor_contract_id: string
        }
        Update: {
          breach_threshold?: number | null
          created_at?: string | null
          id?: string
          metric?: Database["public"]["Enums"]["contract_sla_metric"]
          metric_description?: string | null
          notes?: string | null
          target_unit?: string
          target_value?: number
          updated_at?: string | null
          vendor_contract_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_contract_slas_vendor_contract_id_fkey"
            columns: ["vendor_contract_id"]
            isOneToOne: false
            referencedRelation: "v_vendor_contracts_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contract_slas_vendor_contract_id_fkey"
            columns: ["vendor_contract_id"]
            isOneToOne: false
            referencedRelation: "vendor_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_contracts: {
        Row: {
          auto_renew: boolean | null
          contract_number: string | null
          contract_type: string | null
          contract_value: number | null
          created_at: string | null
          created_by: string | null
          document_name: string | null
          document_url: string | null
          end_date: string | null
          free_freight_threshold: number | null
          freight_terms: string | null
          id: string
          is_preferred_vendor: boolean | null
          minimum_order_value: number | null
          notes: string | null
          parent_contract_id: string | null
          payment_terms: string | null
          renewal_date: string | null
          renewal_reminder_days: number | null
          renewal_reminder_sent: boolean | null
          renewal_term_months: number | null
          return_policy: string | null
          rush_lead_time_days: number | null
          sla_terms: string | null
          standard_lead_time_days: number | null
          start_date: string
          status: string | null
          terms_and_conditions: string | null
          updated_at: string | null
          updated_by_user_id: string | null
          vendor_id: string
          version: number | null
          warranty_terms: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          contract_number?: string | null
          contract_type?: string | null
          contract_value?: number | null
          created_at?: string | null
          created_by?: string | null
          document_name?: string | null
          document_url?: string | null
          end_date?: string | null
          free_freight_threshold?: number | null
          freight_terms?: string | null
          id?: string
          is_preferred_vendor?: boolean | null
          minimum_order_value?: number | null
          notes?: string | null
          parent_contract_id?: string | null
          payment_terms?: string | null
          renewal_date?: string | null
          renewal_reminder_days?: number | null
          renewal_reminder_sent?: boolean | null
          renewal_term_months?: number | null
          return_policy?: string | null
          rush_lead_time_days?: number | null
          sla_terms?: string | null
          standard_lead_time_days?: number | null
          start_date: string
          status?: string | null
          terms_and_conditions?: string | null
          updated_at?: string | null
          updated_by_user_id?: string | null
          vendor_id: string
          version?: number | null
          warranty_terms?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          contract_number?: string | null
          contract_type?: string | null
          contract_value?: number | null
          created_at?: string | null
          created_by?: string | null
          document_name?: string | null
          document_url?: string | null
          end_date?: string | null
          free_freight_threshold?: number | null
          freight_terms?: string | null
          id?: string
          is_preferred_vendor?: boolean | null
          minimum_order_value?: number | null
          notes?: string | null
          parent_contract_id?: string | null
          payment_terms?: string | null
          renewal_date?: string | null
          renewal_reminder_days?: number | null
          renewal_reminder_sent?: boolean | null
          renewal_term_months?: number | null
          return_policy?: string | null
          rush_lead_time_days?: number | null
          sla_terms?: string | null
          standard_lead_time_days?: number | null
          start_date?: string
          status?: string | null
          terms_and_conditions?: string | null
          updated_at?: string | null
          updated_by_user_id?: string | null
          vendor_id?: string
          version?: number | null
          warranty_terms?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "vendor_contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "vendor_contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "vendor_contracts_parent_contract_id_fkey"
            columns: ["parent_contract_id"]
            isOneToOne: false
            referencedRelation: "v_vendor_contracts_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contracts_parent_contract_id_fkey"
            columns: ["parent_contract_id"]
            isOneToOne: false
            referencedRelation: "vendor_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contracts_updated_by_user_id_fkey"
            columns: ["updated_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contracts_updated_by_user_id_fkey"
            columns: ["updated_by_user_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "vendor_contracts_updated_by_user_id_fkey"
            columns: ["updated_by_user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "vendor_contracts_updated_by_user_id_fkey"
            columns: ["updated_by_user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "vendor_contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_1099_report"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "vendor_contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_aging"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "vendor_contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_vendor_lead_time_metrics"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      vendor_part_mappings: {
        Row: {
          created_at: string | null
          id: string
          is_discontinued: boolean | null
          is_preferred_vendor: boolean | null
          last_cost: number | null
          last_purchase_date: string | null
          lead_time_days: number | null
          minimum_order_qty: number | null
          notes: string | null
          pack_qty: number | null
          part_id: string
          standard_cost: number | null
          uom: string | null
          updated_at: string | null
          vendor_id: string
          vendor_part_description: string | null
          vendor_part_number: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_discontinued?: boolean | null
          is_preferred_vendor?: boolean | null
          last_cost?: number | null
          last_purchase_date?: string | null
          lead_time_days?: number | null
          minimum_order_qty?: number | null
          notes?: string | null
          pack_qty?: number | null
          part_id: string
          standard_cost?: number | null
          uom?: string | null
          updated_at?: string | null
          vendor_id: string
          vendor_part_description?: string | null
          vendor_part_number?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_discontinued?: boolean | null
          is_preferred_vendor?: boolean | null
          last_cost?: number | null
          last_purchase_date?: string | null
          lead_time_days?: number | null
          minimum_order_qty?: number | null
          notes?: string | null
          pack_qty?: number | null
          part_id?: string
          standard_cost?: number | null
          uom?: string | null
          updated_at?: string | null
          vendor_id?: string
          vendor_part_description?: string | null
          vendor_part_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_part_mappings_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "vendor_part_mappings_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "vendor_part_mappings_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_part_mappings_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "vendor_part_mappings_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_part_mappings_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "vendor_part_mappings_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_part_mappings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_part_mappings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_1099_report"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "vendor_part_mappings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_aging"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "vendor_part_mappings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_vendor_lead_time_metrics"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      vendor_payment_allocations: {
        Row: {
          amount: number
          bill_id: string
          created_at: string | null
          id: string
          payment_id: string
        }
        Insert: {
          amount: number
          bill_id: string
          created_at?: string | null
          id?: string
          payment_id: string
        }
        Update: {
          amount?: number
          bill_id?: string
          created_at?: string | null
          id?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payment_allocations_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "vendor_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_payments: {
        Row: {
          check_number: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          notes: string | null
          payment_amount: number
          payment_date: string
          payment_method: string | null
          payment_number: string | null
          processed_at: string | null
          processed_by: string | null
          purchase_order_id: string | null
          status: string | null
          transaction_reference: string | null
          updated_at: string | null
          vendor_bill_id: string | null
          vendor_id: string
        }
        Insert: {
          check_number?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          payment_amount: number
          payment_date: string
          payment_method?: string | null
          payment_number?: string | null
          processed_at?: string | null
          processed_by?: string | null
          purchase_order_id?: string | null
          status?: string | null
          transaction_reference?: string | null
          updated_at?: string | null
          vendor_bill_id?: string | null
          vendor_id: string
        }
        Update: {
          check_number?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          payment_amount?: number
          payment_date?: string
          payment_method?: string | null
          payment_number?: string | null
          processed_at?: string | null
          processed_by?: string | null
          purchase_order_id?: string | null
          status?: string | null
          transaction_reference?: string | null
          updated_at?: string | null
          vendor_bill_id?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "vendor_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "vendor_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "vendor_payments_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_payments_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "vendor_payments_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "vendor_payments_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "vendor_payments_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_payments_vendor_bill_id_fkey"
            columns: ["vendor_bill_id"]
            isOneToOne: false
            referencedRelation: "vendor_bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_payments_vendor_bill_id_fkey"
            columns: ["vendor_bill_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_bill_balances"
            referencedColumns: ["bill_id"]
          },
          {
            foreignKeyName: "vendor_payments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_payments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_1099_report"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "vendor_payments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_aging"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "vendor_payments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_vendor_lead_time_metrics"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      vendor_performance_metrics: {
        Row: {
          created_at: string | null
          id: string
          metric_target: number | null
          metric_type: string
          metric_value: number
          notes: string | null
          period_end: string
          period_start: string
          recorded_at: string | null
          recorded_by: string | null
          sample_size: number | null
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metric_target?: number | null
          metric_type: string
          metric_value: number
          notes?: string | null
          period_end: string
          period_start: string
          recorded_at?: string | null
          recorded_by?: string | null
          sample_size?: number | null
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metric_target?: number | null
          metric_type?: string
          metric_value?: number
          notes?: string | null
          period_end?: string
          period_start?: string
          recorded_at?: string | null
          recorded_by?: string | null
          sample_size?: number | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_performance_metrics_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_performance_metrics_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "vendor_performance_metrics_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "vendor_performance_metrics_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "vendor_performance_metrics_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_performance_metrics_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_1099_report"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "vendor_performance_metrics_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_aging"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "vendor_performance_metrics_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_vendor_lead_time_metrics"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      vendors: {
        Row: {
          account_number: string | null
          address: string | null
          address_line1: string | null
          address_line2: string | null
          approved_at: string | null
          approved_by: string | null
          bank_account_last4: string | null
          bank_name: string | null
          bank_routing_number: string | null
          bank_verified: boolean | null
          category_ids: string[] | null
          city: string | null
          contact_name: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          credit_limit: number | null
          currency: string | null
          default_1099_box: string | null
          display_name: string | null
          email: string | null
          id: string
          internal_notes: string | null
          is_1099_eligible: boolean | null
          is_active: boolean | null
          legal_name: string | null
          minimum_order_amount: number | null
          name: string
          notes: string | null
          onboarding_status: string | null
          payment_method: string | null
          payment_terms: string | null
          phone: string | null
          postal_code: string | null
          preferred_vendor: boolean | null
          primary_email: string | null
          primary_phone: string | null
          rating: number | null
          standard_lead_time_days: number | null
          state: string | null
          status: string | null
          tax_id: string | null
          tax_id_number: string | null
          updated_at: string | null
          updated_by: string | null
          vendor_code: string
          w9_verified: boolean | null
          website: string | null
          zip_code: string | null
        }
        Insert: {
          account_number?: string | null
          address?: string | null
          address_line1?: string | null
          address_line2?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bank_account_last4?: string | null
          bank_name?: string | null
          bank_routing_number?: string | null
          bank_verified?: boolean | null
          category_ids?: string[] | null
          city?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          currency?: string | null
          default_1099_box?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          internal_notes?: string | null
          is_1099_eligible?: boolean | null
          is_active?: boolean | null
          legal_name?: string | null
          minimum_order_amount?: number | null
          name: string
          notes?: string | null
          onboarding_status?: string | null
          payment_method?: string | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_vendor?: boolean | null
          primary_email?: string | null
          primary_phone?: string | null
          rating?: number | null
          standard_lead_time_days?: number | null
          state?: string | null
          status?: string | null
          tax_id?: string | null
          tax_id_number?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vendor_code: string
          w9_verified?: boolean | null
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          account_number?: string | null
          address?: string | null
          address_line1?: string | null
          address_line2?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bank_account_last4?: string | null
          bank_name?: string | null
          bank_routing_number?: string | null
          bank_verified?: boolean | null
          category_ids?: string[] | null
          city?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          currency?: string | null
          default_1099_box?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          internal_notes?: string | null
          is_1099_eligible?: boolean | null
          is_active?: boolean | null
          legal_name?: string | null
          minimum_order_amount?: number | null
          name?: string
          notes?: string | null
          onboarding_status?: string | null
          payment_method?: string | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_vendor?: boolean | null
          primary_email?: string | null
          primary_phone?: string | null
          rating?: number | null
          standard_lead_time_days?: number | null
          state?: string | null
          status?: string | null
          tax_id?: string | null
          tax_id_number?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vendor_code?: string
          w9_verified?: boolean | null
          website?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "vendors_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "vendors_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "vendors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "vendors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "vendors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "vendors_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "vendors_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "vendors_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      warehouse_locations: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          location_type: string
          name: string
          technician_id: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_type: string
          name: string
          technician_id?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_type?: string
          name?: string
          technician_id?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_locations_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_locations_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "warehouse_locations_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "warehouse_locations_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      warranty_claims: {
        Row: {
          approved_by: string | null
          claim_date: string | null
          claim_number: string
          created_at: string | null
          id: string
          issue_description: string
          resolution_notes: string | null
          serialized_part_id: string
          status: Database["public"]["Enums"]["warranty_status"] | null
          submitted_by: string | null
          ticket_id: string | null
          updated_at: string | null
          warranty_record_id: string
        }
        Insert: {
          approved_by?: string | null
          claim_date?: string | null
          claim_number: string
          created_at?: string | null
          id?: string
          issue_description: string
          resolution_notes?: string | null
          serialized_part_id: string
          status?: Database["public"]["Enums"]["warranty_status"] | null
          submitted_by?: string | null
          ticket_id?: string | null
          updated_at?: string | null
          warranty_record_id: string
        }
        Update: {
          approved_by?: string | null
          claim_date?: string | null
          claim_number?: string
          created_at?: string | null
          id?: string
          issue_description?: string
          resolution_notes?: string | null
          serialized_part_id?: string
          status?: Database["public"]["Enums"]["warranty_status"] | null
          submitted_by?: string | null
          ticket_id?: string | null
          updated_at?: string | null
          warranty_record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warranty_claims_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_claims_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "warranty_claims_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "warranty_claims_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "warranty_claims_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "equipment_with_installed_parts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "warranty_claims_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "serialized_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_claims_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "serialized_parts_available_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_claims_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "serialized_parts_installed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_claims_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["serialized_part_id"]
          },
          {
            foreignKeyName: "warranty_claims_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_claims_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_claims_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "warranty_claims_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "warranty_claims_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "warranty_claims_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "warranty_claims_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "warranty_claims_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "warranty_claims_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_claims_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_claims_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "warranty_claims_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "warranty_claims_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "warranty_claims_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_claims_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "warranty_claims_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "warranty_claims_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "warranty_claims_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "warranty_claims_warranty_record_id_fkey"
            columns: ["warranty_record_id"]
            isOneToOne: false
            referencedRelation: "equipment_with_installed_parts"
            referencedColumns: ["warranty_id"]
          },
          {
            foreignKeyName: "warranty_claims_warranty_record_id_fkey"
            columns: ["warranty_record_id"]
            isOneToOne: false
            referencedRelation: "warranty_records"
            referencedColumns: ["id"]
          },
        ]
      }
      warranty_records: {
        Row: {
          coverage_terms: string | null
          created_at: string | null
          duration_months: number | null
          end_date: string
          exclusions: string | null
          id: string
          notes: string | null
          serialized_part_id: string
          start_date: string
          updated_at: string | null
          vendor_id: string | null
          warranty_number: string | null
          warranty_status: Database["public"]["Enums"]["warranty_status"] | null
          warranty_type: Database["public"]["Enums"]["warranty_type"] | null
        }
        Insert: {
          coverage_terms?: string | null
          created_at?: string | null
          duration_months?: number | null
          end_date: string
          exclusions?: string | null
          id?: string
          notes?: string | null
          serialized_part_id: string
          start_date: string
          updated_at?: string | null
          vendor_id?: string | null
          warranty_number?: string | null
          warranty_status?:
            | Database["public"]["Enums"]["warranty_status"]
            | null
          warranty_type?: Database["public"]["Enums"]["warranty_type"] | null
        }
        Update: {
          coverage_terms?: string | null
          created_at?: string | null
          duration_months?: number | null
          end_date?: string
          exclusions?: string | null
          id?: string
          notes?: string | null
          serialized_part_id?: string
          start_date?: string
          updated_at?: string | null
          vendor_id?: string | null
          warranty_number?: string | null
          warranty_status?:
            | Database["public"]["Enums"]["warranty_status"]
            | null
          warranty_type?: Database["public"]["Enums"]["warranty_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "warranty_records_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "equipment_with_installed_parts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "warranty_records_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "serialized_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_records_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "serialized_parts_available_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_records_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "serialized_parts_installed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_records_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["serialized_part_id"]
          },
          {
            foreignKeyName: "warranty_records_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_records_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_records_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_1099_report"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "warranty_records_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_aging"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "warranty_records_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_vendor_lead_time_metrics"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
    }
    Views: {
      billing_performance_metrics: {
        Row: {
          avg_days_from_ready_to_billed: number | null
          avg_days_to_bill: number | null
          avg_days_to_payment: number | null
          billing_month: string | null
          invoices_overdue: number | null
          invoices_paid: number | null
          invoices_partial: number | null
          prj_revenue: number | null
          prj_ticket_count: number | null
          svc_revenue: number | null
          svc_ticket_count: number | null
          tickets_billed: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      customer_location_summary: {
        Row: {
          address: string | null
          city: string | null
          completed_tickets: number | null
          customer_id: string | null
          customer_name: string | null
          equipment_count: number | null
          is_primary: boolean | null
          last_service_date: string | null
          location_id: string | null
          location_name: string | null
          state: string | null
          total_revenue: number | null
          total_tickets: number | null
          zip_code: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_locations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_locations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_locations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_locations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_locations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_locations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_locations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customer_revenue_details: {
        Row: {
          average_ticket_value: number | null
          collection_rate_percent: number | null
          completed_tickets: number | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          invoices_overdue: number | null
          invoices_paid: number | null
          invoices_partial: number | null
          invoices_sent: number | null
          last_invoice_date: string | null
          last_service_date: string | null
          outstanding_balance: number | null
          total_billed: number | null
          total_collected: number | null
          total_labor_cost: number | null
          total_parts_cost: number | null
          total_tickets: number | null
          updated_at: string | null
          ytd_billed: number | null
          ytd_collected: number | null
        }
        Relationships: []
      }
      customer_service_history: {
        Row: {
          completed_at: string | null
          customer_id: string | null
          customer_name: string | null
          equipment_id: string | null
          equipment_type: string | null
          invoice_id: string | null
          invoice_number: string | null
          invoice_status: Database["public"]["Enums"]["invoice_status"] | null
          location_id: string | null
          location_name: string | null
          priority: Database["public"]["Enums"]["ticket_priority"] | null
          serial_number: string | null
          service_date: string | null
          technician_name: string | null
          ticket_id: string | null
          ticket_number: string | null
          ticket_status: Database["public"]["Enums"]["ticket_status"] | null
          ticket_title: string | null
          total_amount: number | null
        }
        Relationships: []
      }
      equipment_installation_history: {
        Row: {
          customer_id: string | null
          customer_name: string | null
          equipment_id: string | null
          equipment_type: string | null
          installation_ticket_id: string | null
          installation_ticket_number: string | null
          installed_at: string | null
          installed_part_id: string | null
          location_id: string | null
          location_name: string | null
          manufacturer: string | null
          model_number: string | null
          part_name: string | null
          part_number: string | null
          serial_number: string | null
          warranty_expires_at: string | null
        }
        Relationships: []
      }
      equipment_with_installed_parts: {
        Row: {
          customer_id: string | null
          customer_name: string | null
          equipment_id: string | null
          equipment_installation_date: string | null
          equipment_location: string | null
          equipment_serial: string | null
          equipment_type: string | null
          equipment_warranty_expiration: string | null
          installed_by: string | null
          installed_on_ticket_id: string | null
          manufacturer: string | null
          model_number: string | null
          part_category: string | null
          part_cost: number | null
          part_id: string | null
          part_installation_date: string | null
          part_manufacturer: string | null
          part_name: string | null
          part_number: string | null
          part_serial_number: string | null
          part_status:
            | Database["public"]["Enums"]["serialized_part_status"]
            | null
          warranty_days_remaining: number | null
          warranty_duration: number | null
          warranty_end: string | null
          warranty_id: string | null
          warranty_start: string | null
          warranty_status: Database["public"]["Enums"]["warranty_status"] | null
          warranty_status_computed: string | null
          warranty_type: Database["public"]["Enums"]["warranty_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "equipment_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "equipment_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "equipment_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "equipment_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      gl_accounts: {
        Row: {
          account_name: string | null
          account_number: string | null
          account_subtype: string | null
          account_type: Database["public"]["Enums"]["account_type"] | null
          created_at: string | null
          credit_balance: number | null
          current_balance: number | null
          debit_balance: number | null
          description: string | null
          id: string | null
          is_active: boolean | null
          normal_balance: Database["public"]["Enums"]["normal_balance"] | null
          parent_account_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          account_subtype?: string | null
          account_type?: Database["public"]["Enums"]["account_type"] | null
          created_at?: string | null
          credit_balance?: never
          current_balance?: never
          debit_balance?: never
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          normal_balance?: Database["public"]["Enums"]["normal_balance"] | null
          parent_account_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          account_subtype?: string | null
          account_type?: Database["public"]["Enums"]["account_type"] | null
          created_at?: string | null
          credit_balance?: never
          current_balance?: never
          debit_balance?: never
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          normal_balance?: Database["public"]["Enums"]["normal_balance"] | null
          parent_account_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "gl_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "vw_trial_balance"
            referencedColumns: ["account_id"]
          },
        ]
      }
      invoice_traceability_report: {
        Row: {
          amount_paid: number | null
          balance_due: number | null
          customer_id: string | null
          customer_name: string | null
          due_date: string | null
          invoice_id: string | null
          invoice_number: string | null
          invoice_status: Database["public"]["Enums"]["invoice_status"] | null
          issue_date: string | null
          linked_tickets: Json | null
          paid_date: string | null
          primary_ticket_id: string | null
          primary_ticket_number: string | null
          project_id: string | null
          project_name: string | null
          project_number: string | null
          source_ticket_id: string | null
          source_ticket_number: string | null
          source_type: Database["public"]["Enums"]["invoice_source_type"] | null
          total_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["primary_ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["primary_ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["primary_ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["primary_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["primary_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["primary_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["primary_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["primary_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["primary_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["primary_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["primary_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["primary_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["primary_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          entry_date: string | null
          id: string | null
          reference_number: string | null
          status: string | null
          total_credits: number | null
          total_debits: number | null
        }
        Relationships: []
      }
      journal_entry_lines: {
        Row: {
          created_at: string | null
          credit_amount: number | null
          debit_amount: number | null
          description: string | null
          gl_account_id: string | null
          id: string | null
          journal_entry_id: string | null
          line_number: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gl_entries_account_id_fkey"
            columns: ["gl_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_entries_account_id_fkey"
            columns: ["gl_account_id"]
            isOneToOne: false
            referencedRelation: "gl_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_entries_account_id_fkey"
            columns: ["gl_account_id"]
            isOneToOne: false
            referencedRelation: "vw_trial_balance"
            referencedColumns: ["account_id"]
          },
        ]
      }
      labor_profitability_summary: {
        Row: {
          billing_rate_applied: number | null
          clock_in_time: string | null
          clock_out_time: string | null
          hours_worked: number | null
          labor_cost_applied: number | null
          labor_margin: number | null
          margin_percentage: number | null
          project_id: string | null
          rate_tier: Database["public"]["Enums"]["labor_rate_tier"] | null
          technician_id: string | null
          technician_name: string | null
          ticket_id: string | null
          time_log_id: string | null
          total_billed_amount: number | null
          total_cost_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "time_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "time_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "time_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "time_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "time_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "time_logs_user_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_user_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "time_logs_user_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "time_logs_user_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      part_inventory_details: {
        Row: {
          assigned_to_user_id: string | null
          category: string | null
          created_at: string | null
          inventory_id: string | null
          is_mobile: boolean | null
          location_active: boolean | null
          location_code: string | null
          location_id: string | null
          location_name: string | null
          location_type:
            | Database["public"]["Enums"]["stock_location_type"]
            | null
          manufacturer: string | null
          part_id: string | null
          part_name: string | null
          part_number: string | null
          quantity: number | null
          unit_cost: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_locations_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_locations_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "stock_locations_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "stock_locations_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      part_inventory_summary: {
        Row: {
          location_count: number | null
          locations_with_stock: string[] | null
          part_id: string | null
          part_name: string | null
          part_number: string | null
          total_quantity: number | null
        }
        Relationships: []
      }
      project_revenue_rollup: {
        Row: {
          billed_ticket_count: number | null
          customer_id: string | null
          customer_name: string | null
          gross_margin: number | null
          margin_percentage: number | null
          prj_billed_amount: number | null
          project_id: string | null
          project_name: string | null
          project_number: string | null
          project_status: Database["public"]["Enums"]["project_status"] | null
          ready_to_invoice_count: number | null
          svc_billed_amount: number | null
          ticket_count: number | null
          total_billed_amount: number | null
          total_labor_cost: number | null
          total_labor_hours: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      serialized_parts_available_stock: {
        Row: {
          assigned_technician: string | null
          assigned_to_user_id: string | null
          category: string | null
          current_location_id: string | null
          id: string | null
          is_mobile: boolean | null
          location_code: string | null
          location_name: string | null
          location_type:
            | Database["public"]["Enums"]["stock_location_type"]
            | null
          manufacture_date: string | null
          notes: string | null
          part_id: string | null
          part_manufacturer: string | null
          part_name: string | null
          part_number: string | null
          po_line_id: string | null
          purchase_date: string | null
          received_date: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["serialized_part_status"] | null
          unit_cost: number | null
          unit_price: number | null
          vendor_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "serialized_parts_current_location_id_fkey"
            columns: ["current_location_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "serialized_parts_current_location_id_fkey"
            columns: ["current_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_current_location_id_fkey"
            columns: ["current_location_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inventory_with_serials"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "serialized_parts_current_location_id_fkey"
            columns: ["current_location_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_po_line_id_fkey"
            columns: ["po_line_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_1099_report"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "serialized_parts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_aging"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "serialized_parts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_vendor_lead_time_metrics"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "stock_locations_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_locations_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "stock_locations_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "stock_locations_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      serialized_parts_installed: {
        Row: {
          category: string | null
          city: string | null
          customer_name: string | null
          equipment_manufacturer: string | null
          equipment_model: string | null
          equipment_serial: string | null
          equipment_type: string | null
          id: string | null
          installation_date: string | null
          installed_at_site_id: string | null
          installed_by: string | null
          installed_by_name: string | null
          installed_on_equipment_id: string | null
          installed_on_ticket_id: string | null
          part_id: string | null
          part_manufacturer: string | null
          part_name: string | null
          part_number: string | null
          serial_number: string | null
          site_address: string | null
          state: string | null
          status: Database["public"]["Enums"]["serialized_part_status"] | null
          ticket_number: string | null
          ticket_title: string | null
          unit_cost: number | null
          warranty_end: string | null
          warranty_start: string | null
          warranty_status: Database["public"]["Enums"]["warranty_status"] | null
          warranty_status_computed: string | null
          warranty_type: Database["public"]["Enums"]["warranty_type"] | null
          zip_code: string | null
        }
        Relationships: [
          {
            foreignKeyName: "serialized_parts_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_equipment_id_fkey"
            columns: ["installed_on_equipment_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_equipment_id_fkey"
            columns: ["installed_on_equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_equipment_id_fkey"
            columns: ["installed_on_equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_equipment_id_fkey"
            columns: ["installed_on_equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_with_installed_parts"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_equipment_id_fkey"
            columns: ["installed_on_equipment_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_ticket_id_fkey"
            columns: ["installed_on_ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_revenue_summary: {
        Row: {
          billable: boolean | null
          billed_amount: number | null
          billed_at: string | null
          completed_at: string | null
          customer_id: string | null
          days_from_ready_to_billed: number | null
          days_to_bill: number | null
          gross_margin: number | null
          invoice_count: number | null
          invoice_numbers: string | null
          labor_revenue: number | null
          parts_revenue: number | null
          project_id: string | null
          ready_to_invoice_at: string | null
          service_revenue: number | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          ticket_id: string | null
          ticket_number: string | null
          ticket_type: Database["public"]["Enums"]["ticket_type"] | null
          title: string | null
          total_labor_cost: number | null
          total_labor_hours: number | null
          travel_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
        ]
      }
      tickets_ready_to_invoice: {
        Row: {
          assigned_technician: string | null
          completed_at: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          days_since_completion: number | null
          days_waiting_to_invoice: number | null
          description: string | null
          id: string | null
          project_id: string | null
          ready_to_invoice_at: string | null
          site_id: string | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          technician_email: string | null
          ticket_number: string | null
          ticket_type: Database["public"]["Enums"]["ticket_type"] | null
          time_log_count: number | null
          title: string | null
          total_hours: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
          {
            foreignKeyName: "tickets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "customer_location_summary"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "tickets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "customer_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "tickets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "tickets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["location_id"]
          },
        ]
      }
      v_contract_pricing_lookup: {
        Row: {
          contract_category: string | null
          contract_end_date: string | null
          contract_number: string | null
          contract_price: number | null
          contract_start_date: string | null
          contract_status: string | null
          discount_percent: number | null
          effective_end_date: string | null
          effective_start_date: string | null
          end_quantity_break: number | null
          is_core_item: boolean | null
          item_id: string | null
          lead_time_days_override: number | null
          part_category: string | null
          part_id: string | null
          part_name: string | null
          part_number: string | null
          price_type: Database["public"]["Enums"]["contract_price_type"] | null
          pricing_basis: Database["public"]["Enums"]["pricing_basis"] | null
          start_quantity_break: number | null
          vendor_contract_id: string | null
          vendor_id: string | null
          vendor_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_contract_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "vendor_contract_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "vendor_contract_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contract_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "vendor_contract_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contract_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "vendor_contract_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contract_items_vendor_contract_id_fkey"
            columns: ["vendor_contract_id"]
            isOneToOne: false
            referencedRelation: "v_vendor_contracts_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contract_items_vendor_contract_id_fkey"
            columns: ["vendor_contract_id"]
            isOneToOne: false
            referencedRelation: "vendor_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_1099_report"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "vendor_contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_aging"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "vendor_contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_vendor_lead_time_metrics"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      v_master_project_rollup: {
        Row: {
          contract_value_total: number | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          end_date: string | null
          gross_margin_percent: number | null
          manager_id: string | null
          manager_name: string | null
          master_project_id: string | null
          percent_complete_units: number | null
          project_name: string | null
          project_number: string | null
          sites_completed: number | null
          sites_in_progress: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          total_billed: number | null
          total_cost: number | null
          total_deposits: number | null
          total_deposits_unreleased: number | null
          total_gross_profit: number | null
          total_revenue_recognized: number | null
          total_site_contract_value: number | null
          total_sites: number | null
          total_unbilled: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "projects_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "projects_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      v_project_financial_summary: {
        Row: {
          billed_to_date: number | null
          completed_milestones: number | null
          contract_value: number | null
          contract_value_site: number | null
          contract_value_total: number | null
          cost_to_date: number | null
          created_at: string | null
          customer_id: string | null
          deposits_billed: number | null
          deposits_unreleased: number | null
          end_date: string | null
          gross_margin_percent: number | null
          gross_profit: number | null
          is_master_project: boolean | null
          parent_project_id: string | null
          project_id: string | null
          project_name: string | null
          project_number: string | null
          project_status: Database["public"]["Enums"]["project_status"] | null
          revenue_recognized: number | null
          site_name: string | null
          start_date: string | null
          total_milestones: number | null
          unbilled_amount: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_parent_project_id_fkey"
            columns: ["parent_project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "projects_parent_project_id_fkey"
            columns: ["parent_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_parent_project_id_fkey"
            columns: ["parent_project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "projects_parent_project_id_fkey"
            columns: ["parent_project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "projects_parent_project_id_fkey"
            columns: ["parent_project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
        ]
      }
      v_site_jobs_summary: {
        Row: {
          billed_to_date: number | null
          completed_milestones: number | null
          contract_value: number | null
          cost_to_date: number | null
          created_at: string | null
          customer_id: string | null
          deposits_billed: number | null
          deposits_unreleased: number | null
          end_date: string | null
          gross_margin_percent: number | null
          gross_profit: number | null
          master_project_id: string | null
          master_project_name: string | null
          master_project_number: string | null
          milestone_completion_percent: number | null
          revenue_recognized: number | null
          sequence_number: number | null
          site_address: string | null
          site_job_id: string | null
          site_name: string | null
          site_project_name: string | null
          site_project_number: string | null
          site_status: Database["public"]["Enums"]["project_status"] | null
          start_date: string | null
          total_milestones: number | null
          unbilled_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_parent_project_id_fkey"
            columns: ["master_project_id"]
            isOneToOne: false
            referencedRelation: "project_revenue_rollup"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "projects_parent_project_id_fkey"
            columns: ["master_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_parent_project_id_fkey"
            columns: ["master_project_id"]
            isOneToOne: false
            referencedRelation: "v_master_project_rollup"
            referencedColumns: ["master_project_id"]
          },
          {
            foreignKeyName: "projects_parent_project_id_fkey"
            columns: ["master_project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "projects_parent_project_id_fkey"
            columns: ["master_project_id"]
            isOneToOne: false
            referencedRelation: "v_site_jobs_summary"
            referencedColumns: ["site_job_id"]
          },
        ]
      }
      v_vendor_contracts_summary: {
        Row: {
          auto_renew: boolean | null
          contract_number: string | null
          contract_type: string | null
          contract_value: number | null
          created_at: string | null
          days_until_expiration: number | null
          document_count: number | null
          document_name: string | null
          document_url: string | null
          end_date: string | null
          freight_terms: string | null
          id: string | null
          is_preferred_vendor: boolean | null
          item_count: number | null
          minimum_order_value: number | null
          notes: string | null
          payment_terms: string | null
          renewal_term_months: number | null
          sla_count: number | null
          standard_lead_time_days: number | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          vendor_code: string | null
          vendor_id: string | null
          vendor_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_1099_report"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "vendor_contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_aging"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "vendor_contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_vendor_lead_time_metrics"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      vehicle_inventory_with_serials: {
        Row: {
          assigned_to_user_id: string | null
          category: string | null
          is_serialized: boolean | null
          location_code: string | null
          location_id: string | null
          manufacturer: string | null
          non_serialized_quantity: number | null
          part_id: string | null
          part_name: string | null
          part_number: string | null
          serialized_items: Json | null
          technician_id: string | null
          technician_name: string | null
          unit_cost: number | null
          vehicle_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "part_inventory_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_inventory_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_inventory_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_inventory_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_inventory_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_inventory_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_inventory_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_locations_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_locations_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "stock_locations_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "stock_locations_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "stock_locations_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_locations_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "stock_locations_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "stock_locations_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      vw_1099_report: {
        Row: {
          address: string | null
          box_type: string | null
          city: string | null
          payment_count: number | null
          postal_code: string | null
          state: string | null
          tax_id_number: string | null
          tax_year: number | null
          total_paid: number | null
          vendor_id: string | null
          vendor_name: string | null
        }
        Relationships: []
      }
      vw_accounting_period_status: {
        Row: {
          end_date: string | null
          entry_count: number | null
          fiscal_period: number | null
          fiscal_year: number | null
          id: string | null
          locked_at: string | null
          locked_by_name: string | null
          locked_reason: string | null
          name: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["period_status"] | null
          total_credits: number | null
          total_debits: number | null
        }
        Relationships: []
      }
      vw_active_technicians: {
        Row: {
          clock_in_time: string | null
          current_ticket_id: string | null
          current_ticket_number: string | null
          email: string | null
          full_name: string | null
          tech_user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_logs_user_id_fkey"
            columns: ["tech_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_user_id_fkey"
            columns: ["tech_user_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "time_logs_user_id_fkey"
            columns: ["tech_user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "time_logs_user_id_fkey"
            columns: ["tech_user_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      vw_admin_profile_diagnostics: {
        Row: {
          assigned_vehicle_name: string | null
          assigned_vehicle_type:
            | Database["public"]["Enums"]["stock_location_type"]
            | null
          created_at: string | null
          default_vehicle_id: string | null
          email: string | null
          full_name: string | null
          has_auth_user: boolean | null
          is_active: boolean | null
          profile_id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_vehicle_id_fkey"
            columns: ["default_vehicle_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "profiles_default_vehicle_id_fkey"
            columns: ["default_vehicle_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_default_vehicle_id_fkey"
            columns: ["default_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inventory_with_serials"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "profiles_default_vehicle_id_fkey"
            columns: ["default_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["location_id"]
          },
        ]
      }
      vw_ap_aging: {
        Row: {
          bill_count: number | null
          current_amount: number | null
          days_1_30: number | null
          days_31_60: number | null
          days_61_90: number | null
          days_over_90: number | null
          total_balance: number | null
          vendor_code: string | null
          vendor_id: string | null
          vendor_name: string | null
        }
        Relationships: []
      }
      vw_ap_bill_balances: {
        Row: {
          amount_paid: number | null
          bill_date: string | null
          bill_id: string | null
          bill_number: string | null
          bill_total: number | null
          category: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          gl_posted: boolean | null
          is_overdue: boolean | null
          open_balance: number | null
          status: string | null
          updated_at: string | null
          vendor_id: string | null
          vendor_name: string | null
        }
        Relationships: []
      }
      vw_customer_timeline: {
        Row: {
          created_by_name: string | null
          customer_id: string | null
          customer_name: string | null
          event_date: string | null
          event_description: string | null
          event_id: string | null
          event_subtype: string | null
          event_title: string | null
          event_type: string | null
        }
        Relationships: []
      }
      vw_dashboard_hold_metrics: {
        Row: {
          awaiting_parts_count: number | null
          in_progress_active_count: number | null
          issue_reports_by_severity: Json | null
          issues_reported_count: number | null
          open_issue_reports_count: number | null
          open_parts_requests_count: number | null
          parts_requests_by_urgency: Json | null
        }
        Relationships: []
      }
      vw_equipment_installed_parts: {
        Row: {
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          equipment_id: string | null
          equipment_location_notes: string | null
          from_location_id: string | null
          from_location_name: string | null
          installation_date: string | null
          installation_id: string | null
          installation_notes: string | null
          installed_by: string | null
          installed_by_email: string | null
          installed_by_name: string | null
          is_serialized: boolean | null
          manufacture_date: string | null
          part_category: string | null
          part_description: string | null
          part_id: string | null
          part_manufacturer: string | null
          part_name: string | null
          part_number: string | null
          quantity: number | null
          serial_number: string | null
          serial_unit_cost: number | null
          serial_vendor_id: string | null
          serialized_part_id: string | null
          ticket_id: string | null
          ticket_number: string | null
          ticket_title: string | null
          updated_at: string | null
          warranty_end_date: string | null
          warranty_months: number | null
          warranty_start_date: string | null
          warranty_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "part_installations_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "part_installations_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inventory_with_serials"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "part_installations_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "part_installations_installed_at_site_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "part_installations_installed_at_site_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "part_installations_installed_at_site_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_installed_at_site_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "part_installations_installed_at_site_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_installed_at_site_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "part_installations_installed_at_site_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "part_installations_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "part_installations_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "part_installations_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "part_installations_installed_on_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "part_installations_installed_on_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_installed_on_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "part_installations_installed_on_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_with_installed_parts"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "part_installations_installed_on_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "part_installations_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_installations_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_installations_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_installations_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_installations_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "equipment_with_installed_parts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_installations_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "serialized_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "serialized_parts_available_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "serialized_parts_installed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["serialized_part_id"]
          },
          {
            foreignKeyName: "part_installations_serialized_part_id_fkey"
            columns: ["serialized_part_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "part_installations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "serialized_parts_vendor_id_fkey"
            columns: ["serial_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_vendor_id_fkey"
            columns: ["serial_vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_1099_report"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "serialized_parts_vendor_id_fkey"
            columns: ["serial_vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_aging"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "serialized_parts_vendor_id_fkey"
            columns: ["serial_vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_vendor_lead_time_metrics"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      vw_equipment_reliability: {
        Row: {
          avg_days_between_failures: number | null
          callbacks_within_30_days: number | null
          equipment_type: string | null
          manufacturer: string | null
          max_days_between: number | null
          min_days_between: number | null
          model_number: string | null
          total_service_calls: number | null
          unit_count: number | null
        }
        Relationships: []
      }
      vw_estimate_margin: {
        Row: {
          estimate_id: string | null
          estimate_number: string | null
          gross_margin: number | null
          margin_percent: number | null
          revenue: number | null
          status: Database["public"]["Enums"]["estimate_status"] | null
          total_cost: number | null
        }
        Relationships: []
      }
      vw_leads_inbox: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string | null
          estimate_count: number | null
          id: string | null
          interaction_count: number | null
          last_interaction: string | null
          lead_source: string | null
          name: string | null
          pending_estimate_value: number | null
          phone: string | null
          state: string | null
        }
        Relationships: []
      }
      vw_part_cost_current: {
        Row: {
          as_of: string | null
          part_id: string | null
          part_name: string | null
          part_number: string | null
          source: string | null
          unit_cost: number | null
        }
        Relationships: []
      }
      vw_parts: {
        Row: {
          asset_tag: string | null
          category: string | null
          created_at: string | null
          default_warranty_months: number | null
          description: string | null
          id: string | null
          is_returnable: boolean | null
          is_serialized: boolean | null
          item_type: string | null
          location: string | null
          manufacturer: string | null
          name: string | null
          part_number: string | null
          preferred_vendor_id: string | null
          quantity_on_hand: number | null
          reorder_level: number | null
          reorder_point: number | null
          reorder_quantity: number | null
          tool_category: string | null
          total_on_hand: number | null
          unit_price: number | null
          updated_at: string | null
          vendor_part_number: string | null
          warranty_period_months: number | null
        }
        Insert: {
          asset_tag?: string | null
          category?: string | null
          created_at?: string | null
          default_warranty_months?: number | null
          description?: string | null
          id?: string | null
          is_returnable?: boolean | null
          is_serialized?: boolean | null
          item_type?: string | null
          location?: string | null
          manufacturer?: string | null
          name?: string | null
          part_number?: string | null
          preferred_vendor_id?: string | null
          quantity_on_hand?: number | null
          reorder_level?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          tool_category?: string | null
          total_on_hand?: never
          unit_price?: number | null
          updated_at?: string | null
          vendor_part_number?: string | null
          warranty_period_months?: number | null
        }
        Update: {
          asset_tag?: string | null
          category?: string | null
          created_at?: string | null
          default_warranty_months?: number | null
          description?: string | null
          id?: string | null
          is_returnable?: boolean | null
          is_serialized?: boolean | null
          item_type?: string | null
          location?: string | null
          manufacturer?: string | null
          name?: string | null
          part_number?: string | null
          preferred_vendor_id?: string | null
          quantity_on_hand?: number | null
          reorder_level?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          tool_category?: string | null
          total_on_hand?: never
          unit_price?: number | null
          updated_at?: string | null
          vendor_part_number?: string | null
          warranty_period_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_preferred_vendor_id_fkey"
            columns: ["preferred_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_preferred_vendor_id_fkey"
            columns: ["preferred_vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_1099_report"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "parts_preferred_vendor_id_fkey"
            columns: ["preferred_vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_aging"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "parts_preferred_vendor_id_fkey"
            columns: ["preferred_vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_vendor_lead_time_metrics"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      vw_parts_ready_for_pickup: {
        Row: {
          assigned_tech_name: string | null
          assigned_to: string | null
          created_at: string | null
          customer_name: string | null
          items: Json | null
          pick_list_id: string | null
          pick_list_status: string | null
          picked_items: number | null
          scheduled_date: string | null
          ticket_id: string | null
          ticket_number: string | null
          ticket_title: string | null
          total_items: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_pick_lists_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      vw_parts_request_queue: {
        Row: {
          customer_name: string | null
          customer_phone: string | null
          days_waiting: number | null
          parts_count: number | null
          parts_requested: Json | null
          po_id: string | null
          po_number: string | null
          request_id: string | null
          request_notes: string | null
          request_status: string | null
          requested_at: string | null
          requested_by: string | null
          requested_by_name: string | null
          ticket_id: string | null
          ticket_number: string | null
          ticket_priority: Database["public"]["Enums"]["ticket_priority"] | null
          ticket_title: string | null
          total_quantity_requested: number | null
          urgency: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_parts_requests_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      vw_parts_usage_compat: {
        Row: {
          created_at: string | null
          id: string | null
          part_id: string | null
          quantity_used: number | null
          recorded_by: string | null
          ticket_id: string | null
          unit_cost: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          quantity_used?: number | null
          recorded_by?: never
          ticket_id?: string | null
          unit_cost?: never
        }
        Update: {
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          quantity_used?: number | null
          recorded_by?: never
          ticket_id?: string | null
          unit_cost?: never
        }
        Relationships: [
          {
            foreignKeyName: "ticket_parts_used_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_used_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_used_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["installation_ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_revenue_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ready_to_invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["callback_ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_rework_analysis"
            referencedColumns: ["original_ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_opportunities"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_scheduled_tickets_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_ticket_onsite_progress"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_in_progress_active"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_issue"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_parts_used_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vw_tickets_on_hold_parts"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      vw_problem_pareto: {
        Row: {
          avg_ticket_value: number | null
          category: string | null
          code: string | null
          cumulative_count: number | null
          cumulative_percentage: number | null
          label: string | null
          percentage_of_total: number | null
          severity: number | null
          ticket_count: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      vw_procurement_metrics: {
        Row: {
          avg_days_to_fulfill: number | null
          ordered_requests: number | null
          pending_requests: number | null
          received_this_week: number | null
          requests_by_urgency: Json | null
          sla_breaches: number | null
        }
        Relationships: []
      }
      vw_reorder_alerts: {
        Row: {
          available: number | null
          avg_daily_usage: number | null
          below_reorder_point: boolean | null
          category: string | null
          description: string | null
          has_reorder_policy: boolean | null
          inbound_open_po: number | null
          inventory_value: number | null
          is_stockout: boolean | null
          lead_days: number | null
          location_id: string | null
          location_name: string | null
          location_type:
            | Database["public"]["Enums"]["stock_location_type"]
            | null
          max_qty: number | null
          min_qty: number | null
          moq: number | null
          on_hand: number | null
          pack_qty: number | null
          part_id: string | null
          part_number: string | null
          reorder_method: string | null
          reorder_point: number | null
          reserved: number | null
          safety_stock: number | null
          suggested_order_qty: number | null
          unit_cost: number | null
          vendor_id: string | null
          vendor_name: string | null
          vendor_part_number: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_part_mappings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_part_mappings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_1099_report"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "vendor_part_mappings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_aging"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "vendor_part_mappings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_vendor_lead_time_metrics"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      vw_resolution_pareto: {
        Row: {
          avg_ticket_value: number | null
          category: string | null
          code: string | null
          label: string | null
          percentage_of_total: number | null
          ticket_count: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      vw_rework_analysis: {
        Row: {
          callback_date: string | null
          callback_problem: string | null
          callback_ticket: string | null
          callback_ticket_id: string | null
          customer_id: string | null
          customer_name: string | null
          days_between: number | null
          equipment_id: string | null
          equipment_manufacturer: string | null
          equipment_model: string | null
          original_completed: string | null
          original_problem: string | null
          original_resolution: string | null
          original_ticket: string | null
          original_ticket_id: string | null
          technician_id: string | null
          technician_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "tickets_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "tickets_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_with_installed_parts"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "tickets_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "tickets_problem_code_fkey"
            columns: ["original_problem"]
            isOneToOne: false
            referencedRelation: "standard_codes"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tickets_problem_code_fkey"
            columns: ["callback_problem"]
            isOneToOne: false
            referencedRelation: "standard_codes"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tickets_problem_code_fkey"
            columns: ["original_problem"]
            isOneToOne: false
            referencedRelation: "vw_problem_pareto"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tickets_problem_code_fkey"
            columns: ["callback_problem"]
            isOneToOne: false
            referencedRelation: "vw_problem_pareto"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tickets_problem_code_fkey"
            columns: ["original_problem"]
            isOneToOne: false
            referencedRelation: "vw_resolution_pareto"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tickets_problem_code_fkey"
            columns: ["callback_problem"]
            isOneToOne: false
            referencedRelation: "vw_resolution_pareto"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tickets_resolution_code_fkey"
            columns: ["original_resolution"]
            isOneToOne: false
            referencedRelation: "standard_codes"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tickets_resolution_code_fkey"
            columns: ["original_resolution"]
            isOneToOne: false
            referencedRelation: "vw_problem_pareto"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tickets_resolution_code_fkey"
            columns: ["original_resolution"]
            isOneToOne: false
            referencedRelation: "vw_resolution_pareto"
            referencedColumns: ["code"]
          },
        ]
      }
      vw_sales_opportunities: {
        Row: {
          completed_at: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          equipment_age_years: number | null
          equipment_install_date: string | null
          equipment_manufacturer: string | null
          equipment_model: string | null
          problem_code: string | null
          problem_label: string | null
          resolution_code: string | null
          resolution_label: string | null
          technician_id: string | null
          technician_name: string | null
          ticket_id: string | null
          ticket_number: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_problem_code_fkey"
            columns: ["problem_code"]
            isOneToOne: false
            referencedRelation: "standard_codes"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tickets_problem_code_fkey"
            columns: ["problem_code"]
            isOneToOne: false
            referencedRelation: "vw_problem_pareto"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tickets_problem_code_fkey"
            columns: ["problem_code"]
            isOneToOne: false
            referencedRelation: "vw_resolution_pareto"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tickets_resolution_code_fkey"
            columns: ["resolution_code"]
            isOneToOne: false
            referencedRelation: "standard_codes"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tickets_resolution_code_fkey"
            columns: ["resolution_code"]
            isOneToOne: false
            referencedRelation: "vw_problem_pareto"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tickets_resolution_code_fkey"
            columns: ["resolution_code"]
            isOneToOne: false
            referencedRelation: "vw_resolution_pareto"
            referencedColumns: ["code"]
          },
        ]
      }
      vw_sales_pipeline: {
        Row: {
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          days_in_stage: number | null
          deal_stage_id: string | null
          estimate_id: string | null
          estimate_number: string | null
          expected_close_date: string | null
          pipeline_name: string | null
          probability: number | null
          stage_entered_at: string | null
          stage_name: string | null
          stage_order: number | null
          status: Database["public"]["Enums"]["estimate_status"] | null
          title: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_deal_stage_id_fkey"
            columns: ["deal_stage_id"]
            isOneToOne: false
            referencedRelation: "deal_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_sales_tax_liability: {
        Row: {
          agency_name: string | null
          amount_due: number | null
          amount_remitted: number | null
          jurisdiction: string | null
          jurisdiction_id: string | null
          period_end: string | null
          period_start: string | null
          state_code: string | null
          tax_collected: number | null
          taxable_sales: number | null
          transaction_count: number | null
        }
        Relationships: []
      }
      vw_scheduled_tickets_today: {
        Row: {
          assigned_to: string | null
          customer_name: string | null
          id: string | null
          priority: Database["public"]["Enums"]["ticket_priority"] | null
          scheduled_date: string | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          technician_name: string | null
          ticket_number: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      vw_technician_quality: {
        Row: {
          avg_ticket_value: number | null
          callback_count: number | null
          callback_rate: number | null
          completed_tickets: number | null
          technician_id: string | null
          technician_name: string | null
          temp_fix_rate: number | null
          temp_fixes: number | null
          total_billed: number | null
          total_tickets: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      vw_technician_truck_inventory: {
        Row: {
          default_vehicle_id: string | null
          part_id: string | null
          part_name: string | null
          part_number: string | null
          qty_on_hand: number | null
          technician_id: string | null
          technician_name: string | null
          unit_price: number | null
          vehicle_code: string | null
          vehicle_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "part_inventory_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_inventory_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_inventory_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_inventory_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_inventory_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_inventory_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_inventory_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_default_vehicle_id_fkey"
            columns: ["default_vehicle_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "profiles_default_vehicle_id_fkey"
            columns: ["default_vehicle_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_default_vehicle_id_fkey"
            columns: ["default_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inventory_with_serials"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "profiles_default_vehicle_id_fkey"
            columns: ["default_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["location_id"]
          },
        ]
      }
      vw_technician_truck_serialized: {
        Row: {
          default_vehicle_id: string | null
          part_id: string | null
          part_name: string | null
          part_number: string | null
          serial_number: string | null
          serialized_part_id: string | null
          status: Database["public"]["Enums"]["serialized_part_status"] | null
          technician_id: string | null
          technician_name: string | null
          unit_price: number | null
          vehicle_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_vehicle_id_fkey"
            columns: ["default_vehicle_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "profiles_default_vehicle_id_fkey"
            columns: ["default_vehicle_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_default_vehicle_id_fkey"
            columns: ["default_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inventory_with_serials"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "profiles_default_vehicle_id_fkey"
            columns: ["default_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_ticket_onsite_progress: {
        Row: {
          arrived_onsite_at: string | null
          assigned_to: string | null
          elapsed_minutes: number | null
          estimated_onsite_minutes: number | null
          is_overrun: boolean | null
          percent: number | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          ticket_id: string | null
          ticket_number: string | null
        }
        Insert: {
          arrived_onsite_at?: string | null
          assigned_to?: string | null
          elapsed_minutes?: never
          estimated_onsite_minutes?: never
          is_overrun?: never
          percent?: never
          status?: Database["public"]["Enums"]["ticket_status"] | null
          ticket_id?: string | null
          ticket_number?: string | null
        }
        Update: {
          arrived_onsite_at?: string | null
          assigned_to?: string | null
          elapsed_minutes?: never
          estimated_onsite_minutes?: never
          is_overrun?: never
          percent?: never
          status?: Database["public"]["Enums"]["ticket_status"] | null
          ticket_id?: string | null
          ticket_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      vw_ticket_policies: {
        Row: {
          operation: string | null
          permissive: string | null
          policy_name: unknown
          roles: unknown[] | null
          using_expression: string | null
          with_check: string | null
        }
        Relationships: []
      }
      vw_tickets_in_progress_active: {
        Row: {
          assigned_to: string | null
          assigned_to_name: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          has_active_timer: boolean | null
          scheduled_date: string | null
          ticket_id: string | null
          ticket_number: string | null
          ticket_status: Database["public"]["Enums"]["ticket_status"] | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      vw_tickets_on_hold_issue: {
        Row: {
          assigned_to: string | null
          assigned_to_name: string | null
          customer_id: string | null
          customer_name: string | null
          hold_created_by: string | null
          hold_created_by_name: string | null
          hold_id: string | null
          hold_started_at: string | null
          hold_summary: string | null
          issue_category: string | null
          issue_description: string | null
          issue_report_id: string | null
          issue_severity: string | null
          issue_status: string | null
          ticket_id: string | null
          ticket_number: string | null
          ticket_status: Database["public"]["Enums"]["ticket_status"] | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      vw_tickets_on_hold_parts: {
        Row: {
          assigned_to: string | null
          assigned_to_name: string | null
          customer_id: string | null
          customer_name: string | null
          hold_created_by: string | null
          hold_created_by_name: string | null
          hold_id: string | null
          hold_started_at: string | null
          hold_summary: string | null
          parts_count: number | null
          parts_request_id: string | null
          request_notes: string | null
          request_status: string | null
          request_urgency: string | null
          ticket_id: string | null
          ticket_number: string | null
          ticket_status: Database["public"]["Enums"]["ticket_status"] | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_admin_profile_diagnostics"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_inventory"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "vw_technician_truck_serialized"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      vw_tools: {
        Row: {
          asset_tag: string | null
          category: string | null
          created_at: string | null
          default_warranty_months: number | null
          description: string | null
          id: string | null
          is_returnable: boolean | null
          is_serialized: boolean | null
          item_type: string | null
          location: string | null
          manufacturer: string | null
          name: string | null
          part_number: string | null
          preferred_vendor_id: string | null
          quantity_on_hand: number | null
          reorder_level: number | null
          reorder_point: number | null
          reorder_quantity: number | null
          tool_category: string | null
          total_on_hand: number | null
          unit_price: number | null
          updated_at: string | null
          vendor_part_number: string | null
          warranty_period_months: number | null
        }
        Insert: {
          asset_tag?: string | null
          category?: string | null
          created_at?: string | null
          default_warranty_months?: number | null
          description?: string | null
          id?: string | null
          is_returnable?: boolean | null
          is_serialized?: boolean | null
          item_type?: string | null
          location?: string | null
          manufacturer?: string | null
          name?: string | null
          part_number?: string | null
          preferred_vendor_id?: string | null
          quantity_on_hand?: number | null
          reorder_level?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          tool_category?: string | null
          total_on_hand?: never
          unit_price?: number | null
          updated_at?: string | null
          vendor_part_number?: string | null
          warranty_period_months?: number | null
        }
        Update: {
          asset_tag?: string | null
          category?: string | null
          created_at?: string | null
          default_warranty_months?: number | null
          description?: string | null
          id?: string | null
          is_returnable?: boolean | null
          is_serialized?: boolean | null
          item_type?: string | null
          location?: string | null
          manufacturer?: string | null
          name?: string | null
          part_number?: string | null
          preferred_vendor_id?: string | null
          quantity_on_hand?: number | null
          reorder_level?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          tool_category?: string | null
          total_on_hand?: never
          unit_price?: number | null
          updated_at?: string | null
          vendor_part_number?: string | null
          warranty_period_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_preferred_vendor_id_fkey"
            columns: ["preferred_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_preferred_vendor_id_fkey"
            columns: ["preferred_vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_1099_report"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "parts_preferred_vendor_id_fkey"
            columns: ["preferred_vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_aging"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "parts_preferred_vendor_id_fkey"
            columns: ["preferred_vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_vendor_lead_time_metrics"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      vw_trial_balance: {
        Row: {
          account_code: string | null
          account_id: string | null
          account_name: string | null
          account_subtype: string | null
          account_type: Database["public"]["Enums"]["account_type"] | null
          balance: number | null
          total_credits: number | null
          total_debits: number | null
        }
        Relationships: []
      }
      vw_vendor_ap_kpis: {
        Row: {
          bill_count: number | null
          overdue_balance: number | null
          overdue_bill_count: number | null
          paid_bill_count: number | null
          pending_balance: number | null
          total_paid: number | null
          vendor_id: string | null
          vendor_name: string | null
        }
        Relationships: []
      }
      vw_vendor_catalog_items: {
        Row: {
          catalog_item_id: string | null
          created_at: string | null
          is_discontinued: boolean | null
          is_preferred_vendor: boolean | null
          last_cost: number | null
          last_purchase_date: string | null
          lead_time_days: number | null
          moq: number | null
          notes: string | null
          pack_qty: number | null
          part_category: string | null
          part_description: string | null
          part_id: string | null
          part_number: string | null
          standard_cost: number | null
          uom: string | null
          updated_at: string | null
          vendor_code: string | null
          vendor_id: string | null
          vendor_name: string | null
          vendor_part_description: string | null
          vendor_part_number: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_part_mappings_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "vendor_part_mappings_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "vendor_part_mappings_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_part_mappings_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "vendor_part_mappings_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_part_mappings_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "vendor_part_mappings_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_part_mappings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_part_mappings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_1099_report"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "vendor_part_mappings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_aging"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "vendor_part_mappings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_vendor_lead_time_metrics"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      vw_vendor_lead_time_metrics: {
        Row: {
          avg_days_variance: number | null
          avg_lead_days: number | null
          earliest_order_date: string | null
          fill_rate_pct: number | null
          latest_receipt_date: string | null
          max_lead_days: number | null
          median_lead_days: number | null
          min_lead_days: number | null
          on_time_pct: number | null
          p90_lead_days: number | null
          received_po_lines: number | null
          stddev_lead_days: number | null
          total_po_lines: number | null
          vendor_code: string | null
          vendor_id: string | null
          vendor_name: string | null
        }
        Relationships: []
      }
      vw_vendor_payment_history: {
        Row: {
          amount: number | null
          category: string | null
          created_at: string | null
          description: string | null
          document_date: string | null
          document_id: string | null
          document_number: string | null
          document_type: string | null
          due_date: string | null
          is_overdue: boolean | null
          open_balance: number | null
          payment_method: string | null
          reference: string | null
          status: string | null
          vendor_id: string | null
          vendor_name: string | null
        }
        Relationships: []
      }
      vw_warranty_tracking: {
        Row: {
          created_at: string | null
          current_location_id: string | null
          customer_id: string | null
          customer_name: string | null
          days_remaining: number | null
          duration_months: number | null
          end_date: string | null
          equipment_id: string | null
          equipment_manufacturer: string | null
          equipment_model: string | null
          equipment_type: string | null
          id: string | null
          installation_date: string | null
          installed_at_site_id: string | null
          installed_on_equipment_id: string | null
          location_address: string | null
          location_id: string | null
          location_name: string | null
          notes: string | null
          part_id: string | null
          part_name: string | null
          part_number: string | null
          part_warranty_months: number | null
          received_date: string | null
          serial_number: string | null
          serialized_part_status:
            | Database["public"]["Enums"]["serialized_part_status"]
            | null
          start_date: string | null
          stock_location_name: string | null
          stock_location_type:
            | Database["public"]["Enums"]["stock_location_type"]
            | null
          updated_at: string | null
          vendor_id: string | null
          vendor_name: string | null
          warranty_provider: string | null
          warranty_status: string | null
          warranty_type: Database["public"]["Enums"]["warranty_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "serialized_parts_current_location_id_fkey"
            columns: ["current_location_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "serialized_parts_current_location_id_fkey"
            columns: ["current_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_current_location_id_fkey"
            columns: ["current_location_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inventory_with_serials"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "serialized_parts_current_location_id_fkey"
            columns: ["current_location_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "customer_revenue_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "vw_leads_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "vw_sales_pipeline"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_at_site_id_fkey"
            columns: ["installed_at_site_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_equipment_id_fkey"
            columns: ["installed_on_equipment_id"]
            isOneToOne: false
            referencedRelation: "customer_service_history"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_equipment_id_fkey"
            columns: ["installed_on_equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_equipment_id_fkey"
            columns: ["installed_on_equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_installation_history"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_equipment_id_fkey"
            columns: ["installed_on_equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_with_installed_parts"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "serialized_parts_installed_on_equipment_id_fkey"
            columns: ["installed_on_equipment_id"]
            isOneToOne: false
            referencedRelation: "vw_warranty_tracking"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_details"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "part_inventory_summary"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_part_cost_current"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_reorder_alerts"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "serialized_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "vw_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_parts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_1099_report"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "serialized_parts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_ap_aging"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "serialized_parts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vw_vendor_lead_time_metrics"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
    }
    Functions: {
      add_audit_columns: { Args: { target_table: string }; Returns: undefined }
      admin_update_user_password: {
        Args: { new_password: string; target_user_id: string }
        Returns: Json
      }
      auth_has_role: { Args: { required_roles: string[] }; Returns: boolean }
      auth_is_active: { Args: never; Returns: boolean }
      auth_is_admin: { Args: never; Returns: boolean }
      auth_is_admin_or_dispatcher: { Args: never; Returns: boolean }
      auto_match_bank_lines: {
        Args: { p_reconciliation_id: string }
        Returns: {
          bank_line_id: string
          gl_entry_id: string
          match_confidence: number
        }[]
      }
      backfill_invoice_gl_entries: {
        Args: { dry_run?: boolean }
        Returns: {
          posted_result: Json
          record_id: string
          record_number: string
          record_type: string
          status: string
        }[]
      }
      backfill_part_installations_from_serialized: {
        Args: never
        Returns: Json
      }
      calculate_cleared_balance: {
        Args: { p_reconciliation_id: string }
        Returns: number
      }
      calculate_estimate_totals: {
        Args: { est_id: string }
        Returns: undefined
      }
      calculate_milestone_amount: {
        Args: { p_billing_schedule_id: string }
        Returns: number
      }
      calculate_rounded_hours: {
        Args: { hours_decimal: number }
        Returns: number
      }
      calculate_ticket_billed_amount: {
        Args: { p_ticket_id: string }
        Returns: number
      }
      can_rollback_customer: {
        Args: { customer_id_param: string }
        Returns: boolean
      }
      can_rollback_invoice: {
        Args: { invoice_id_param: string }
        Returns: boolean
      }
      cancel_bank_reconciliation: {
        Args: { p_reconciliation_id: string; p_user_id: string }
        Returns: {
          account_id: string
          book_balance: number | null
          calculated_book_balance: number | null
          cancelled_at: string | null
          cancelled_by: string | null
          cleared_balance: number | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          created_by: string | null
          difference: number | null
          id: string
          notes: string | null
          reconciled_by: string | null
          reconciliation_date: string
          rolled_back_at: string | null
          rolled_back_by: string | null
          statement_balance: number | null
          statement_end_date: string | null
          statement_ending_balance: number | null
          statement_start_date: string | null
          status: Database["public"]["Enums"]["reconciliation_status"] | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "bank_reconciliations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      estimate_has_valid_public_link: {
        Args: { estimate_uuid: string }
        Returns: boolean
      }
      fn_add_ahs_diagnosis_fee: {
        Args: { p_ticket_id: string; p_user_id: string }
        Returns: {
          already_exists: boolean
          fee_id: string
          success: boolean
        }[]
      }
      fn_adjust_inventory_canonical: {
        Args: {
          p_location_id: string
          p_part_id: string
          p_quantity_delta: number
          p_unit_cost?: number
        }
        Returns: undefined
      }
      fn_check_technician_setup: { Args: { p_user_id?: string }; Returns: Json }
      fn_consume_material:
        | {
            Args: {
              p_bom_item_id?: string
              p_consumed_by?: string
              p_lot_number?: string
              p_method?: Database["public"]["Enums"]["consumption_method"]
              p_operation_run_id?: string
              p_part_id: string
              p_production_order_id: string
              p_production_step_id?: string
              p_qty: number
              p_serialized_part_id?: string
              p_source_location_id: string
              p_unit_cost?: number
            }
            Returns: string
          }
        | {
            Args: {
              p_bom_item_id?: string
              p_consumed_by?: string
              p_idempotency_key?: string
              p_lot_number?: string
              p_method?: Database["public"]["Enums"]["consumption_method"]
              p_operation_run_id?: string
              p_part_id: string
              p_production_order_id: string
              p_production_step_id?: string
              p_qty: number
              p_serialized_part_id?: string
              p_source_location_id: string
              p_unit_cost?: number
            }
            Returns: string
          }
      fn_convert_estimate_to_project: {
        Args: { p_created_by?: string; p_estimate_id: string }
        Returns: Json
      }
      fn_convert_estimate_to_service_ticket: {
        Args: { p_created_by?: string; p_estimate_id: string }
        Returns: Json
      }
      fn_create_po_from_alert: {
        Args: { p_location_id: string; p_part_id: string; p_quantity?: number }
        Returns: string
      }
      fn_diagnose_ticket_permissions: {
        Args: { p_ticket_id?: string }
        Returns: Json
      }
      fn_end_ticket_work: {
        Args: {
          p_mark_for_revisit?: boolean
          p_tech_id: string
          p_ticket_id?: string
        }
        Returns: Json
      }
      fn_generate_account_number: {
        Args: { p_customer_type: Database["public"]["Enums"]["customer_type"] }
        Returns: string
      }
      fn_generate_reorder_pos: {
        Args: { p_location_id?: string; p_vendor_id?: string }
        Returns: {
          out_line_count: number
          out_po_id: string
          out_po_number: string
          out_total_amount: number
          out_vendor_id: string
          out_vendor_name: string
        }[]
      }
      fn_get_active_timer: { Args: { p_tech_id: string }; Returns: Json }
      fn_get_ahs_billing_breakdown: {
        Args: { p_ticket_id: string }
        Returns: {
          ahs_labor: number
          ahs_parts: number
          ahs_total: number
          customer_labor: number
          customer_parts: number
          customer_total: number
          diagnosis_fee: number
        }[]
      }
      fn_get_items_by_type: {
        Args: { p_item_type: string }
        Returns: {
          asset_tag: string
          category: string
          description: string
          id: string
          is_returnable: boolean
          is_serialized: boolean
          item_type: string
          manufacturer: string
          name: string
          part_number: string
          reorder_level: number
          reorder_point: number
          reorder_quantity: number
          tool_category: string
          total_on_hand: number
          total_value: number
          unit_price: number
        }[]
      }
      fn_get_part_current_cost: {
        Args: { p_part_id: string }
        Returns: {
          as_of: string
          source: string
          unit_cost: number
        }[]
      }
      fn_link_po_to_parts_request: {
        Args: { p_line_mappings: Json; p_po_id: string; p_request_id: string }
        Returns: Json
      }
      fn_pickup_parts_for_ticket: {
        Args: { p_destination_location_id: string; p_ticket_id: string }
        Returns: Json
      }
      fn_record_ahs_authorization: {
        Args: {
          p_covered_amount: number
          p_ticket_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      fn_refresh_estimate_part_costs: {
        Args: { p_estimate_id: string }
        Returns: Json
      }
      fn_resolve_labor_rate: { Args: { context: Json }; Returns: Json }
      fn_start_ticket_work: {
        Args: { p_tech_id: string; p_ticket_id: string }
        Returns: Json
      }
      fn_submit_to_ahs_portal: {
        Args: { p_ticket_id: string; p_user_id: string }
        Returns: boolean
      }
      fn_ticket_hold_for_parts: {
        Args: {
          p_notes: string
          p_parts: Json
          p_summary: string
          p_ticket_id: string
          p_urgency: string
        }
        Returns: Json
      }
      fn_ticket_report_issue: {
        Args: {
          p_category: string
          p_description: string
          p_metadata?: Json
          p_severity: string
          p_summary: string
          p_ticket_id: string
        }
        Returns: Json
      }
      fn_ticket_resume: {
        Args: {
          p_hold_type?: string
          p_resolution_notes?: string
          p_ticket_id: string
        }
        Returns: Json
      }
      generate_bill_number: { Args: never; Returns: string }
      generate_estimate_number: { Args: never; Returns: string }
      generate_gl_entry_number: { Args: never; Returns: string }
      generate_import_batch_number: { Args: never; Returns: string }
      generate_invoice_number: { Args: never; Returns: string }
      generate_po_number: { Args: never; Returns: string }
      generate_prj_ticket_number: {
        Args: { p_project_id: string }
        Returns: string
      }
      generate_production_order_number: { Args: never; Returns: string }
      generate_project_number: { Args: never; Returns: string }
      generate_svc_ticket_number: { Args: never; Returns: string }
      generate_ticket_number: { Args: never; Returns: string }
      generate_vendor_code: { Args: never; Returns: string }
      generate_vendor_contract_number: { Args: never; Returns: string }
      generate_vendor_payment_number: { Args: never; Returns: string }
      get_account_balance: {
        Args: { p_account_id: string; p_as_of_date: string }
        Returns: number
      }
      get_account_balances: {
        Args: { p_as_of_date: string }
        Returns: {
          account_code: string
          account_id: string
          account_name: string
          account_type: string
          balance: number
          normal_balance: string
        }[]
      }
      get_accounting_setting:
        | { Args: { p_default?: string; p_key: string }; Returns: string }
        | { Args: { setting_key: string }; Returns: string }
      get_accounting_setting_numeric: {
        Args: { p_default?: number; p_key: string }
        Returns: number
      }
      get_accounting_setting_rate: {
        Args: { setting_key: string }
        Returns: number
      }
      get_active_vendor_contracts: {
        Args: { p_as_of_date?: string; p_vendor_id: string }
        Returns: {
          contract_id: string
          contract_number: string
          contract_type: string
          end_date: string
          freight_terms: string
          is_preferred_vendor: boolean
          payment_terms: string
          standard_lead_time_days: number
          start_date: string
        }[]
      }
      get_contract_price_for_part: {
        Args: {
          p_as_of_date?: string
          p_contract_id: string
          p_part_id: string
          p_quantity?: number
        }
        Returns: {
          discount_percent: number
          final_price: number
          item_id: string
          lead_time_days: number
          notes: string
          price_type: Database["public"]["Enums"]["contract_price_type"]
        }[]
      }
      get_contracts_expiring_soon: {
        Args: { p_days_ahead?: number }
        Returns: {
          auto_renew: boolean
          contract_id: string
          contract_number: string
          days_until_expiration: number
          end_date: string
          vendor_id: string
          vendor_name: string
        }[]
      }
      get_current_labor_rate_tier: {
        Args: { check_time?: string }
        Returns: Database["public"]["Enums"]["labor_rate_tier"]
      }
      get_current_user_role: { Args: never; Returns: string }
      get_equipment_child_parts: {
        Args: { equipment_uuid: string }
        Returns: {
          installation_date: string
          part_id: string
          part_name: string
          part_number: string
          serial_number: string
          status: string
          warranty_end: string
          warranty_status: string
        }[]
      }
      get_global_billing_rate: {
        Args: { rate_tier: Database["public"]["Enums"]["labor_rate_tier"] }
        Returns: number
      }
      get_master_project_percent_complete: {
        Args: { p_master_project_id: string; p_method?: string }
        Returns: number
      }
      get_next_ticket_number:
        | {
            Args: {
              p_project_id?: string
              p_ticket_type: Database["public"]["Enums"]["ticket_type"]
            }
            Returns: string
          }
        | { Args: { proj_id?: string; ticket_type: string }; Returns: string }
      get_or_create_account: {
        Args: { account_code_param: string }
        Returns: string
      }
      get_project_billing_summary: {
        Args: { p_project_id: string }
        Returns: {
          billed_to_date: number
          contract_value: number
          deposits_billed: number
          deposits_unreleased: number
          revenue_recognized: number
          unbilled_amount: number
        }[]
      }
      get_project_cost_to_date: {
        Args: { p_project_id: string }
        Returns: number
      }
      get_project_number:
        | { Args: never; Returns: string }
        | { Args: { p_project_id: string }; Returns: string }
      get_serialized_part_location_status: {
        Args: { part_uuid: string }
        Returns: {
          installed_at: string
          is_installed: boolean
          location_name: string
          location_type: string
          parent_equipment: string
        }[]
      }
      get_ticket_progress: { Args: { p_ticket_id: string }; Returns: number }
      get_unreconciled_gl_entries: {
        Args: { p_account_id: string; p_end_date?: string }
        Returns: {
          created_at: string
          credit_amount: number
          debit_amount: number
          description: string
          entry_date: string
          entry_number: string
          id: string
          net_amount: number
          reference_id: string
          reference_type: string
        }[]
      }
      get_unreleased_deposit_amount: {
        Args: { p_project_id: string }
        Returns: number
      }
      install_part_on_equipment: {
        Args: {
          p_customer_id: string
          p_equipment_id: string
          p_equipment_location_notes?: string
          p_from_location_id?: string
          p_installation_notes?: string
          p_installed_by?: string
          p_part_id: string
          p_quantity: number
          p_serial_number?: string
          p_ticket_id: string
          p_warranty_months?: number
        }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_or_dispatcher: { Args: never; Returns: boolean }
      is_feature_enabled: { Args: { p_feature_key: string }; Returns: boolean }
      post_deposit_release_to_gl: {
        Args: { deposit_release_id_param: string }
        Returns: Json
      }
      post_invoice_to_gl: { Args: { invoice_id_param: string }; Returns: Json }
      post_payment_to_gl: { Args: { payment_id_param: string }; Returns: Json }
      reconcile_customer_revenue: {
        Args: { p_customer_id: string }
        Returns: {
          invoice_value: number
          matches: boolean
          metric: string
          summary_value: number
        }[]
      }
      reverse_invoice_posting: {
        Args: { invoice_id_param: string }
        Returns: Json
      }
      update_reconciliation_balances: {
        Args: { p_reconciliation_id: string }
        Returns: undefined
      }
      void_gl_entry: {
        Args: { p_entry_id: string; p_reason: string }
        Returns: Json
      }
    }
    Enums: {
      account_type: "asset" | "liability" | "equity" | "revenue" | "expense"
      ap_status: "unpaid" | "partial" | "paid" | "overdue"
      audit_action: "insert" | "update" | "void" | "delete_attempt"
      bank_line_match_status:
        | "unmatched"
        | "auto_matched"
        | "manually_matched"
        | "excluded"
      billing_schedule_status:
        | "planned"
        | "ready_to_bill"
        | "billed"
        | "partially_billed"
        | "cancelled"
      billing_type: "fixed_amount" | "percent_of_contract"
      calculation_method: "fixed_amount" | "percentage"
      capa_status: "OPEN" | "IN_PROGRESS" | "VERIFIED" | "CLOSED"
      change_order_status: "pending" | "approved" | "rejected" | "implemented"
      characteristic_type: "VARIABLE" | "ATTRIBUTE"
      consumption_method: "scan" | "manual" | "backflush"
      contract_billing_frequency:
        | "annual"
        | "semi_annual"
        | "quarterly"
        | "monthly"
        | "per_visit"
      contract_document_type:
        | "signed_contract"
        | "msa"
        | "nda"
        | "warranty"
        | "pricing_sheet"
        | "insurance"
        | "w9"
        | "other"
      contract_price_type: "fixed" | "discount_percent" | "formula"
      contract_sla_metric:
        | "on_time_delivery"
        | "fill_rate"
        | "quality_defect_rate"
        | "invoice_accuracy"
        | "response_time"
        | "other"
      coverage_type: "entire_site" | "equipment" | "system" | "zone"
      customer_type: "residential" | "commercial" | "government"
      data_capture_type: "numeric" | "pass_fail" | "count" | "text" | "photo"
      deduction_type:
        | "tax"
        | "insurance"
        | "retirement"
        | "garnishment"
        | "other"
      disposition_type:
        | "SCRAP"
        | "REWORK"
        | "USE_AS_IS"
        | "RETURN_TO_VENDOR"
        | "SORT_100"
      downtime_category: "planned" | "unplanned"
      downtime_group:
        | "mechanical"
        | "electrical"
        | "material"
        | "quality"
        | "ops"
        | "other"
      equipment_state: "RUN" | "STOP" | "IDLE" | "CHANGEOVER" | "PLANNED_STOP"
      estimate_line_item_type:
        | "labor"
        | "parts"
        | "equipment"
        | "discount"
        | "other"
      estimate_pricing_tier: "good" | "better" | "best"
      estimate_status:
        | "draft"
        | "sent"
        | "viewed"
        | "accepted"
        | "rejected"
        | "expired"
        | "converted"
      estimate_status_enum:
        | "draft"
        | "sent"
        | "viewed"
        | "accepted"
        | "rejected"
        | "expired"
        | "converted"
      import_batch_status:
        | "pending"
        | "validating"
        | "validated"
        | "importing"
        | "completed"
        | "failed"
        | "rolled_back"
      import_entity_type: "customers" | "ar" | "vendors" | "items" | "history"
      import_log_level: "info" | "warning" | "error"
      import_phase:
        | "uploading"
        | "mapping"
        | "validating"
        | "ready_to_commit"
        | "committing"
        | "completed"
        | "failed"
        | "rolled_back"
        | "cancelled"
      import_validation_status: "pending" | "valid" | "error"
      inspection_applies_to:
        | "PRODUCT"
        | "OPERATION"
        | "WORK_CENTER"
        | "ASSET"
        | "VENDOR_PART"
      inspection_plan_type: "INCOMING" | "IN_PROCESS" | "FINAL" | "AUDIT"
      inspection_run_status:
        | "PENDING"
        | "IN_PROGRESS"
        | "PASSED"
        | "FAILED"
        | "WAIVED"
      invoice_line_item_type: "labor" | "part" | "travel" | "service" | "other"
      invoice_source_type: "SVC" | "PRJ" | "Mixed"
      invoice_status:
        | "draft"
        | "sent"
        | "paid"
        | "overdue"
        | "cancelled"
        | "partially_paid"
        | "written_off"
      invoice_status_enum:
        | "draft"
        | "sent"
        | "paid"
        | "overdue"
        | "cancelled"
        | "partially_paid"
        | "written_off"
      issue_severity: "low" | "medium" | "high" | "critical"
      issue_status: "open" | "in_progress" | "resolved" | "closed"
      issue_type: "issue" | "risk" | "blocker"
      labor_coverage_level:
        | "none"
        | "discount_only"
        | "full_for_pm_only"
        | "full_all_service"
      labor_rate_tier: "standard" | "after_hours" | "emergency"
      labor_rate_type:
        | "standard"
        | "discount_percentage"
        | "fixed_rate"
        | "tiered"
      milestone_status: "pending" | "in_progress" | "completed" | "blocked"
      movement_type:
        | "receipt"
        | "transfer"
        | "installation"
        | "return"
        | "adjustment"
        | "disposal"
      nc_severity: "MINOR" | "MAJOR" | "CRITICAL"
      nc_source:
        | "INSPECTION"
        | "OPERATOR_REPORTED"
        | "CUSTOMER_RETURN"
        | "AUDIT"
      nc_status: "OPEN" | "UNDER_REVIEW" | "DISPOSITIONED" | "CLOSED"
      normal_balance: "debit" | "credit"
      note_type: "general" | "diagnostic" | "customer" | "internal"
      oee_grain: "hourly" | "shift" | "daily"
      operation_run_status: "NOT_STARTED" | "RUNNING" | "PAUSED" | "COMPLETED"
      parts_coverage_level: "none" | "limited" | "full"
      pay_frequency: "weekly" | "bi_weekly" | "semi_monthly" | "monthly"
      payer_type: "AHS" | "CUSTOMER"
      payroll_run_status:
        | "draft"
        | "processing"
        | "approved"
        | "paid"
        | "cancelled"
      period_status: "open" | "closing" | "closed"
      plant_hierarchy_level: "site" | "plant" | "area" | "line"
      po_status_enum:
        | "draft"
        | "submitted"
        | "approved"
        | "partial"
        | "received"
        | "cancelled"
      pricing_basis: "list_price" | "standard_cost" | "market_index" | "other"
      priority_level: "normal" | "priority" | "vip"
      production_order_status_enum:
        | "draft"
        | "planned"
        | "released"
        | "in_progress"
        | "on_hold"
        | "completed"
        | "cancelled"
        | "closed"
      project_issue_type: "issue" | "risk"
      project_status:
        | "planning"
        | "in_progress"
        | "on_hold"
        | "completed"
        | "cancelled"
      project_status_enum:
        | "planning"
        | "in_progress"
        | "on_hold"
        | "completed"
        | "cancelled"
      purchase_order_status:
        | "draft"
        | "submitted"
        | "approved"
        | "partial"
        | "received"
        | "cancelled"
      rate_source: "settings" | "contract" | "customer" | "override"
      receipt_status: "pending" | "partial" | "complete" | "cancelled"
      reconciliation_adjustment_type:
        | "bank_fee"
        | "interest_income"
        | "nsf"
        | "correction"
        | "other"
      reconciliation_status:
        | "in_progress"
        | "reconciled"
        | "cancelled"
        | "rolled_back"
        | "completed"
      reorder_method: "rop" | "minmax"
      resource_type: "technician" | "part" | "equipment"
      sampling_method: "100_PERCENT" | "EVERY_N" | "PER_LOT" | "AQL"
      serialized_part_status:
        | "in_stock"
        | "in_transit"
        | "installed"
        | "returned"
        | "defective"
        | "warranty_claim"
      service_contract_status:
        | "draft"
        | "active"
        | "expired"
        | "cancelled"
        | "suspended"
      setting_type: "number" | "text" | "boolean" | "date"
      spc_violation_type:
        | "WESTERN_ELECTRIC_1"
        | "WESTERN_ELECTRIC_2"
        | "WESTERN_ELECTRIC_3"
        | "WESTERN_ELECTRIC_4"
        | "NELSON_1"
        | "NELSON_2"
        | "NELSON_3"
        | "NELSON_4"
        | "NELSON_5"
        | "NELSON_6"
        | "NELSON_7"
        | "NELSON_8"
      stock_location_type:
        | "warehouse"
        | "truck"
        | "project_site"
        | "customer_site"
        | "vendor"
      task_status:
        | "not_started"
        | "in_progress"
        | "completed"
        | "blocked"
        | "cancelled"
      ticket_priority: "low" | "normal" | "high" | "urgent"
      ticket_status:
        | "open"
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "ready_to_invoice"
        | "closed_billed"
        | "closed_no_charge"
        | "awaiting_ahs_authorization"
      ticket_status_enum:
        | "new"
        | "scheduled"
        | "in_progress"
        | "on_hold"
        | "completed"
        | "cancelled"
        | "invoiced"
      ticket_type: "PRJ" | "SVC" | "WARRANTY_AHS"
      time_log_status: "active" | "completed" | "approved" | "rejected"
      time_log_type: "regular" | "overtime" | "travel" | "on_site" | "break"
      user_role:
        | "admin"
        | "office_manager"
        | "dispatcher"
        | "accounting"
        | "lead_tech"
        | "technician"
        | "material_handler"
        | "supervisor"
        | "operator"
      vendor_contract_status:
        | "draft"
        | "active"
        | "expired"
        | "terminated"
        | "suspended"
      vendor_contract_type:
        | "pricing"
        | "service"
        | "warranty"
        | "rebate"
        | "distribution"
        | "msa"
        | "other"
      warranty_status:
        | "active"
        | "expired"
        | "void"
        | "claim_pending"
        | "claim_approved"
        | "claim_denied"
      warranty_type:
        | "parts_only"
        | "parts_and_labor"
        | "labor_only"
        | "extended"
        | "manufacturer"
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
      account_type: ["asset", "liability", "equity", "revenue", "expense"],
      ap_status: ["unpaid", "partial", "paid", "overdue"],
      audit_action: ["insert", "update", "void", "delete_attempt"],
      bank_line_match_status: [
        "unmatched",
        "auto_matched",
        "manually_matched",
        "excluded",
      ],
      billing_schedule_status: [
        "planned",
        "ready_to_bill",
        "billed",
        "partially_billed",
        "cancelled",
      ],
      billing_type: ["fixed_amount", "percent_of_contract"],
      calculation_method: ["fixed_amount", "percentage"],
      capa_status: ["OPEN", "IN_PROGRESS", "VERIFIED", "CLOSED"],
      change_order_status: ["pending", "approved", "rejected", "implemented"],
      characteristic_type: ["VARIABLE", "ATTRIBUTE"],
      consumption_method: ["scan", "manual", "backflush"],
      contract_billing_frequency: [
        "annual",
        "semi_annual",
        "quarterly",
        "monthly",
        "per_visit",
      ],
      contract_document_type: [
        "signed_contract",
        "msa",
        "nda",
        "warranty",
        "pricing_sheet",
        "insurance",
        "w9",
        "other",
      ],
      contract_price_type: ["fixed", "discount_percent", "formula"],
      contract_sla_metric: [
        "on_time_delivery",
        "fill_rate",
        "quality_defect_rate",
        "invoice_accuracy",
        "response_time",
        "other",
      ],
      coverage_type: ["entire_site", "equipment", "system", "zone"],
      customer_type: ["residential", "commercial", "government"],
      data_capture_type: ["numeric", "pass_fail", "count", "text", "photo"],
      deduction_type: [
        "tax",
        "insurance",
        "retirement",
        "garnishment",
        "other",
      ],
      disposition_type: [
        "SCRAP",
        "REWORK",
        "USE_AS_IS",
        "RETURN_TO_VENDOR",
        "SORT_100",
      ],
      downtime_category: ["planned", "unplanned"],
      downtime_group: [
        "mechanical",
        "electrical",
        "material",
        "quality",
        "ops",
        "other",
      ],
      equipment_state: ["RUN", "STOP", "IDLE", "CHANGEOVER", "PLANNED_STOP"],
      estimate_line_item_type: [
        "labor",
        "parts",
        "equipment",
        "discount",
        "other",
      ],
      estimate_pricing_tier: ["good", "better", "best"],
      estimate_status: [
        "draft",
        "sent",
        "viewed",
        "accepted",
        "rejected",
        "expired",
        "converted",
      ],
      estimate_status_enum: [
        "draft",
        "sent",
        "viewed",
        "accepted",
        "rejected",
        "expired",
        "converted",
      ],
      import_batch_status: [
        "pending",
        "validating",
        "validated",
        "importing",
        "completed",
        "failed",
        "rolled_back",
      ],
      import_entity_type: ["customers", "ar", "vendors", "items", "history"],
      import_log_level: ["info", "warning", "error"],
      import_phase: [
        "uploading",
        "mapping",
        "validating",
        "ready_to_commit",
        "committing",
        "completed",
        "failed",
        "rolled_back",
        "cancelled",
      ],
      import_validation_status: ["pending", "valid", "error"],
      inspection_applies_to: [
        "PRODUCT",
        "OPERATION",
        "WORK_CENTER",
        "ASSET",
        "VENDOR_PART",
      ],
      inspection_plan_type: ["INCOMING", "IN_PROCESS", "FINAL", "AUDIT"],
      inspection_run_status: [
        "PENDING",
        "IN_PROGRESS",
        "PASSED",
        "FAILED",
        "WAIVED",
      ],
      invoice_line_item_type: ["labor", "part", "travel", "service", "other"],
      invoice_source_type: ["SVC", "PRJ", "Mixed"],
      invoice_status: [
        "draft",
        "sent",
        "paid",
        "overdue",
        "cancelled",
        "partially_paid",
        "written_off",
      ],
      invoice_status_enum: [
        "draft",
        "sent",
        "paid",
        "overdue",
        "cancelled",
        "partially_paid",
        "written_off",
      ],
      issue_severity: ["low", "medium", "high", "critical"],
      issue_status: ["open", "in_progress", "resolved", "closed"],
      issue_type: ["issue", "risk", "blocker"],
      labor_coverage_level: [
        "none",
        "discount_only",
        "full_for_pm_only",
        "full_all_service",
      ],
      labor_rate_tier: ["standard", "after_hours", "emergency"],
      labor_rate_type: [
        "standard",
        "discount_percentage",
        "fixed_rate",
        "tiered",
      ],
      milestone_status: ["pending", "in_progress", "completed", "blocked"],
      movement_type: [
        "receipt",
        "transfer",
        "installation",
        "return",
        "adjustment",
        "disposal",
      ],
      nc_severity: ["MINOR", "MAJOR", "CRITICAL"],
      nc_source: [
        "INSPECTION",
        "OPERATOR_REPORTED",
        "CUSTOMER_RETURN",
        "AUDIT",
      ],
      nc_status: ["OPEN", "UNDER_REVIEW", "DISPOSITIONED", "CLOSED"],
      normal_balance: ["debit", "credit"],
      note_type: ["general", "diagnostic", "customer", "internal"],
      oee_grain: ["hourly", "shift", "daily"],
      operation_run_status: ["NOT_STARTED", "RUNNING", "PAUSED", "COMPLETED"],
      parts_coverage_level: ["none", "limited", "full"],
      pay_frequency: ["weekly", "bi_weekly", "semi_monthly", "monthly"],
      payer_type: ["AHS", "CUSTOMER"],
      payroll_run_status: [
        "draft",
        "processing",
        "approved",
        "paid",
        "cancelled",
      ],
      period_status: ["open", "closing", "closed"],
      plant_hierarchy_level: ["site", "plant", "area", "line"],
      po_status_enum: [
        "draft",
        "submitted",
        "approved",
        "partial",
        "received",
        "cancelled",
      ],
      pricing_basis: ["list_price", "standard_cost", "market_index", "other"],
      priority_level: ["normal", "priority", "vip"],
      production_order_status_enum: [
        "draft",
        "planned",
        "released",
        "in_progress",
        "on_hold",
        "completed",
        "cancelled",
        "closed",
      ],
      project_issue_type: ["issue", "risk"],
      project_status: [
        "planning",
        "in_progress",
        "on_hold",
        "completed",
        "cancelled",
      ],
      project_status_enum: [
        "planning",
        "in_progress",
        "on_hold",
        "completed",
        "cancelled",
      ],
      purchase_order_status: [
        "draft",
        "submitted",
        "approved",
        "partial",
        "received",
        "cancelled",
      ],
      rate_source: ["settings", "contract", "customer", "override"],
      receipt_status: ["pending", "partial", "complete", "cancelled"],
      reconciliation_adjustment_type: [
        "bank_fee",
        "interest_income",
        "nsf",
        "correction",
        "other",
      ],
      reconciliation_status: [
        "in_progress",
        "reconciled",
        "cancelled",
        "rolled_back",
        "completed",
      ],
      reorder_method: ["rop", "minmax"],
      resource_type: ["technician", "part", "equipment"],
      sampling_method: ["100_PERCENT", "EVERY_N", "PER_LOT", "AQL"],
      serialized_part_status: [
        "in_stock",
        "in_transit",
        "installed",
        "returned",
        "defective",
        "warranty_claim",
      ],
      service_contract_status: [
        "draft",
        "active",
        "expired",
        "cancelled",
        "suspended",
      ],
      setting_type: ["number", "text", "boolean", "date"],
      spc_violation_type: [
        "WESTERN_ELECTRIC_1",
        "WESTERN_ELECTRIC_2",
        "WESTERN_ELECTRIC_3",
        "WESTERN_ELECTRIC_4",
        "NELSON_1",
        "NELSON_2",
        "NELSON_3",
        "NELSON_4",
        "NELSON_5",
        "NELSON_6",
        "NELSON_7",
        "NELSON_8",
      ],
      stock_location_type: [
        "warehouse",
        "truck",
        "project_site",
        "customer_site",
        "vendor",
      ],
      task_status: [
        "not_started",
        "in_progress",
        "completed",
        "blocked",
        "cancelled",
      ],
      ticket_priority: ["low", "normal", "high", "urgent"],
      ticket_status: [
        "open",
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "ready_to_invoice",
        "closed_billed",
        "closed_no_charge",
        "awaiting_ahs_authorization",
      ],
      ticket_status_enum: [
        "new",
        "scheduled",
        "in_progress",
        "on_hold",
        "completed",
        "cancelled",
        "invoiced",
      ],
      ticket_type: ["PRJ", "SVC", "WARRANTY_AHS"],
      time_log_status: ["active", "completed", "approved", "rejected"],
      time_log_type: ["regular", "overtime", "travel", "on_site", "break"],
      user_role: [
        "admin",
        "office_manager",
        "dispatcher",
        "accounting",
        "lead_tech",
        "technician",
        "material_handler",
        "supervisor",
        "operator",
      ],
      vendor_contract_status: [
        "draft",
        "active",
        "expired",
        "terminated",
        "suspended",
      ],
      vendor_contract_type: [
        "pricing",
        "service",
        "warranty",
        "rebate",
        "distribution",
        "msa",
        "other",
      ],
      warranty_status: [
        "active",
        "expired",
        "void",
        "claim_pending",
        "claim_approved",
        "claim_denied",
      ],
      warranty_type: [
        "parts_only",
        "parts_and_labor",
        "labor_only",
        "extended",
        "manufacturer",
      ],
    },
  },
} as const
