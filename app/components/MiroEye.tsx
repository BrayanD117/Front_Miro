import { Image, useMantineColorScheme } from "@mantine/core"

interface MiroEyeProps {
  size?: number
}

const MiroEye = ({size=35}: MiroEyeProps) => {
  const { colorScheme } = useMantineColorScheme();
  return (
    <Image
      src={`/assets/ojoMiro-${colorScheme}.svg`}
      alt="Logo MIRÓ"
      height={size}
    />
  )
}

export default MiroEye