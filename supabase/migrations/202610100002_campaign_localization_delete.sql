-- Apply only to medresa-me-preview. Preserve every campaign and original BS CTA.
BEGIN;
ALTER TABLE public.medresa_campaigns ADD COLUMN cta_localizations jsonb;
UPDATE public.medresa_campaigns SET cta_localizations=jsonb_build_object(
  'bs',jsonb_build_object('text',cta_text,'link',cta_link),
  'sq',jsonb_build_object('text','','link',''),
  'en',jsonb_build_object('text','','link',''));
ALTER TABLE public.medresa_campaigns ALTER COLUMN cta_localizations SET NOT NULL;
ALTER TABLE public.medresa_campaigns DROP CONSTRAINT medresa_campaigns_cta_text_check;
ALTER TABLE public.medresa_campaigns DROP CONSTRAINT medresa_campaigns_cta_link_check;
ALTER TABLE public.medresa_campaign_assets ADD COLUMN cleanup_pending boolean NOT NULL DEFAULT false;
CREATE FUNCTION public.medresa_campaign_content_valid(content jsonb, require_complete boolean)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE locale text; pair jsonb; label text; destination text;
BEGIN
  IF content IS NULL OR jsonb_typeof(content)<>'object' OR (SELECT count(*) FROM jsonb_object_keys(content))<>3 THEN RETURN false; END IF;
  FOREACH locale IN ARRAY ARRAY['bs','sq','en'] LOOP
    pair:=content->locale;
    IF pair IS NULL OR jsonb_typeof(pair)<>'object' OR jsonb_typeof(pair->'text') IS DISTINCT FROM 'string' OR jsonb_typeof(pair->'link') IS DISTINCT FROM 'string' THEN RETURN false; END IF;
    IF (SELECT count(*) FROM jsonb_object_keys(pair))<>2 THEN RETURN false; END IF;
    label:=pair->>'text'; destination:=pair->>'link';
    IF length(label)>80 OR length(destination)>2048 THEN RETURN false; END IF;
    IF require_complete AND (length(btrim(label))=0 OR destination='') THEN RETURN false; END IF;
    IF destination<>'' AND (destination ~ '[[:space:][:cntrl:]\\]' OR NOT (destination ~ '^/[^/]' OR destination='/' OR destination ~ '^https://[^/@]+') OR destination ~* '^/(admin|api)(/|[?#]|$)') THEN RETURN false; END IF;
  END LOOP;
  RETURN true;
END;
$$;
-- Existing campaigns remain intact and editable, but cannot display with missing SQ/EN.
-- Increment the shared version only when deactivating an existing active campaign.
UPDATE public.medresa_campaigns SET active=false,revision=revision+1,updated_at=now() WHERE active;
ALTER TABLE public.medresa_campaigns ADD CONSTRAINT medresa_campaign_localized_content CHECK(public.medresa_campaign_content_valid(cta_localizations,false));
ALTER TABLE public.medresa_campaigns ADD CONSTRAINT medresa_campaign_complete_activation CHECK(NOT active OR public.medresa_campaign_content_valid(cta_localizations,true));
ALTER TABLE public.medresa_campaigns ADD CONSTRAINT medresa_campaign_bs_consistent CHECK(cta_text=cta_localizations->'bs'->>'text' AND cta_link=cta_localizations->'bs'->>'link');
-- Serialize asset references against cleanup reservation, including direct table writes.
CREATE FUNCTION public.medresa_campaign_asset_guard() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE pending boolean;
BEGIN
  IF NEW.poster_id IS NOT NULL THEN
    SELECT cleanup_pending INTO pending FROM public.medresa_campaign_assets WHERE id=NEW.poster_id FOR UPDATE;
    IF NOT FOUND OR pending THEN RAISE EXCEPTION 'Poster unavailable' USING ERRCODE='23503'; END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER medresa_campaign_asset_guard BEFORE INSERT OR UPDATE OF poster_id ON public.medresa_campaigns FOR EACH ROW EXECUTE FUNCTION public.medresa_campaign_asset_guard();
