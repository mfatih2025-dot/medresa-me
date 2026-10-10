-- Apply ONLY to medresa-me-preview, after existing Campaign/Results migrations.
-- Add independent locale channels; preserve existing content, assets and history.
BEGIN;
ALTER TABLE public.medresa_campaigns ADD COLUMN locale_active jsonb NOT NULL DEFAULT '{"bs":false,"sq":false,"en":false}';
-- Existing active campaigns were complete in all locales: retain their visibility/version.
UPDATE public.medresa_campaigns SET locale_active=jsonb_build_object('bs',active,'sq',active,'en',active);
CREATE FUNCTION public.medresa_campaign_channels_valid(content jsonb, channels jsonb)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE l text; pair jsonb; destination text;
BEGIN
 IF content IS NULL OR channels IS NULL OR jsonb_typeof(content)<>'object' OR jsonb_typeof(channels)<>'object'
 OR (SELECT count(*) FROM jsonb_object_keys(content))<>3 OR (SELECT count(*) FROM jsonb_object_keys(channels))<>3 THEN RETURN false; END IF;
 FOREACH l IN ARRAY ARRAY['bs','sq','en'] LOOP
  pair:=content->l;
  IF pair IS NULL OR jsonb_typeof(pair)<>'object' OR (SELECT count(*) FROM jsonb_object_keys(pair))<>2
  OR jsonb_typeof(pair->'text') IS DISTINCT FROM 'string' OR jsonb_typeof(pair->'link') IS DISTINCT FROM 'string'
  OR jsonb_typeof(channels->l) IS DISTINCT FROM 'boolean' OR length(pair->>'text')>80 OR length(pair->>'link')>2048 THEN RETURN false; END IF;
  IF (channels->>l)::boolean THEN
   destination:=pair->>'link';
   IF length(btrim(pair->>'text'))=0 OR destination='' OR destination ~ '[[:space:][:cntrl:]\\]'
   OR NOT (destination ~ '^/[^/]' OR destination='/' OR destination ~ '^https://[^/@]+')
   OR destination ~* '^/(admin|api)(/|[?#]|$)' THEN RETURN false; END IF;
  END IF;
 END LOOP;
 RETURN true;
END;
$$;
ALTER TABLE public.medresa_campaigns DROP CONSTRAINT medresa_campaign_complete_activation;
ALTER TABLE public.medresa_campaigns DROP CONSTRAINT medresa_campaign_localized_content;
ALTER TABLE public.medresa_campaigns ADD CONSTRAINT medresa_campaign_locale_activation
 CHECK(public.medresa_campaign_channels_valid(cta_localizations,locale_active)
 AND active=(locale_active @> '{"bs":true}' OR locale_active @> '{"sq":true}' OR locale_active @> '{"en":true}'));
CREATE FUNCTION public.medresa_campaign_save_channels(p_id uuid,p_expected bigint,p_name text,p_poster uuid,p_content jsonb,p_channels jsonb,p_starts timestamptz,p_ends timestamptz,p_actor text)
RETURNS public.medresa_campaigns LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE current_row public.medresa_campaigns; result public.medresa_campaigns; p_active boolean;
BEGIN
  IF p_expected IS NULL OR p_expected<0 OR p_expected>9007199254740990 OR p_actor IS NULL OR length(btrim(p_actor))=0 THEN RAISE EXCEPTION 'Invalid campaign save' USING ERRCODE='22023'; END IF;
  IF NOT public.medresa_campaign_channels_valid(p_content,p_channels) THEN RAISE EXCEPTION 'Invalid localized content' USING ERRCODE='22023'; END IF;
  p_active := p_channels @> '{"bs":true}' OR p_channels @> '{"sq":true}' OR p_channels @> '{"en":true}';
  IF p_expected=0 THEN
    INSERT INTO public.medresa_campaigns(id,revision,name,poster_id,cta_text,cta_link,cta_localizations,locale_active,active,starts_at,ends_at,activated_at,updated_by)
    VALUES(p_id,1,p_name,p_poster,p_content->'bs'->>'text',p_content->'bs'->>'link',p_content,p_channels,p_active,p_starts,p_ends,CASE WHEN p_active THEN now() ELSE NULL END,p_actor) RETURNING * INTO result;
  ELSE
    SELECT * INTO current_row FROM public.medresa_campaigns WHERE id=p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Campaign missing' USING ERRCODE='P0002'; END IF;
    IF current_row.revision<>p_expected THEN RAISE EXCEPTION 'Campaign changed' USING ERRCODE='40001'; END IF;
    UPDATE public.medresa_campaigns SET revision=revision+1,name=p_name,poster_id=p_poster,cta_text=p_content->'bs'->>'text',cta_link=p_content->'bs'->>'link',cta_localizations=p_content,locale_active=p_channels,
    active=p_active,starts_at=p_starts,ends_at=p_ends,updated_at=now(),updated_by=p_actor,activated_at=CASE WHEN p_active AND NOT current_row.active THEN now() ELSE current_row.activated_at END
    WHERE id=p_id RETURNING * INTO result;
  END IF;
  RETURN result;
END;
$$;

