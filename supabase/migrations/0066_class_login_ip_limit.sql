-- 0066: Məktəb Wi-Fi (NAT IP) üçün sinif girişi IP limitinin artırılması.
-- Eyni məktəb şəbəkəsində 25-30 şagird eyni IP-dən daxil olduqda saatda 30 səhv
-- limiti bütün sinfi bloklaya bilərdi. Şagird başına 5 səhv / 5 dəqiqə blok qalır,
-- IP üzrə saatlıq limit isə 150-yə qaldırılır.

create or replace function verify_student_pin(p_code text, p_ref text, p_pin text, p_ip text)
returns json language plpgsql security definer set search_path = public as $$
declare s managed_students%rowtype; ip_fails int; em text;
begin
  select count(*) into ip_fails from class_login_events
   where ip = coalesce(p_ip, '') and kind = 'pin_fail' and at > now() - interval '1 hour';
  if ip_fails >= 150 then return json_build_object('status', 'ip_limited'); end if;

  select m.* into s
    from managed_students m join classes c on c.id = m.class_id
   where c.code = upper(btrim(coalesce(p_code, ''))) and m.ref = upper(btrim(coalesce(p_ref, '')))
   for update of m;
  if not found then
    insert into class_login_events(ip, kind) values (coalesce(p_ip, ''), 'pin_fail');
    return json_build_object('status', 'not_found');
  end if;

  if s.locked_until is not null and s.locked_until > now() then
    return json_build_object('status', 'locked',
      'retry_after', ceil(extract(epoch from s.locked_until - now()))::int);
  end if;

  if p_pin ~ '^[0-9]{4}$' and s.pin = p_pin then
    update managed_students
       set failed_attempts = 0, locked_until = null, last_login_at = now()
     where user_id = s.user_id;
    select email into em from auth.users where id = s.user_id;
    return json_build_object('status', 'ok', 'user_id', s.user_id, 'email', em);
  end if;

  insert into class_login_events(ip, kind) values (coalesce(p_ip, ''), 'pin_fail');
  if s.failed_attempts + 1 >= 5 then
    update managed_students
       set failed_attempts = 0, locked_until = now() + interval '5 minutes'
     where user_id = s.user_id;
    return json_build_object('status', 'locked', 'retry_after', 300);
  end if;
  update managed_students set failed_attempts = failed_attempts + 1 where user_id = s.user_id;
  return json_build_object('status', 'wrong', 'remaining', 5 - (s.failed_attempts + 1));
end; $$;
revoke execute on function verify_student_pin(text, text, text, text) from public, anon, authenticated;
grant execute on function verify_student_pin(text, text, text, text) to service_role;
