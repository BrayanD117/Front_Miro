import { Dropzone } from "@mantine/dropzone";
import { Group, Text } from "@mantine/core";
import { IconCloudUpload, IconDownload, IconX } from "@tabler/icons-react";
import { rem } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { useMantineTheme } from "@mantine/core";
import classes from "./DropzoneCustom.module.css"

interface DropzoneComponentProps {
  onDrop: (files: File[]) => void;
  text: string;
}

const DropzoneCustomComponent = ({ onDrop, text }: DropzoneComponentProps) => {
  const theme = useMantineTheme();

  return (
    <Dropzone
      onDrop={(files) => {
        onDrop(files); // Usar la función onDrop pasada por props
      }}
      className={classes.dropzone} // Mantener el uso de clases
      radius="md"
      mx="auto"
      mt="xs"
    >
      <div style={{ cursor: "pointer" }}>
        <Group justify="center" pt="md">
          <Dropzone.Accept>
            <IconDownload
              style={{ width: rem(40), height: rem(40) }}
              color={theme.colors.blue[6]}
              stroke={1.5}
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX
              style={{ width: rem(40), height: rem(40) }}
              color={theme.colors.red[6]}
              stroke={1.5}
            />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconCloudUpload
              style={{ width: rem(40), height: rem(40) }}
              stroke={1.5}
            />
          </Dropzone.Idle>
        </Group>
        <Text ta="center" fz="sm" c="dimmed" pb="sm">
          {text}
        </Text>
      </div>
    </Dropzone>
  );
};

export default DropzoneCustomComponent;
