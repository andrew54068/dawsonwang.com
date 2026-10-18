import { ARTICLE_TYPES, FRESHNESS, articleFilterQuery, matchesArticleFilters, parseArticleFilters, type FilterableArticle } from './article-taxonomy';
import { TOPICS } from '../data/topics';

export function setupArticleBrowser(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>('form')!;
  const query = form.querySelector<HTMLInputElement>('[name="q"]')!;
  const checkboxes = [...form.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
  const rows = [...root.querySelectorAll<HTMLElement>('[data-article-row]')].map(element => ({
    element, article: JSON.parse(element.dataset.articleRow!) as FilterableArticle,
  }));
  const list = root.querySelector<HTMLElement>('[data-filter-results]')!;
  const empty = root.querySelector<HTMLElement>('[data-filter-empty]')!;

  function render(syncForm = false) {
    const filters = parseArticleFilters(new URLSearchParams(location.search));
    if (syncForm) {
      for (const input of checkboxes) {
        const values = input.name === 'type' ? filters.types : input.name === 'topic' ? filters.topics : filters.freshness;
        input.checked = values.includes(input.value);
      }
      query.value = filters.query;
      const details = form.querySelector('details');
      if (details && filters.topics.length) details.open = true;
    }
    let count = 0;
    for (const { element, article } of rows) {
      element.hidden = !matchesArticleFilters(article, filters);
      if (!element.hidden) count++;
    }
    root.querySelector('[data-result-count]')!.textContent = `共 ${count} 篇文章`;
    const groups = [[filters.types, ARTICLE_TYPES], [filters.topics, TOPICS], [filters.freshness, FRESHNESS]] as const;
    const descriptions = groups.filter(([values]) => values.length)
      .map(([values, vocabulary]) => values.map(slug => vocabulary.find(t => t.slug === slug)?.title).join(' 或 '));
    if (filters.query) descriptions.push(`標題：${filters.query}`);
    root.querySelector('[data-filter-summary]')!.textContent = descriptions.join(' × ');
    empty.hidden = count !== 0;
    list.hidden = count === 0;
  }

  function update(replace = false) {
    const params = new URLSearchParams();
    for (const [name, value] of new FormData(form)) if (typeof value === 'string') params.append(name, value);
    const search = articleFilterQuery(parseArticleFilters(params));
    const url = `${location.pathname}${search ? `?${search}` : ''}${location.hash}`;
    if (url !== `${location.pathname}${location.search}${location.hash}`) {
      if (replace) history.replaceState(null, '', url);
      else history.pushState(null, '', url);
    }
    render();
  }

  form.addEventListener('change', () => update());
  query.addEventListener('input', () => update(true));
  form.addEventListener('submit', event => { event.preventDefault(); update(); });
  root.querySelectorAll('[data-clear-filters]').forEach(button => button.addEventListener('click', () => {
    form.reset();
    query.value = '';
    update();
  }));
  window.addEventListener('popstate', () => render(true));
  render(true);
}
