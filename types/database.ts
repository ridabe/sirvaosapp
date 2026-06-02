// Tipos gerados do schema Supabase
// Rodar: npx supabase gen types typescript --project-id gaqkjsnomkdaghvwerlb > types/database.ts
// Este arquivo é placeholder — substituir pelo gerado pelo CLI

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          tenant_id: string | null
          member_id: string | null
          tenant_role: 'owner' | 'admin' | 'member' | null
          global_role: 'super_admin' | 'operations' | null
          status: 'active' | 'inactive' | 'suspended' | null
          created_at: string
          updated_at: string
        }
      }
      members: {
        Row: {
          id: string
          tenant_id: string
          full_name: string
          email: string | null
          phone: string | null
          birth_date: string | null
          membership_status: string | null
          photo_url: string | null
          created_at: string
          updated_at: string
        }
      }
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          logo_main_url: string | null
          logo_compact_url: string | null
          primary_color: string | null
          secondary_color: string | null
          accent_color: string | null
          status: string
          created_at: string
        }
      }
      platform_modules: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          icon: string | null
          status: string
        }
      }
      tenant_modules: {
        Row: {
          id: string
          tenant_id: string
          module_id: string
          status: string
        }
      }
    }
  }
}
