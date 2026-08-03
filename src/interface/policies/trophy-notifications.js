/** Persisted, nonblocking FIFO Trophy acquisition presentation. */
import { getTrophy } from '../../game/trophies/index.js';
import { createTimedPresentationQueue, PRESENTATION_DURATION } from './presentation-timing.js';

export function createTrophyNotifications(options, timing = {}) {
  const host = document.getElementById('trophy-notification'); const action = document.getElementById('trophy-notification-action');
  const family = document.getElementById('trophy-notification-family'); const name = document.getElementById('trophy-notification-name');
  const reason = document.getElementById('trophy-notification-reason'); const progress = document.getElementById('trophy-notification-progress');
  const badge = document.getElementById('trophy-tab-badge'); const tab = document.getElementById('scene-trophies'); let meta = null;
  const queue = createTimedPresentationQueue({ ...timing, duration: PRESENTATION_DURATION.trophy, keyOf: (id) => id,
    onShow: (id) => { const trophy = getTrophy(id); if (!trophy) return queue.acknowledge('invalid');
      family.textContent = `${trophy.family.toUpperCase()} TROPHY`; name.textContent = trophy.nameEn;
      reason.textContent = trophy.criteriaEn; progress.textContent = `${trophy.rewardEn} · ${meta?.trophyIds?.length ?? 0} / 96 earned`;
      host.hidden = false; host.classList.toggle('is-static', options.reduced?.() === true);
      options.announce?.(`${trophy.nameEn} Trophy earned. ${trophy.criteriaEn}`); updateBadge(); },
    onAcknowledge: (id, cause) => options.onAcknowledge?.(id, cause),
    onIdle: () => { host.hidden = true; host.classList.remove('is-static'); updateBadge(); } });
  action.addEventListener('click', () => { const id = queue.current; if (!id) return; queue.acknowledge('selected'); options.onSelect?.(id); });
  host.addEventListener('pointerenter', () => queue.hold('hover', true)); host.addEventListener('pointerleave', () => queue.hold('hover', false));
  host.addEventListener('focusin', () => queue.hold('focus', true)); host.addEventListener('focusout', (event) => {
    if (!host.contains(event.relatedTarget)) queue.hold('focus', false);
  });
  function sync(nextMeta) { meta = nextMeta; queue.enqueue(nextMeta?.trophyQueue ?? []); updateBadge(); }
  function replace(nextMeta) { meta = nextMeta; queue.clear('progression-replaced'); queue.enqueue(nextMeta?.trophyQueue ?? []); updateBadge(); }
  function updateBadge() { const count = queue.length; badge.hidden = count === 0; badge.textContent = count ? String(count) : '';
    tab.setAttribute('aria-label', count ? `Trophies, ${count} unread acquisition${count === 1 ? '' : 's'}` : 'Trophies'); }
  return { sync, replace, acknowledge: (reason) => queue.acknowledge(reason), hold: queue.hold, snapshot: queue.snapshot,
    get currentId() { return queue.current; }, get unreadCount() { return queue.length; } };
}
