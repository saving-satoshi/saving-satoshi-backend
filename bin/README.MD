
At the time of writing, there is a bug in the system where the `accounts_progress.progress` field is not updated correctly. This directory contains a script to get around the bug and to generate a snapshot of user progress. Here's how to run it:

## Requirements
This script uses `psql` to read from the database. To check if it is installed, use `psql --version`.

If you do not have it, it's recommended you get it by installing Postgres: `brew install postgresql`. If you prefer to only install the client utilities like `psql` without all of Postgres, run `brew install libpq`.

## Step 1: Run the `user_progress.sh` script

Example:

```
./user_progress.sh -d YOUR_DB_NAME -u YOUR_DB_USERNAME -h YOUR_DB_HOST -p YOUR_DB_PORT -o ./user_progress_raw.csv
```

## Step 2: Run this `awk` command to aggregate the results of user_progress_raw.csv into a new file, `user_progress_aggregated.csv`. This will tally up the number of users at each lesson in the game:

```
awk -F',' 'NR > 1 { counts[$2]++ } END { for (p in counts) print p "," counts[p] }' user_progress_raw.csv \
| awk -F',' '{ prefix = ($1 ~ /^CH10/) ? "z" : "a"; print prefix "," $0 }' \
| sort \
| cut -d',' -f2- \
| awk 'BEGIN { print "progress,count" } { print }' \
> user_progress_aggregated.csv
```

## [OPTIONAL] Step 3: You can further aggregate the results by chapter with this `awk` command that prints to a new file called `user_progress_aggregate_by_chapter.csv`:

```
awk -F',' '
NR == 1 { next } # Skip header

{
  if (match($1, /^CH[0-9]+/)) {
    chapter = substr($1, RSTART, RLENGTH)
    counts[chapter] += $2
  }
}

END {
  print "chapter,count"
  for (i = 1; i <= 10; i++) {
    chapter = "CH" i
    if (chapter in counts) {
      print chapter "," counts[chapter]
    }
  }
}
' user_progress_aggregated.csv > user_progress_aggregated_by_chapter.csv
```