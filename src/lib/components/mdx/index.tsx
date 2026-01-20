import Image from 'next/image';
import BlendedImage from './blendedImage';
import ClearFloats from './clearFloats/clearFloats';
import FlexRenderer from './flexRenderer';
import FloatedContainer from './floatedContainer/floatedContainer';
import { H1, H2, H3, H4, H5, H6 } from './heading/heading';
import HorizontalSplit from './horizontalSplit/horizontalSplit';
import mdxComponents from './mdxComponents';
import HeirloomTableWrapper from './metadataTables/heirloomTableWrapper';
import MonsterTableWrapper from './metadataTables/monsterTableWrapper';
import TrinketTableWrapper from './metadataTables/trinketTableWrapper';
import { SpellTable } from './spellTable';

const components = {
  BlendedImage,
  FlexRenderer,
  MonsterTable: MonsterTableWrapper,
  HeirloomTable: HeirloomTableWrapper,
  SpellTable,
  TrinketTable: TrinketTableWrapper,
  HorizontalSplit,
  FloatedContainer,
  ClearFloats,
  // eslint-disable-next-line jsx-a11y/alt-text
  Image: (props: any) => <Image {...props} width={600} height={600} />,
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

