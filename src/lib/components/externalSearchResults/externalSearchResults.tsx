import { useExternalSearchData } from '@/lib/hooks/data/useSearchData';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';

/**
 * Renders external search results from the Google CSE API.
 * Styled identically to the local results list in `page.tsx`.
 *
 * @param {string} query - The search term
 * @returns {JSX.Element}
 */
export const ExternalSearchResults = ({ query }: { query: string }) => {
  const t = useTranslations('externalSearch');
  const { results: extResults, loading } = useExternalSearchData(query);
  const params = useParams();
  const locale = params.locale as string;

  const LoadingText = () => (
    <p className='text-sm secondary mt-2 italic'>{t('loading')}</p>
  );

  if (!extResults.length) {
    return loading ? (
      <LoadingText />
    ) : query ? (
      <p className='text-sm secondary mt-2 italic'>{t('noResults')}</p>
    ) : null;
  }

  return (
    <>
      {loading ? <LoadingText /> : null}
      <ul className='space-y-1 text-sm mt-2'>
        <h3 className='text-sm font-semibold mb-2 mt-2'>{t('header')}</h3>

        {extResults.map((r) => (
          <li key={r.link}>
            <Link
              href={{
                pathname: `${locale}/library/beyond`,
                query: { url: r.link },
              }}
              locale={undefined}
              className='hover:underline'>
              {r.title}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
};
