#!/bin/bash

# Default config
TABLE_NAME="accounts_progress"
ACCOUNT_ID_COLUMN="account"
PROGRESS_STATE_COLUMN="progress_state"
CURRENT_LESSON_FIELD="currentLesson"


# Usage message
usage() {
  echo "This script parses the accounts_progress.progress_state column in the database to create a file with" \
  "the current progress for each account. You must have psql and jq installed to run it."
  echo "Usage: $0 -d DB_NAME -u DB_USER -h DB_HOST -p DB_PORT -o OUTPUT_CSV"
  exit 1
}

# Parse the command line options
while getopts ":d:u:h:p:o:" opt; do
  case $opt in
    d) DB_NAME="$OPTARG" ;;
    u) DB_USER="$OPTARG" ;;
    h) DB_HOST="$OPTARG" ;;
    p) DB_PORT="$OPTARG" ;;
    o) OUTPUT_CSV="$OPTARG" ;;
    *) usage;;
  esac
done

if [[ -z "$DB_NAME" || -z "$DB_USER" || -z "$DB_HOST" || -z "$DB_PORT" || -z "$OUTPUT_CSV" ]]; then
  usage
fi

# Set up the CSV headers
ACCOUNT_ID_HEADER_CSV="account_id"
CURRENT_LESSON_HEADER_CSV="current_lesson"
echo "${ACCOUNT_ID_HEADER_CSV},${CURRENT_LESSON_HEADER_CSV}" > "${OUTPUT_CSV}"

# Query the db and parse each row
psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -t -A -F $'\t' -c \
"SELECT ${ACCOUNT_ID_COLUMN}, ${PROGRESS_STATE_COLUMN} FROM ${TABLE_NAME} WHERE ${PROGRESS_STATE_COLUMN} IS NOT NULL;" | \
while IFS=$'\t' read -r account_id account_progress_json; do
  current_lesson=$(echo "$account_progress_json" | jq -r ".${CURRENT_LESSON_FIELD}")
  echo "$account_id,$current_lesson" >> "$OUTPUT_CSV"
done
