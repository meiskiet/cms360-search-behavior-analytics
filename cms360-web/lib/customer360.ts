import { supabaseAdmin } from "@/lib/supabase-admin";
import { Customer360Row } from "@/types/customer360";

export async function getCustomer360Rows(): Promise<Customer360Row[]> {
  const { data, error } = await supabaseAdmin
    .from("customer_360_final")
    .select(`
      user_id,
      most_search_t6,
      most_search_t7,
      category_t6,
      category_t7,
      change_type,
      group_label
    `)
    .order("user_id", { ascending: true });
 
  console.log("Supabase error:", error);
  console.log("Supabase data:", data?.slice(0, 5)); // Log the first 5 rows of data for verification
  console.log("Supabase data length:", data?.length); // Log the length of the data array

  if (error) {
    throw new Error(`Failed to fetch customer_360_final: ${error.message}`);
  }

  return (data ?? []) as Customer360Row[];
}