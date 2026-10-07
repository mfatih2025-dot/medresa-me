"use client";
import { useEffect, useState } from "react";
import { Article } from "@/components/vijesti/Article";
import type { NewsArticle } from "@/content/vijesti/types";
import { articles } from "@/content/vijesti";
import { canonicalJson } from "./contracts";
import { isLocale, type Locale } from "@/i18n/config";
/** Private bridge only. The actual production component decides all article presentation. */
export function PreviewReceiver() {
  const [preview, setPreview] = useState<{ article: NewsArticle; locale: Locale } | null>(null);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.type !== "medresa-draft-preview" || !isLocale(event.data.locale)) return;
      setPreview({ article: event.data.article, locale: event.data.locale });
    };
    window.addEventListener("message", receive);
    window.parent.postMessage({ type: "medresa-preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", receive);
  }, []);
  if (!preview) return <p style={{ padding: "120px 24px" }}>Čeka se trenutni nacrt iz urednika.</p>;
  const original = articles.find(a => a.id === preview.article.id);
  const article = original && canonicalJson(original) === canonicalJson(preview.article) ? original : preview.article;
  return <div lang={preview.locale}><Article key={`${article.id}-${preview.locale}`} a={article} locale={preview.locale} /></div>;
}
