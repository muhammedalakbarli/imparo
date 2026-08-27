-- Login-a da signup-dakı eyni müdafiə (OWASP audit tapıntısı): brute-force giriş cəhdlərinə qarşı
-- IP-ə görə saatlıq tavan. Supabase-in öz platform-səviyyəli limiti üzərinə əlavə qat + admin
-- panelində görünürlük (security_events).
create or replace function check_login_rate(p_ip text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare cnt int;
begin
  if p_ip is null or p_ip = '' then return true; end if;
  select count(*) into cnt from security_events
  where kind = 'login_attempt' and ip = left(p_ip, 64) and created_at > now() - interval '1 hour';
  return cnt < 15;  -- signup-dan (8) daha səxavətli — real istifadəçi parolunu unuda bilər
end; $$;
grant execute on function check_login_rate(text) to authenticated, anon;
