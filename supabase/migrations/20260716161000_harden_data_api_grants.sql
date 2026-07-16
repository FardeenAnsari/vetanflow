-- Browser clients only read through RLS. All writes are validated and authorized by the API.
revoke select, insert, update, delete, truncate, references, trigger
on all tables in schema public
from anon;

revoke insert, update, delete, truncate, references, trigger
on all tables in schema public
from authenticated;

revoke all privileges
on all sequences in schema public
from anon, authenticated;

alter default privileges in schema public
revoke all privileges on tables from anon;

alter default privileges in schema public
revoke insert, update, delete, truncate, references, trigger on tables from authenticated;

alter default privileges in schema public
revoke all privileges on sequences from anon, authenticated;
