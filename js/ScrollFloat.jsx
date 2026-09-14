/*
 * ScrollFloat — React Bits (https://reactbits.dev/text-animations/scroll-float)
 * Adapted for a no-build static site:
 *   - React / gsap / ScrollTrigger are loaded as CDN globals (no bundler)
 *   - optional `as` prop picks the wrapper tag (defaults to "h2")
 *   - optional `html` prop lets rich existing HTML float in as one block;
 *     plain-string children still get the official per-character split
 *   - styles live in js/ScrollFloat.css (linked from index.html)
 */
(() => {
const { useEffect, useMemo, useRef } = React;
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

gsap.registerPlugin(ScrollTrigger);

const ScrollFloat = ({
  children,
  html = '',
  as = 'h2',
  containerClassName = '',
  textClassName = '',
  animationDuration = 1,
  ease = 'back.inOut(2)',
  scrollStart = 'center bottom+=50%',
  scrollEnd = 'bottom bottom-=40%',
  stagger = 0.03,
  scrub = true
}) => {
  const containerRef = useRef(null);
  const Tag = as;

  const splitText = useMemo(() => {
    const text = typeof children === 'string' ? children : '';
    return text.split('').map((char, index) => (
      <span className="char" key={index}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scroller = window;

    const charElements = el.querySelectorAll('.char');
    const targets = charElements.length ? charElements : el.querySelectorAll('.scroll-float-text');
    if (!targets.length) return;

    gsap.fromTo(
      targets,
      {
        willChange: 'opacity, transform',
        opacity: 0,
        yPercent: 120,
        scaleY: 2.3,
        scaleX: 0.7,
        transformOrigin: '50% 0%'
      },
      {
        duration: animationDuration,
        ease: ease,
        opacity: 1,
        yPercent: 0,
        scaleY: 1,
        scaleX: 1,
        stagger: stagger,
        scrollTrigger: {
          trigger: el,
          scroller,
          start: scrub ? scrollStart : 'top 88%',
          end: scrollEnd,
          scrub: scrub ? true : false,
          toggleActions: scrub ? undefined : 'play none none reverse'
        }
      }
    );
  }, [animationDuration, ease, scrollStart, scrollEnd, stagger, scrub]);

  return (
    <Tag ref={containerRef} className={`scroll-float ${containerClassName}`.trim()}>
      <span
        className={`scroll-float-text ${textClassName}`.trim()}
        {...(html ? { dangerouslySetInnerHTML: { __html: html } } : {})}
      >
        {typeof children === 'string' ? splitText : children}
      </span>
    </Tag>
  );
};

window.ScrollFloat = ScrollFloat;
})();
