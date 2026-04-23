import Customer360Dashboard from "@/components/customer360-dashboard";
import { getCustomer360Rows } from "@/lib/customer360";

export default async function HomePage() {
  const rows = await getCustomer360Rows();

  console.log("HomePage rows", rows.length); // Log the length of the rows array for verification
  console.log("HomePage first 5 rows", rows.slice(0, 5)); // Log the first 5 rows for verification

  return <Customer360Dashboard rows={rows} />;
}

// const sampleRows = [
//   {
//     user_id: 1,
//     most_search_t6: "Product A",
//     most_search_t7: "Product A",
//     category_t6: "Category X",
//     category_t7: "Category X",
//     change_type: "Same",
//     group_label: "Group 1",
//   },
//   {
//     user_id: 2,
//     most_search_t6: "Product B",
//     most_search_t7: "Product C",
//     category_t6: "Category Y",
//     category_t7: "Category Z",
//     change_type: "Changed",
//     group_label: "Group 2",
//   },
// ];

// export default function HomePage() {
//   return <Customer360Dashboard rows={sampleRows} />;
// }