import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg'

type Props = {
  size?: number
  /** gradient = ícone com fundo degradê claro (padrão, para fundos escuros e claros)
   *  mono     = só o traço em branco, sem fundo (para uso sobre cores sólidas) */
  variant?: 'gradient' | 'mono'
}

export function SirvaOSMark({ size = 40, variant = 'gradient' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024">
      {variant === 'gradient' && (
        <Defs>
          <LinearGradient id="sirvaMarkBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#E0F6F4" />
            <Stop offset="1" stopColor="#DDF7FC" />
          </LinearGradient>
        </Defs>
      )}

      {variant === 'gradient' && (
        <Rect width="1024" height="1024" rx="236" fill="url(#sirvaMarkBg)" />
      )}

      <Path
        d="M704 270 C458 136 198 280 224 522 C248 720 522 704 512 512 C502 348 778 358 806 542 C830 792 548 940 286 796"
        fill="none"
        stroke={variant === 'gradient' ? '#087C7A' : '#FFFFFF'}
        strokeWidth={108}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={224} cy={522} r={64} fill="#00A7C4" />
      <Circle cx={806} cy={542} r={64} fill="#00A7C4" />
    </Svg>
  )
}
