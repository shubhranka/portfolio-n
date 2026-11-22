import { sentinelSim as d } from '../extras';
import { esc } from '../lib/dom';

type Phase = 'idle' | 'alert' | 'done' | 'declined';

const inr = (n: number) => `${n < 0 ? '−' : ''}₹${Math.abs(n).toLocaleString('en-IN')}`;

const rentStatus: Record<Phase, [string, string]> = {
  idle: ['Will clear', 'ok'],
  alert: ['At risk', 'warn'],
  done: ['Covered', 'ok'],
  declined: ['Will fail', 'bad'],
};

/** Sentinel's buy → warn → approve flow, run entirely in the page. */
export function mountSentinel(host: HTMLElement) {
  host.innerHTML = `
    <div class="demo-card">
      <div class="demo-head">
        <div><span class="eyebrow">${esc(d.eyebrow)}</span><h2 class="demo-title">${esc(d.title)}</h2></div>
        <button class="btn btn-sm" type="button" data-act="reset">Reset demo</button>
      </div>
      <div class="sim">
        <div class="sim-panel">
          <span class="sim-label">Your accounts</span>
          <dl class="sim-rows">
            <div><dt>Checking</dt><dd data-v="checking"></dd></div>
            <div><dt>Liquid fund</dt><dd data-v="fund"></dd></div>
            <div class="sim-rent"><dt>Rent · due tomorrow</dt><dd>${inr(d.rent)}</dd></div>
          </dl>
          <span class="pill" data-v="rent"></span>
        </div>
        <div class="sim-panel sim-shop">
          <span class="sim-label">Shop</span>
          <div class="sim-art" aria-hidden="true">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="7" rx="2"/><rect x="17" y="14" width="4" height="7" rx="2"/></svg>
          </div>
          <b>${esc(d.item.name)}</b>
          <span class="sim-price">${inr(d.item.price)}</span>
          <button class="btn btn-primary sim-buy" type="button" data-act="buy"></button>
        </div>
        <div class="sim-panel sim-agent">
          <span class="sim-label sim-dot">Sentinel</span>
          <p class="sim-msg" aria-live="polite"></p>
          <div class="sim-actions">
            <button class="btn btn-primary btn-sm" type="button" data-act="approve">Approve</button>
            <button class="btn btn-sm" type="button" data-act="decline">Not now</button>
          </div>
          <span class="sim-foot">${esc(d.footnote)}</span>
        </div>
      </div>
    </div>`;

  const $ = (sel: string) => host.querySelector<HTMLElement>(sel)!;
  const buy = $('[data-act="buy"]') as HTMLButtonElement;
  const actions = $('.sim-actions');
  let phase: Phase = 'idle';

  const fill = (s: string, checking: number) =>
    s.replace('{checking}', inr(checking)).replace('{rent}', inr(d.rent)).replace(/\{transfer\}/g, inr(d.transfer));

  function render() {
    const bought = phase !== 'idle';
    const checking = phase === 'idle' ? d.checking : phase === 'done' ? d.checking - d.item.price + d.transfer : d.checking - d.item.price;
    const fund = phase === 'done' ? d.fund - d.transfer : d.fund;
    const check = $('[data-v="checking"]');
    check.textContent = inr(checking);
    check.classList.toggle('neg', checking < 0);
    $('[data-v="fund"]').textContent = inr(fund);
    const [label, tone] = rentStatus[phase];
    const rent = $('[data-v="rent"]');
    rent.textContent = label;
    rent.className = `pill pill-${tone}`;
    buy.textContent = bought ? 'Purchased' : 'Buy now';
    buy.disabled = bought;
    $('.sim-msg').textContent = fill(d.lines[phase], checking);
    actions.hidden = phase !== 'alert';
  }

  host.addEventListener('click', (e) => {
    const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
    if (!act) return;
    if (act === 'buy' && phase === 'idle') phase = 'alert';
    else if (act === 'approve' && phase === 'alert') phase = 'done';
    else if (act === 'decline' && phase === 'alert') phase = 'declined';
    else if (act === 'reset') phase = 'idle';
    else return;
    // Keep keyboard focus on something that still exists and is enabled.
    const next = phase === 'alert' ? '[data-act="approve"]' : phase === 'idle' ? '[data-act="buy"]' : '[data-act="reset"]';
    render();
    $(next).focus();
  });

  render();
}
