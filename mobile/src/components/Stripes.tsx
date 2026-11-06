import { useState } from 'react'
import { View } from 'react-native'
import Svg, { Line } from 'react-native-svg'
import { colors } from '@/theme'

type Props = { height?: number; spacing?: number; color?: string }

// Band of thin diagonal lines (/ / /) across the full width, as on the
// welcome screen. Measures its own width so it fits any phone.
export default function Stripes({ height = 190, spacing = 28, color = colors.ink }: Props) {
  const [width, setWidth] = useState(0)
  const slant = height * 0.3 // horizontal run of each line from bottom to top
  const lines = []
  for (let x = -slant; x < width + slant; x += spacing) lines.push(x)

  return (
    <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {width > 0 && (
        <Svg width={width} height={height}>
          {lines.map((x) => (
            <Line key={x} x1={x} y1={height} x2={x + slant} y2={0} stroke={color} strokeWidth={1.4} />
          ))}
        </Svg>
      )}
    </View>
  )
}
