export type Customer360Row = {
    user_id: number;
    most_search_t6: string | null;
    most_search_t7: string | null;
    category_t6: string | null;
    category_t7: string | null;
    change_type: "Same" | "Changed" | string | null;
    group_label: string | null;
}