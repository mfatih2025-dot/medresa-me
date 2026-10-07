import { dictionaries } from "@/content";
import { NotFoundBody } from "@/components/i18n/NotFoundBody";

const text = {
  bs: { title: dictionaries.bs.ui.notFound, back: dictionaries.bs.ui.backHome },
  sq: { title: dictionaries.sq.ui.notFound, back: dictionaries.sq.ui.backHome },
  en: { title: dictionaries.en.ui.notFound, back: dictionaries.en.ui.backHome },
};

export default function NotFound() {
  return (
    <section className="geo bg-ivory pb-32 pt-36 md:pt-48">
      <NotFoundBody text={text} />
    </section>
  );
}
