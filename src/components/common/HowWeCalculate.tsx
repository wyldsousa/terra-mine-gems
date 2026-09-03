import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAppState } from "@/hooks/useAppState";
import { formatPercent } from "@/lib/format";

export function HowWeCalculate() {
  const { t, tx, params } = useAppState();
  const steps = [
    t.how.step1,
    tx(t.how.step2, { step: formatPercent(params.levelStep * 100) }),
    t.how.step3,
    tx(t.how.step4, { daysMonth: params.daysPerMonth }),
    tx(t.how.step5, { boost: `${params.boostMultiplier}×` }),
    t.how.step6,
  ];

  return (
    <section className="panel p-5">
      <Accordion type="single" collapsible>
        <AccordionItem value="how" className="border-none">
          <AccordionTrigger className="py-0 font-display text-base font-semibold">
            {t.how.title}
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <ol className="space-y-2 text-sm text-muted-foreground">
              {steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-muted-foreground">{t.how.note}</p>
            <ul className="mt-4 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
              <li>⚠️ {t.disclaimer.estimates}</li>
              <li>• {t.disclaimer.vary}</li>
              <li>• {t.disclaimer.fees}</li>
              <li>• {t.disclaimer.check}</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
