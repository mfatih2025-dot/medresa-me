-- Apply only to medresa-me-preview. Additive: no existing News/Analytics/Campaign changes.
BEGIN;
CREATE TABLE public.medresa_results_assets (
 id uuid PRIMARY KEY, locale text NOT NULL CHECK(locale IN ('bs','sq','en')),
 filename text NOT NULL CHECK(length(filename) BETWEEN 1 AND 180 AND filename !~ '[[:cntrl:]/\\]'),
 bucket text NOT NULL DEFAULT 'medresa-results-preview' CHECK(bucket='medresa-results-preview'),
 object_path text NOT NULL UNIQUE CHECK(object_path='documents/'||id::text||'.pdf'),
 bytes integer NOT NULL CHECK(bytes BETWEEN 1 AND 5242880), pages integer NOT NULL CHECK(pages>0),
 sha256 text NOT NULL CHECK(sha256 ~ '^[a-f0-9]{64}$'),
 created_at timestamptz NOT NULL DEFAULT now(),created_by text NOT NULL CHECK(length(btrim(created_by))>0)
);
CREATE TABLE public.medresa_results_publications (
 id uuid PRIMARY KEY, version bigint NOT NULL UNIQUE CHECK(version>0),
 bs_id uuid NOT NULL REFERENCES public.medresa_results_assets(id),
 sq_id uuid NOT NULL REFERENCES public.medresa_results_assets(id),
 en_id uuid NOT NULL REFERENCES public.medresa_results_assets(id),
 published_at timestamptz NOT NULL DEFAULT now(),published_by text NOT NULL CHECK(length(btrim(published_by))>0)
);
CREATE TABLE public.medresa_results_state (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),revision bigint NOT NULL DEFAULT 0 CHECK(revision>=0),
 bs_id uuid REFERENCES public.medresa_results_assets(id),sq_id uuid REFERENCES public.medresa_results_assets(id),en_id uuid REFERENCES public.medresa_results_assets(id),
 publication_id uuid REFERENCES public.medresa_results_publications(id),updated_at timestamptz NOT NULL DEFAULT now()
);
-- Empty control row, not seeded results/content.
INSERT INTO public.medresa_results_state(singleton) VALUES(true);
CREATE TABLE public.medresa_results_uploads (
 id uuid PRIMARY KEY, locale text NOT NULL CHECK(locale IN ('bs','sq','en')),
 filename text NOT NULL CHECK(length(filename) BETWEEN 1 AND 180 AND filename !~ '[[:cntrl:]/\\]'),
 bytes integer NOT NULL CHECK(bytes BETWEEN 1 AND 5242880),base_revision bigint NOT NULL CHECK(base_revision>=0),
 created_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz NOT NULL DEFAULT(now()+interval '1 hour'),created_by text NOT NULL CHECK(length(btrim(created_by))>0),
 asset_id uuid REFERENCES public.medresa_results_assets(id)
);
ALTER TABLE public.medresa_results_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medresa_results_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medresa_results_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medresa_results_uploads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.medresa_results_assets,public.medresa_results_publications,public.medresa_results_state,public.medresa_results_uploads FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,INSERT ON public.medresa_results_assets,public.medresa_results_publications,public.medresa_results_uploads TO service_role;
GRANT SELECT,UPDATE ON public.medresa_results_state TO service_role;
GRANT UPDATE(asset_id) ON public.medresa_results_uploads TO service_role;
CREATE FUNCTION public.medresa_results_locale_guard() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 IF (NEW.bs_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.medresa_results_assets WHERE id=NEW.bs_id AND locale='bs')) OR
 (NEW.sq_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.medresa_results_assets WHERE id=NEW.sq_id AND locale='sq')) OR
 (NEW.en_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.medresa_results_assets WHERE id=NEW.en_id AND locale='en')) THEN RAISE EXCEPTION 'Wrong PDF locale' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER medresa_results_draft_locales BEFORE INSERT OR UPDATE ON public.medresa_results_state FOR EACH ROW EXECUTE FUNCTION public.medresa_results_locale_guard();
