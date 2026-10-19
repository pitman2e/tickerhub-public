# Postgres / pgAdmin
## Backup and Restore (Version 1)
Connect to DB using `psql` to a database that is not going to recover
```
psql -h <host> -p <port> -U <admin_name> -d <init_db_pgDB?>
```

For example:
```
psql -h 192.168.1.110 -p 5432 -U pgadmin postgres
```

Drop and re-create the database;
```
DROP DATABASE sh_uat WITH (FORCE);
CREATE DATABASE sh_uat;
```

Switch database
```
\connect sh_uat;
```

Select the file to recover. Noth that the directory separator is changed
```
\i /path/to/file.sql
```

## Backup and Restore (Version 1)
Note that when restoring, the database must be first be created
```
pg_dump -h 192.168.1.110 -p 5432 -U pgadmin -d sh_uat -Fc -f sh_backup.dump
pg_restore -h 192.168.1.110 -p 5432 -U pgadmin -d sh_uat -1 sh_backup.dump
```
