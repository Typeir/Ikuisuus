'use client';

import { ArchiveIntro } from '@/lib/components/archiveIntro/archiveIntro';
import { LibrarySearch } from '@/lib/components/librarySearch/librarySearch';

/**
 * Home page component for the library archive.
 * 
 * Displays the archive introduction and search interface.
 * 
 * @returns {JSX.Element} The rendered home page
 */
const Home = () => {
  return (
    <div className='p-6'>
      <section className='prose max-w-4xl mr-auto px-4 py-8'>
        <ArchiveIntro />
      </section>
      <LibrarySearch />
    </div>
  );
};

export default Home;
