import Link from "next/link";

export default function NotFound() {
  return (
    <section className="geo bg-ivory pb-32 pt-48 md:pt-64">
      <div className="wrap">
        <p className="eyebrow mb-6 text-gold-deep">404</p>
        <h1 className="display h-section text-green">Stranica nije pronađena.</h1>
        <Link href="/" className="btn btn-green mt-10">
          Nazad na početnu
        </Link>
      </div>
    </section>
  );
}