CREATE TRIGGER medresa_results_publication_locales BEFORE INSERT ON public.medresa_results_publications FOR EACH ROW EXECUTE FUNCTION public.medresa_results_locale_guard();
CREATE FUNCTION public.medresa_results_immutable() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN RAISE EXCEPTION 'Result history is immutable' USING ERRCODE='55000'; END;
$$;
CREATE TRIGGER medresa_results_assets_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON public.medresa_results_assets FOR EACH STATEMENT EXECUTE FUNCTION public.medresa_results_immutable();
CREATE TRIGGER medresa_results_publications_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON public.medresa_results_publications FOR EACH STATEMENT EXECUTE FUNCTION public.medresa_results_immutable();
CREATE FUNCTION public.medresa_results_remove_draft(p_locale text,p_expected bigint) RETURNS public.medresa_results_state LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE s public.medresa_results_state;
BEGIN
 IF p_locale NOT IN ('bs','sq','en') OR p_locale IS NULL THEN RAISE EXCEPTION 'Invalid locale' USING ERRCODE='22023'; END IF;
 SELECT * INTO s FROM public.medresa_results_state WHERE singleton FOR UPDATE;
 IF p_expected IS NULL OR s.revision<>p_expected THEN RAISE EXCEPTION 'Results changed' USING ERRCODE='40001'; END IF;
 UPDATE public.medresa_results_state SET bs_id=CASE WHEN p_locale='bs' THEN NULL ELSE bs_id END,sq_id=CASE WHEN p_locale='sq' THEN NULL ELSE sq_id END,en_id=CASE WHEN p_locale='en' THEN NULL ELSE en_id END,revision=revision+1,updated_at=now() WHERE singleton RETURNING * INTO s;
 RETURN s;
END;
$$;
CREATE FUNCTION public.medresa_results_finalize(p_upload uuid,p_expected bigint,p_sha256 text,p_pages integer,p_actor text) RETURNS public.medresa_results_state LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE s public.medresa_results_state; u public.medresa_results_uploads;
BEGIN
 SELECT * INTO s FROM public.medresa_results_state WHERE singleton FOR UPDATE;
 SELECT * INTO u FROM public.medresa_results_uploads WHERE id=p_upload FOR UPDATE;
 IF NOT FOUND OR u.created_by IS DISTINCT FROM p_actor OR u.expires_at<=now() THEN RAISE EXCEPTION 'Upload unavailable' USING ERRCODE='22023'; END IF;
 IF u.asset_id IS NOT NULL THEN RETURN s; END IF;
 IF p_expected IS NULL OR s.revision<>p_expected OR u.base_revision<>p_expected THEN RAISE EXCEPTION 'Results changed' USING ERRCODE='40001'; END IF;
 INSERT INTO public.medresa_results_assets(id,locale,filename,object_path,bytes,pages,sha256,created_by) VALUES(u.id,u.locale,u.filename,'documents/'||u.id::text||'.pdf',u.bytes,p_pages,p_sha256,p_actor);
 UPDATE public.medresa_results_state SET bs_id=CASE WHEN u.locale='bs' THEN u.id ELSE bs_id END,sq_id=CASE WHEN u.locale='sq' THEN u.id ELSE sq_id END,en_id=CASE WHEN u.locale='en' THEN u.id ELSE en_id END,revision=revision+1,updated_at=now() WHERE singleton RETURNING * INTO s;
 UPDATE public.medresa_results_uploads SET asset_id=u.id WHERE id=u.id;
 RETURN s;
END;
$$;
CREATE FUNCTION public.medresa_results_publish(p_id uuid,p_expected bigint,p_actor text) RETURNS public.medresa_results_state LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE s public.medresa_results_state;
BEGIN
 SELECT * INTO s FROM public.medresa_results_state WHERE singleton FOR UPDATE;
 IF s.publication_id=p_id THEN RETURN s; END IF;
 IF p_expected IS NULL OR s.revision<>p_expected THEN RAISE EXCEPTION 'Results changed' USING ERRCODE='40001'; END IF;
 IF p_actor IS NULL OR length(btrim(p_actor))=0 OR s.bs_id IS NULL OR s.sq_id IS NULL OR s.en_id IS NULL THEN RAISE EXCEPTION 'Complete results required' USING ERRCODE='22023'; END IF;
 INSERT INTO public.medresa_results_publications(id,version,bs_id,sq_id,en_id,published_by) VALUES(p_id,s.revision+1,s.bs_id,s.sq_id,s.en_id,p_actor);
 UPDATE public.medresa_results_state SET publication_id=p_id,revision=revision+1,updated_at=now() WHERE singleton RETURNING * INTO s;
 RETURN s;
END;
$$;
REVOKE ALL ON FUNCTION public.medresa_results_locale_guard(),public.medresa_results_immutable(),public.medresa_results_remove_draft(text,bigint),public.medresa_results_finalize(uuid,bigint,text,integer,text),public.medresa_results_publish(uuid,bigint,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.medresa_results_locale_guard(),public.medresa_results_immutable(),public.medresa_results_remove_draft(text,bigint),public.medresa_results_finalize(uuid,bigint,text,integer,text),public.medresa_results_publish(uuid,bigint,text) TO service_role;
-- Chunk objects are private transport only. Final documents are validated PDFs.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('medresa-results-preview','medresa-results-preview',false,5242880,ARRAY['application/pdf','application/octet-stream']);
COMMIT;
