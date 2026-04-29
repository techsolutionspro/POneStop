#!/bin/bash
echo "local all all trust" > /var/lib/pgsql/data/pg_hba.conf
echo "host all all 127.0.0.1/32 md5" >> /var/lib/pgsql/data/pg_hba.conf
systemctl restart postgresql
sleep 2
su - postgres -c "psql -c \"CREATE USER p1s_user WITH PASSWORD 'p1s_secure_password_2026';\""
su - postgres -c "psql -c \"CREATE DATABASE pharmacy_one_stop OWNER p1s_user;\""
su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE pharmacy_one_stop TO p1s_user;\""
echo "local all all md5" > /var/lib/pgsql/data/pg_hba.conf
echo "host all all 127.0.0.1/32 md5" >> /var/lib/pgsql/data/pg_hba.conf
systemctl restart postgresql
echo "PostgreSQL setup complete!"
