/**
 * @fileoverview Module for src/app/[locale]/page.tsx
 * @module src/app/[locale]/page
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */
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
    <div className='p-4 w-full md:w-1/2'>
      <section className='max-w-4xl py-8'>
        <ArchiveIntro />
      </section>
      <LibrarySearch />
    </div>
  );
};

export default Home;
