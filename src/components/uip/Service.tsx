import { service } from "@/content/uip";

/**
 * Vaspitna služba (Tuzi): the two educational-service teams, set as a
 * personnel register — team, coordinator where the source names one, members.
 * Separate from the academic directory on purpose.
 */
export function Service() {
  return (
    <section aria-labelledby="uip-sluzba" className="bg-ivory">
      <div className="wrap py-14 md:py-20 lg:grid lg:grid-cols-12 lg:gap-x-12 lg:py-24">
        <div className="lg:col-span-4">
          <h2
            id="uip-sluzba"
            className="display text-[clamp(1.75rem,1.2rem+2vw,2.75rem)] leading-[1.05] tracking-[-0.02em] text-green"
          >
            Vaspitna služba
          </h2>
          <p className="mt-2 text-[0.8125rem] text-ink-soft">
            {service.location} · {service.year}
          </p>
        </div>
        <div className="mt-8 grid gap-y-10 md:grid-cols-2 md:gap-x-10 lg:col-span-8 lg:mt-0">
          {service.teams.map((t) => (
            <div key={t.title} className="border-t border-gold/60 pt-4 md:pt-5">
              <h3 className="eyebrow text-[0.6875rem] text-gold-deep md:text-xs">
                <span className="sr-only">Vaspitna služba – </span>
                {t.short}
              </h3>
              {t.coordinator && (
                <div className="mt-4">
                  <p className="text-[0.8125rem] text-ink-soft">Koordinator</p>
                  <p className="display mt-1 text-[1.5rem] leading-[1.15] tracking-[-0.01em] text-green md:text-[1.625rem]">
                    {t.coordinator}
                  </p>
                </div>
              )}
              <ul className={`grid grid-cols-2 gap-x-6 ${t.coordinator ? "mt-5" : "mt-4"}`}>
                {t.members.map((m) => (
                  <li
                    key={m}
                    className="border-b border-ink/[0.07] py-2.5 text-[1rem] leading-[1.3] text-ink"
                  >
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
