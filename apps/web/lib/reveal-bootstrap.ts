import { REVEAL_TRIGGER } from "./reveal";

// If the bundle never arrives, the sections this script hid would stay hidden
// forever — the one catastrophe a marketing site cannot ship. `RevealObserver`
// marks the document live as soon as it runs; if that mark is missing after
// this long, the page un-hides itself and simply loses the animation.
const FALLBACK_MS = 4000;

/**
 * Inline script for the end of `<body>`. It measures a fully parsed page and
 * hides the sections that have not reached the trigger line, before the
 * browser's first paint.
 *
 * A React effect cannot do this job: effects run after the first paint, so
 * arming the section that peeks above the fold there would flash it out of
 * existence. The observer in `RevealObserver` still owns every reveal, and
 * every client-side navigation after this one.
 *
 * With JavaScript off the script never runs and nothing is ever hidden, which
 * is the same guarantee the CSS gives: no rule hides anything on its own.
 */
export const REVEAL_BOOTSTRAP = `(function(){
try{
if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
var h=innerHeight;if(!h)return;
var line=h*${1 - REVEAL_TRIGGER},els=document.querySelectorAll("[data-reveal]");
for(var i=0;i<els.length;i++){var r=els[i].getBoundingClientRect();
if(r.height>0&&r.top>=line)els[i].setAttribute("data-armed","");}
}catch(e){}
setTimeout(function(){
if(document.documentElement.hasAttribute("data-reveal-live"))return;
var a=document.querySelectorAll("[data-armed]");
for(var i=0;i<a.length;i++)a[i].removeAttribute("data-armed");
},${FALLBACK_MS});
})();`;
