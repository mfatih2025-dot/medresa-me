-- Preview ONLY: medresa-me-preview. Additive; no News/Analytics changes or seeded campaigns.
BEGIN;
CREATE TABLE public.medresa_campaign_assets (
  id uuid PRIMARY KEY,
  bucket text NOT NULL DEFAULT 'medresa-campaigns-preview' CHECK (bucket = 'medresa-campaigns-preview'),
  object_path text NOT NULL UNIQUE,
  mime text NOT NULL CHECK (mime IN ('image/jpeg','image/png','image/webp')),
  bytes bigint NOT NULL CHECK (bytes BETWEEN 1 AND 4194304),
  width integer NOT NULL CHECK (width BETWEEN 1 AND 20000),
  height integer NOT NULL CHECK (height BETWEEN 1 AND 20000),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text NOT NULL,
  CHECK (width::bigint * height <= 40000000),
  CHECK (object_path = 'posters/' || id::text || CASE mime WHEN 'image/jpeg' THEN '.jpg' WHEN 'image/png' THEN '.png' ELSE '.webp' END)
);
CREATE TABLE public.medresa_campaigns (
  id uuid PRIMARY KEY,
  revision bigint NOT NULL CHECK (revision >= 1),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 160),
  poster_id uuid REFERENCES public.medresa_campaign_assets(id),
  cta_text text NOT NULL DEFAULT 'SAZNAJ VIŠE' CHECK (length(btrim(cta_text)) BETWEEN 1 AND 80),
  cta_link text NOT NULL CHECK (length(cta_link) BETWEEN 1 AND 2048 AND cta_link !~ '[[:space:][:cntrl:]\\]' AND (cta_link ~ '^/[^/]' OR cta_link = '/' OR cta_link ~ '^https://[^/@]+') AND cta_link !~* '^/(admin|api)(/|[?#]|$)'),
  active boolean NOT NULL DEFAULT false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  updated_by text NOT NULL,
  CHECK (starts_at IS NULL OR ends_at IS NULL OR starts_at < ends_at),
  CHECK (NOT active OR (poster_id IS NOT NULL AND activated_at IS NOT NULL))
);
CREATE INDEX medresa_campaign_eligible ON public.medresa_campaigns (activated_at DESC, id) WHERE active;
CREATE INDEX medresa_campaign_library ON public.medresa_campaigns (updated_at DESC, id);
ALTER TABLE public.medresa_campaign_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medresa_campaigns ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.medresa_campaign_assets, public.medresa_campaigns FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT ON public.medresa_campaign_assets TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.medresa_campaigns TO service_role;
-- No DELETE/TRUNCATE grants: campaigns and original posters are retained historically.
CREATE FUNCTION public.medresa_campaign_save(p_id uuid, p_expected bigint, p_name text, p_poster uuid, p_cta_text text, p_cta_link text, p_active boolean, p_starts timestamptz, p_ends timestamptz, p_actor text)
RETURNS public.medresa_campaigns
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp
AS $$
DECLARE current_row public.medresa_campaigns; result public.medresa_campaigns;
BEGIN
  IF p_expected IS NULL OR p_expected < 0 OR p_expected > 9007199254740990 OR p_actor IS NULL OR length(btrim(p_actor)) = 0 THEN
    RAISE EXCEPTION 'Invalid campaign save' USING ERRCODE='22023';
  END IF;
  IF p_expected = 0 THEN
    INSERT INTO public.medresa_campaigns(id,revision,name,poster_id,cta_text,cta_link,active,starts_at,ends_at,activated_at,updated_by)
    VALUES(p_id,1,p_name,p_poster,p_cta_text,p_cta_link,p_active,p_starts,p_ends,CASE WHEN p_active THEN now() ELSE NULL END,p_actor)
    RETURNING * INTO result;
  ELSE
    SELECT * INTO current_row FROM public.medresa_campaigns WHERE id=p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Campaign missing' USING ERRCODE='P0002'; END IF;
    IF current_row.revision <> p_expected THEN RAISE EXCEPTION 'Campaign changed' USING ERRCODE='40001'; END IF;
    UPDATE public.medresa_campaigns SET revision=revision+1,name=p_name,poster_id=p_poster,cta_text=p_cta_text,cta_link=p_cta_link,
      active=p_active,starts_at=p_starts,ends_at=p_ends,updated_at=now(),updated_by=p_actor,
      activated_at=CASE WHEN p_active AND NOT current_row.active THEN now() ELSE current_row.activated_at END
    WHERE id=p_id RETURNING * INTO result;
  END IF;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.medresa_campaign_save(uuid,bigint,text,uuid,text,text,boolean,timestamptz,timestamptz,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.medresa_campaign_save(uuid,bigint,text,uuid,text,text,boolean,timestamptz,timestamptz,text) TO service_role;
-- Dedicated original-artwork bucket; no public/browser policies, no asset overwrite.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('medresa-campaigns-preview','medresa-campaigns-preview',false,4194304,ARRAY['image/jpeg','image/png','image/webp']);
COMMIT;
