export type ConversionFaqItem = {
  question: string;
  answer: string;
};

export default function ConversionFaq({
  title = "Questions students often ask before starting",
  intro,
  items,
}: {
  title?: string;
  intro?: string;
  items: ConversionFaqItem[];
}) {
  return (
    <section className="section conversion-faq-section">
      <div className="shell conversion-faq-shell">
        <div className="conversion-faq-intro">
          <div className="eyebrow">BEFORE YOU START</div>
          <h2>{title}</h2>
          {intro ? <p className="section-intro">{intro}</p> : null}
        </div>
        <div className="conversion-faq-list">
          {items.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
