/**
 * Hand-authored placeholder for the real Supabase database types.
 *
 * This file was inferred from how `products` and `price_history` are read
 * and written throughout the codebase (app/actions.ts, app/api/cron/route.ts).
 * It is NOT generated from the live schema and may be missing columns,
 * constraints, or tables that exist in the database but aren't touched by
 * this codebase.
 *
 * Replace it with the real thing:
 *
 *   npx supabase login
 *   npx supabase gen types typescript --project-id <your-project-ref> --schema public > types/supabase.ts
 *
 * (Find <your-project-ref> in the Supabase dashboard URL or Project Settings.)
 * After regenerating, re-check the `Product` / `PriceHistoryEntry` aliases
 * below still line up with the generated `Tables` shape.
 *
 * Price columns (`current_price`, `original_price`, `price`) are typed as
 * `string` on Row: the app reads them with `parseFloat(String(...))`
 * everywhere, which is the standard sign of a Postgres `numeric`/`decimal`
 * column — PostgREST serializes those as JSON strings to avoid float
 * precision loss. Confirmed with the user rather than guessed. Insert/Update
 * are typed `number` because that's what the app actually writes
 * (`current_price: newPrice`); PostgREST accepts a numeric JSON literal on
 * write even though it returns a string on read. If the real generated
 * types type Insert as `string` too, either adjust these aliases or wrap
 * the write sites in `String(...)`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          user_id: string;
          url: string;
          name: string;
          current_price: string;
          original_price: string | null;
          currency: string;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          url: string;
          name: string;
          current_price: number;
          original_price?: number | null;
          currency: string;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          url?: string;
          name?: string;
          current_price?: number;
          original_price?: number | null;
          currency?: string;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      price_history: {
        Row: {
          id: number;
          product_id: string;
          price: string;
          currency: string;
          checked_at: string;
        };
        Insert: {
          id?: number;
          product_id: string;
          price: number;
          currency: string;
          checked_at?: string;
        };
        Update: {
          id?: number;
          product_id?: string;
          price?: number;
          currency?: string;
          checked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "price_history_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Product = Tables<"products">;
export type ProductInsert = TablesInsert<"products">;
export type ProductUpdate = TablesUpdate<"products">;

export type PriceHistoryEntry = Tables<"price_history">;
export type PriceHistoryInsert = TablesInsert<"price_history">;