-- Retire superseded all-locale mutation, retaining existing history/functions.
REVOKE EXECUTE ON FUNCTION public.medresa_campaign_save_localized(uuid,bigint,text,uuid,jsonb,boolean,timestamptz,timestamptz,text) FROM service_role;
REVOKE ALL ON FUNCTION public.medresa_campaign_channels_valid(jsonb,jsonb),public.medresa_campaign_save_channels(uuid,bigint,text,uuid,jsonb,jsonb,timestamptz,timestamptz,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.medresa_campaign_channels_valid(jsonb,jsonb),public.medresa_campaign_save_channels(uuid,bigint,text,uuid,jsonb,jsonb,timestamptz,timestamptz,text) TO service_role;

-- New immutable per-locale Results history; old complete releases are retained.
CREATE TABLE public.medresa_results_locale_publications (
 id uuid PRIMARY KEY,locale text NOT NULL CHECK(locale IN ('bs','sq','en')),
 version bigint NOT NULL CHECK(version>0),asset_id uuid NOT NULL REFERENCES public.medresa_results_assets(id),
 published_at timestamptz NOT NULL DEFAULT now(),published_by text NOT NULL CHECK(length(btrim(published_by))>0),
 UNIQUE(locale,version),UNIQUE(id,locale)
);
CREATE TABLE public.medresa_results_locale_heads (
 locale text PRIMARY KEY CHECK(locale IN ('bs','sq','en')),publication_id uuid NOT NULL,
 FOREIGN KEY(publication_id,locale) REFERENCES public.medresa_results_locale_publications(id,locale)
);
CREATE FUNCTION public.medresa_results_locale_asset_guard() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.medresa_results_assets WHERE id=NEW.asset_id AND locale=NEW.locale) THEN RAISE EXCEPTION 'Wrong PDF locale' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER medresa_results_locale_asset_guard BEFORE INSERT ON public.medresa_results_locale_publications FOR EACH ROW EXECUTE FUNCTION public.medresa_results_locale_asset_guard();
CREATE TRIGGER medresa_results_locale_history_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON public.medresa_results_locale_publications FOR EACH STATEMENT EXECUTE FUNCTION public.medresa_results_immutable();
-- Backfill all existing published releases without changing originals or timestamps.
INSERT INTO public.medresa_results_locale_publications(id,locale,version,asset_id,published_at,published_by)
 SELECT gen_random_uuid(),l.locale,p.version,CASE l.locale WHEN 'bs' THEN p.bs_id WHEN 'sq' THEN p.sq_id ELSE p.en_id END,p.published_at,p.published_by
 FROM public.medresa_results_publications p CROSS JOIN (VALUES('bs'),('sq'),('en')) l(locale);
INSERT INTO public.medresa_results_locale_heads(locale,publication_id)
 SELECT p.locale,p.id FROM public.medresa_results_locale_publications p JOIN public.medresa_results_state s ON s.singleton
 JOIN public.medresa_results_publications original ON original.id=s.publication_id AND original.version=p.version;
ALTER TABLE public.medresa_results_locale_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medresa_results_locale_heads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.medresa_results_locale_publications,public.medresa_results_locale_heads FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,INSERT ON public.medresa_results_locale_publications TO service_role;
GRANT SELECT,INSERT,UPDATE ON public.medresa_results_locale_heads TO service_role;
CREATE FUNCTION public.medresa_results_publish_locale(p_id uuid,p_expected bigint,p_locale text,p_actor text)
RETURNS public.medresa_results_state LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE s public.medresa_results_state; selected uuid;
BEGIN
 IF p_locale IS NULL OR p_locale NOT IN ('bs','sq','en') OR p_actor IS NULL OR length(btrim(p_actor))=0 THEN RAISE EXCEPTION 'Invalid result locale' USING ERRCODE='22023'; END IF;
 SELECT * INTO s FROM public.medresa_results_state WHERE singleton FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.medresa_results_locale_heads WHERE locale=p_locale AND publication_id=p_id) THEN RETURN s; END IF;
 IF p_expected IS NULL OR s.revision<>p_expected THEN RAISE EXCEPTION 'Results changed' USING ERRCODE='40001'; END IF;
 selected:=CASE p_locale WHEN 'bs' THEN s.bs_id WHEN 'sq' THEN s.sq_id ELSE s.en_id END;
 IF selected IS NULL THEN RAISE EXCEPTION 'Selected locale PDF required' USING ERRCODE='22023'; END IF;
 INSERT INTO public.medresa_results_locale_publications(id,locale,version,asset_id,published_by) VALUES(p_id,p_locale,s.revision+1,selected,p_actor);
 INSERT INTO public.medresa_results_locale_heads(locale,publication_id) VALUES(p_locale,p_id)
 ON CONFLICT(locale) DO UPDATE SET publication_id=excluded.publication_id;
 UPDATE public.medresa_results_state SET revision=revision+1,updated_at=now() WHERE singleton RETURNING * INTO s;
 RETURN s;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.medresa_results_publish(uuid,bigint,text) FROM service_role;
REVOKE ALL ON FUNCTION public.medresa_results_locale_asset_guard(),public.medresa_results_publish_locale(uuid,bigint,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.medresa_results_locale_asset_guard(),public.medresa_results_publish_locale(uuid,bigint,text,text) TO service_role;
COMMIT;
