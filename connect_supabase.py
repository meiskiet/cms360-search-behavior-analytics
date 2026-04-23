import os
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# ============================================================
# LOAD ENV
# ============================================================
load_dotenv()

SUPABASE_HOST = os.getenv("SUPABASE_HOST") 
SUPABASE_PORT = os.getenv("SUPABASE_PORT", "5432") 
SUPABASE_DB = os.getenv("SUPABASE_DB", "postgres") 
SUPABASE_USER = os.getenv("SUPABASE_USER", "postgres") 
SUPABASE_PASSWORD = os.getenv("SUPABASE_PASSWORD") 
SUPABASE_SCHEMA = os.getenv("SUPABASE_SCHEMA", "public") 
SUPABASE_TABLE = os.getenv("SUPABASE_TABLE", "customer_360_final") 

INPUT_FILE = os.getenv("INPUT_FILE", "./c360_final.parquet")

if not all([SUPABASE_HOST, SUPABASE_PASSWORD]):
    raise ValueError("Missing required database environment variables.")

# ============================================================
# DB CONNECTION
# ============================================================
DATABASE_URL = (
    f"postgresql+psycopg2://{SUPABASE_USER}:{SUPABASE_PASSWORD}"
    f"@{SUPABASE_HOST}:{SUPABASE_PORT}/{SUPABASE_DB}"
)

engine = create_engine(DATABASE_URL)

# ============================================================
# READ INPUT FILE
# ============================================================
def read_input_file(path: str) -> pd.DataFrame:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Input file not found: {path}")

    if path.lower().endswith(".parquet"):
        return pd.read_parquet(path)
    elif path.lower().endswith(".csv"):
        return pd.read_csv(path)
    else:
        raise ValueError("Only .parquet or .csv is supported")

df = read_input_file(INPUT_FILE)

print("Input shape:", df.shape)
print(df.head())

# ============================================================
# NORMALIZE COLUMN NAMES
# ============================================================
rename_map = {
    "Type": "change_type",
    "Group": "group_label"
}
df = df.rename(columns=rename_map)

# đảm bảo cột lower-case snake_case
df.columns = [c.strip() for c in df.columns]

required_cols = [
    "user_id",
    "most_search_t6",
    "most_search_t7",
    "category_t6",
    "category_t7",
    "change_type",
    "group_label",
]

missing_cols = [c for c in required_cols if c not in df.columns]
if missing_cols:
    raise ValueError(f"Missing required columns: {missing_cols}")

# chỉ giữ cột đúng thứ tự
df = df[required_cols].copy()

# optional cleanup
df["user_id"] = pd.to_numeric(df["user_id"], errors="coerce")
df = df[df["user_id"].notna()].copy()
df["user_id"] = df["user_id"].astype("int64")

for c in [
    "most_search_t6",
    "most_search_t7",
    "category_t6",
    "category_t7",
    "change_type",
    "group_label",
]:
    df[c] = df[c].astype(str).replace({"nan": None})

# deduplicate by user_id
df = df.drop_duplicates(subset=["user_id"], keep="last").reset_index(drop=True)

print("After cleanup:", df.shape)
print(df.head())

# ============================================================
# STAGING + UPSERT
# ============================================================
staging_table = f"{SUPABASE_TABLE}_staging"

create_staging_sql = f"""
drop table if exists {SUPABASE_SCHEMA}.{staging_table};

create table {SUPABASE_SCHEMA}.{staging_table} (
    user_id bigint,
    most_search_t6 text,
    most_search_t7 text,
    category_t6 text,
    category_t7 text,
    change_type text,
    group_label text
);
"""

upsert_sql = f"""
insert into {SUPABASE_SCHEMA}.{SUPABASE_TABLE} (
    user_id,
    most_search_t6,
    most_search_t7,
    category_t6,
    category_t7,
    change_type,
    group_label,
    updated_at
)
select
    user_id,
    most_search_t6,
    most_search_t7,
    category_t6,
    category_t7,
    change_type,
    group_label,
    now()
from {SUPABASE_SCHEMA}.{staging_table}
on conflict (user_id)
do update set
    most_search_t6 = excluded.most_search_t6,
    most_search_t7 = excluded.most_search_t7,
    category_t6 = excluded.category_t6,
    category_t7 = excluded.category_t7,
    change_type = excluded.change_type,
    group_label = excluded.group_label,
    updated_at = now();
"""

drop_staging_sql = f"drop table if exists {SUPABASE_SCHEMA}.{staging_table};"

with engine.begin() as conn:
    # create staging
    conn.execute(text(create_staging_sql))

    # load dataframe into staging
    df.to_sql(
        staging_table,
        con=conn,
        schema=SUPABASE_SCHEMA,
        if_exists="append",
        index=False,
        method="multi",
        chunksize=1000
    )

    # upsert into final table
    conn.execute(text(upsert_sql))

    # cleanup
    conn.execute(text(drop_staging_sql))

print(f"Upload completed successfully to {SUPABASE_SCHEMA}.{SUPABASE_TABLE}")