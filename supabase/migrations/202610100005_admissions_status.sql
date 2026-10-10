-- Apply ONLY to medresa-me-preview. Global status is independent of all PDF heads.
BEGIN;
CREATE TABLE public.medresa_admissions_status (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 is_open boolean NOT NULL DEFAULT true,
 revision bigint NOT NULL DEFAULT 0 CHECK(revision BETWEEN 0 AND 9007199254740990),
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by text CHECK(updated_by IS NULL OR length(btrim(updated_by))>0)
);
-- Preserve the existing OPEN state until an administrator explicitly changes it.
INSERT INTO public.medresa_admissions_status(singleton) VALUES(true);
ALTER TABLE public.medresa_admissions_status ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.medresa_admissions_status FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,UPDATE ON public.medresa_admissions_status TO service_role;
CREATE FUNCTION public.medresa_admissions_set_status(p_open boolean,p_expected bigint,p_actor text)
RETURNS public.medresa_admissions_status LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE s public.medresa_admissions_status;
BEGIN
 IF p_open IS NULL OR p_expected IS NULL OR p_expected<0 OR p_expected>9007199254740990 OR p_actor IS NULL OR length(btrim(p_actor))=0 THEN RAISE EXCEPTION 'Invalid admissions status' USING ERRCODE='22023'; END IF;
 SELECT * INTO s FROM public.medresa_admissions_status WHERE singleton FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Admissions status unavailable' USING ERRCODE='P0002'; END IF;
 IF s.revision<>p_expected THEN RAISE EXCEPTION 'Admissions status changed' USING ERRCODE='40001'; END IF;
 IF s.is_open=p_open THEN RETURN s; END IF;
 UPDATE public.medresa_admissions_status SET is_open=p_open,revision=revision+1,updated_at=now(),updated_by=p_actor WHERE singleton RETURNING * INTO s;
 RETURN s;
END;
$$;
REVOKE ALL ON FUNCTION public.medresa_admissions_set_status(boolean,bigint,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.medresa_admissions_set_status(boolean,bigint,text) TO service_role;
COMMIT;