CREATE FUNCTION public.medresa_campaign_save_localized(p_id uuid,p_expected bigint,p_name text,p_poster uuid,p_content jsonb,p_active boolean,p_starts timestamptz,p_ends timestamptz,p_actor text)
RETURNS public.medresa_campaigns LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE current_row public.medresa_campaigns; result public.medresa_campaigns;
BEGIN
  IF p_expected IS NULL OR p_expected<0 OR p_expected>9007199254740990 OR p_actor IS NULL OR length(btrim(p_actor))=0 THEN RAISE EXCEPTION 'Invalid campaign save' USING ERRCODE='22023'; END IF;
  IF NOT public.medresa_campaign_content_valid(p_content,p_active) THEN RAISE EXCEPTION 'Invalid localized content' USING ERRCODE='22023'; END IF;
  IF p_expected=0 THEN
    INSERT INTO public.medresa_campaigns(id,revision,name,poster_id,cta_text,cta_link,cta_localizations,active,starts_at,ends_at,activated_at,updated_by)
    VALUES(p_id,1,p_name,p_poster,p_content->'bs'->>'text',p_content->'bs'->>'link',p_content,p_active,p_starts,p_ends,CASE WHEN p_active THEN now() ELSE NULL END,p_actor) RETURNING * INTO result;
  ELSE
    SELECT * INTO current_row FROM public.medresa_campaigns WHERE id=p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Campaign missing' USING ERRCODE='P0002'; END IF;
    IF current_row.revision<>p_expected THEN RAISE EXCEPTION 'Campaign changed' USING ERRCODE='40001'; END IF;
    UPDATE public.medresa_campaigns SET revision=revision+1,name=p_name,poster_id=p_poster,cta_text=p_content->'bs'->>'text',cta_link=p_content->'bs'->>'link',cta_localizations=p_content,
    active=p_active,starts_at=p_starts,ends_at=p_ends,updated_at=now(),updated_by=p_actor,activated_at=CASE WHEN p_active AND NOT current_row.active THEN now() ELSE current_row.activated_at END
    WHERE id=p_id RETURNING * INTO result;
  END IF;
  RETURN result;
END;
$$;
CREATE FUNCTION public.medresa_campaign_delete(p_id uuid,p_expected bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE campaign public.medresa_campaigns; asset public.medresa_campaign_assets;
BEGIN
  SELECT * INTO campaign FROM public.medresa_campaigns WHERE id=p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Campaign missing' USING ERRCODE='P0002'; END IF;
  IF p_expected IS NULL OR campaign.revision<>p_expected THEN RAISE EXCEPTION 'Campaign changed' USING ERRCODE='40001'; END IF;
  IF campaign.poster_id IS NOT NULL THEN SELECT * INTO asset FROM public.medresa_campaign_assets WHERE id=campaign.poster_id FOR UPDATE; END IF;
  DELETE FROM public.medresa_campaigns WHERE id=p_id;
  IF asset.id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.medresa_campaigns WHERE poster_id=asset.id) THEN
    UPDATE public.medresa_campaign_assets SET cleanup_pending=true WHERE id=asset.id;
    RETURN jsonb_build_object('asset_id',asset.id,'object_path',asset.object_path,'extension',CASE asset.mime WHEN 'image/jpeg' THEN 'jpg' WHEN 'image/png' THEN 'png' ELSE 'webp' END);
  END IF;
  RETURN '{}'::jsonb;
END;
$$;
CREATE FUNCTION public.medresa_campaign_finish_cleanup(p_asset uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
  DELETE FROM public.medresa_campaign_assets WHERE id=p_asset AND cleanup_pending AND NOT EXISTS(SELECT 1 FROM public.medresa_campaigns WHERE poster_id=p_asset);
END;
$$;
-- Retire only the superseded single-language write RPC. Do not rerun the original migration.
REVOKE EXECUTE ON FUNCTION public.medresa_campaign_save(uuid,bigint,text,uuid,text,text,boolean,timestamptz,timestamptz,text) FROM service_role;
GRANT DELETE ON public.medresa_campaigns TO service_role;
GRANT UPDATE(cleanup_pending), DELETE ON public.medresa_campaign_assets TO service_role;
REVOKE ALL ON FUNCTION public.medresa_campaign_content_valid(jsonb,boolean),public.medresa_campaign_asset_guard(),public.medresa_campaign_save_localized(uuid,bigint,text,uuid,jsonb,boolean,timestamptz,timestamptz,text),public.medresa_campaign_delete(uuid,bigint),public.medresa_campaign_finish_cleanup(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.medresa_campaign_content_valid(jsonb,boolean),public.medresa_campaign_asset_guard(),public.medresa_campaign_save_localized(uuid,bigint,text,uuid,jsonb,boolean,timestamptz,timestamptz,text),public.medresa_campaign_delete(uuid,bigint),public.medresa_campaign_finish_cleanup(uuid) TO service_role;
COMMIT;
