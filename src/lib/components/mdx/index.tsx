import BlendedImage from './blendedImage';
import FlexRenderer from './flexRenderer';
import mdxComponents from './mdxComponents';
import MonsterTableWrapper from './metadataTables/monsterTableWrapper';
import HeirloomTableWrapper from './metadataTables/heirloomTableWrapper';
import TrinketTableWrapper from './metadataTables/trinketTableWrapper';
import {SpellTable} from './spellTable';
import { H1, H2, H3, H4, H5, H6 } from './heading/heading';

const components = {
  BlendedImage,
  FlexRenderer,
  MonsterTable: MonsterTableWrapper,
  HeirloomTable: HeirloomTableWrapper,
  SpellTable,
  TrinketTable: TrinketTableWrapper,
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  ...mdxComponents,
  table: ({ children }: any) => (
    <div className='overflow-x-auto max-w-full'>
      <table>{children}</table>
    </div>
  ),
};

export default components;
export { useHashNavigation } from '@/lib/hooks/useHashNavigation';
export { HashNavigationProvider } from './hashNavigationProvider/hashNavigationProvider';
