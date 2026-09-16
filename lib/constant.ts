export const EMAIL =
  "aks.krsinha@gmail.com?subject=Hello Akash - Let's Connect";

export const CLASSIFIER_MODEL = "Xenova/LaMini-Flan-T5-77M" as const;
export const EXPANSION_MODEL = "Xenova/LaMini-Flan-T5-77M" as const;
export const TALK_MODEL = "HuggingFaceTB/SmolLM2-360M-Instruct" as const;
export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions" as const;

export const BLOCKED_DB_COMMANDS = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "CREATE",
  "ALTER",
  "DROP",
  "TRUNCATE",
  "RENAME",
  "GRANT",
  "REVOKE",
  "OPTIMIZE",
  "KILL",
  "SYSTEM",
  "ATTACH",
  "DETACH",
] as const;

export const CLICKHOUSE_SCHEMA_DEFINITION = `
Table 1: uk_price_paid (UK Real Estate Property Sales)
- price: UInt32 (Sale price in GBP)
- date: Date (Date of sale)
- postcode: LowCardinality(String) (UK Postcode)
- type: Enum8('other' = 0, 'terraced' = 1, 'semi-detached' = 2, 'detached' = 3, 'flat' = 4) (Property type)
- is_new: UInt8 (1 = newly built, 0 = established)
- duration: Enum8('unknown' = 0, 'freehold' = 1, 'leasehold' = 2) (Tenure)
- addr1: String (Primary address line)
- addr2: String (Secondary address line)
- street: LowCardinality(String) (Street name)
- locality: LowCardinality(String) (Locality)
- town: LowCardinality(String) (Town/City e.g. LONDON, MANCHESTER)
- district: LowCardinality(String) (District/Borough)
- county: LowCardinality(String) (County e.g. GREATER LONDON, SURREY)

Table 2: trips (NYC Taxi & Ride-sharing Trip Data)
- trip_id: UInt32 (Unique identifier)
- vendor_id: Enum8('1'=1, '2'=2, '3'=3, '4'=4, 'CMT'=5, 'VTS'=6, 'DDS'=7, 'B02512'=10, 'B02598'=11, 'B02617'=12, 'B02682'=13, 'B02764'=14, ''=15)
- pickup_date: Date (Pickup date)
- pickup_datetime: DateTime (Pickup timestamp)
- dropoff_date: Date (Dropoff date)
- dropoff_datetime: DateTime (Dropoff timestamp)
- store_and_fwd_flag: UInt8
- rate_code_id: UInt8
- pickup_longitude: Float64, pickup_latitude: Float64
- dropoff_longitude: Float64, dropoff_latitude: Float64
- passenger_count: UInt8 (Number of passengers)
- trip_distance: Float64 (Trip distance in miles)
- fare_amount: Float32 (Base metered fare)
- extra: Float32, mta_tax: Float32, tip_amount: Float32, tolls_amount: Float32, ehail_fee: Float32, improvement_surcharge: Float32
- total_amount: Float32 (Total trip fare including tips/tolls)
- payment_type: Enum8('UNK'=0, 'CSH'=1, 'CRE'=2, 'NOC'=3, 'DIS'=4)
- trip_type: UInt8
- pickup: FixedString(25), dropoff: FixedString(25)
- cab_type: Enum8('yellow'=1, 'green'=2, 'uber'=3)
- pickup_nyct2010_gid, pickup_ctlabel, pickup_borocode, pickup_ct2010, pickup_boroct2010, pickup_cdeligibil, pickup_ntacode, pickup_ntaname, pickup_puma
- dropoff_nyct2010_gid, dropoff_ctlabel, dropoff_borocode, dropoff_ct2010, dropoff_boroct2010, dropoff_cdeligibil, dropoff_ntacode, dropoff_ntaname, dropoff_puma
`;