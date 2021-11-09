import LogRocket from 'logrocket';

if (
  typeof window !== 'undefined' &&
  window.location.host === 'chaingraph.cash'
) {
  /* cspell:disable-next-line */
  LogRocket.init('wkulwl/chaingraphcash');
}
