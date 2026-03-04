#!/bin/bash
# Backup database to Cloud Storage every hour
gsutil cp /data/database.db gs://starstranslations-database/database-$(date +%Y%m%d-%H%M%S).db
gsutil cp /data/database.db gs://starstranslations-database/database-latest.db
