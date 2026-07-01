import { useTranslations } from 'next-intl';

interface CombatStatsRowProps {
  ac: number;
  hpMax: number;
  hpCurrent: number;
  tempHp: number;
  initiativeBonus: number;
  proficiencyBonus: number;
  speedOverride: number | null;
}

export function CombatStatsRow({
  ac,
  hpMax,
  hpCurrent,
  tempHp,
  initiativeBonus,
  proficiencyBonus,
  speedOverride,
}: CombatStatsRowProps) {
  const t = useTranslations('characterSheet');

  const pbStr =
    proficiencyBonus >= 0 ? `+${proficiencyBonus}` : `${proficiencyBonus}`;

  return (
    <div className='combat-stats-row' aria-label={t('ariaCombatStats')}>
      <div className='stat-chip'>
        <span className='stat-label'>{t('proficiencyShort')}</span>
        <span className='stat-value'>{pbStr}</span>
      </div>
      <div className='stat-chip'>
        <span className='stat-label'>HP</span>
        <span className='stat-value'>
          {hpCurrent}/{hpMax}
        </span>
      </div>
    </div>
  );
}
