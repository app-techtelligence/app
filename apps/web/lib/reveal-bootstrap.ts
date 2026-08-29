import { REVEAL_TRIGGER } from "./reveal";

// If the bundle never arrives, the sections this script hid would stay hidden
// forever — the one catastrophe a marketing site cannot ship. `RevealObserver`
// marks the document live as soon as it runs; if that mark is missing after
// this long, the page un-hides itself and simply loses the animation.
const FALLBACK_MS = 4000;

/**
 * Inline script for the end of `<body>`. It measures a fully parsed page and
 * hides every marked block before the browser's first paint — the ones already
 * on screen included. Two frames later it releases those, and that release is
 * the page's entrance: the layout arrives finished, the content rises into it.
 * Whatever is still short of the trigger line stays hidden and waits for
 * `RevealObserver` to scroll it into view.
 *
 * Two frames, not one. A transition animates away from the style the browser
 * last *rendered*, so the hidden state has to survive one paint; releasing
 * inside the first frame would swap the style before anything was drawn and
 * the content would simply be there.
 *
 * A React effect cannot do this job: effects run after the first paint, so
 * hiding anything visible from one would flash it out of existence first.
 *
 * With JavaScript off the script never runs and nothing is ever hidden, which
 * is the same guarantee the CSS gives: no rule hides anything on its own.
 */
export const REVEAL_BOOTSTRAP = `(function(){
try{
if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
var h=innerHeight;if(!h)return;
var line=h*${1 - REVEAL_TRIGGER},els=document.querySelectorAll("[data-reveal]"),now=[];
for(var i=0;i<els.length;i++){var el=els[i],r=el.getBoundingClientRect();
if(r.height>0){el.setAttribute("data-armed","");if(r.top<line)now.push(el);}}
requestAnimationFrame(function(){requestAnimationFrame(function(){
for(var j=0;j<now.length;j++)now[j].removeAttribute("data-armed");});});
}catch(e){}
setTimeout(function(){
if(document.documentElement.hasAttribute("data-reveal-live"))return;
var a=document.querySelectorAll("[data-armed]");
for(var i=0;i<a.length;i++)a[i].removeAttribute("data-armed");
},${FALLBACK_MS});
})();`;
