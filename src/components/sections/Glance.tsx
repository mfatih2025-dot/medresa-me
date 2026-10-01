import type { Dictionary } from "@/content";
import { Reveal } from "@/components/ui/Reveal";

export function Glance({ dict }: { dict: Dictionary }) {
  const { glance } = dict;
  return (
    <section
      id="glance"
      aria-label={glance.label}
      className="relative border-t border-ink/10 bg-ivory py-16 md:py-24 lg:py-28"
    >
      <div className="wrap">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 xl:grid-cols-5 xl:gap-x-0">
          {glance.items.map((item, i) => (
            <Reveal
              as="li"
              key={item.value}
              delay={i * 0.08}
              className={`relative xl:px-7 xl:first:pl-0 xl:last:pr-0 ${
                i === glance.items.length - 1 ? "col-span-2 md:col-span-1" : ""
              } ${i > 0 ? "xl:border-l xl:border-gold/40" : ""}`}
            >
              <p className="display whitespace-nowrap text-[clamp(1.75rem,1rem+1.6vw,2.5rem)] font-normal leading-none text-green">
                {item.value}
              </p>
              <p className="mt-3 text-[0.9375rem] font-medium text-ink">{item.label}</p>
              <p className="mt-1 text-sm font-normal text-ink-soft">{item.note}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
