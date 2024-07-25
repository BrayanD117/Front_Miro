import { useRef } from 'react';
import { Text, Group, Button, rem, useMantineTheme } from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { IconCloudUpload, IconX, IconDownload } from '@tabler/icons-react';
import ExcelJS from 'exceljs';
import axios from 'axios';
import classes from './DropzoneButton.module.css';

export function DropzoneButton() {
  const theme = useMantineTheme();
  const openRef = useRef<() => void>(null);

  const handleFileDrop = async (files: File[]) => {
    const file = files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const data: Record<string, any>[] = [];

      workbook.eachSheet((sheet) => {
        let headers: string[] = [];

        sheet.eachRow((row, rowNumber) => {
          const rowValues = row.values as (string | number | boolean | Date | null)[];
          if (rowNumber === 1) {
            headers = rowValues.slice(1) as string[];
          } else {
            const rowData: Record<string, any> = {};
            rowValues.slice(1).forEach((value, index) => {
              if (headers[index]) {
                rowData[headers[index]] = value;
              }
            });
            data.push(rowData);
          }
        });
      });

      console.log(data);

      try {
        const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/pTemplates/producer/load`, {
          email: '2220201021@estudiantesunibague.edu.co',
          pubTem_id: '66a278a445404aa87aef126b',
          data: data,
        });
        console.log(response.data);
      } catch (error) {
        console.error('Error enviando los datos al servidor:', error);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className={classes.wrapper}>
      <Dropzone
        openRef={openRef}
        onDrop={handleFileDrop}
        className={classes.dropzone}
        radius="md"
        accept={[MIME_TYPES.xlsx, MIME_TYPES.xls, MIME_TYPES.csv]}
        maxSize={30 * 1024 ** 2}
      >
        <div style={{ pointerEvents: 'none' }}>
          <Group justify="center">
            <Dropzone.Accept>
              <IconDownload
                style={{ width: rem(50), height: rem(50) }}
                color={theme.colors.blue[6]}
                stroke={1.5}
              />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX
                style={{ width: rem(50), height: rem(50) }}
                color={theme.colors.red[6]}
                stroke={1.5}
              />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconCloudUpload style={{ width: rem(50), height: rem(50) }} stroke={1.5} />
            </Dropzone.Idle>
          </Group>

          <Text ta="center" fw={700} fz="lg" mt="xl">
            <Dropzone.Accept>Suelta la plantilla aquí</Dropzone.Accept>
            <Dropzone.Reject>Los archivos no deben pesar más de 30MB</Dropzone.Reject>
            <Dropzone.Idle>Subir Plantilla</Dropzone.Idle>
          </Text>
          <Text ta="center" fz="sm" mt="xs" c="dimmed">
            Arrastra y suelta los archivos aquí para subirlos. Solo se aceptan archivos en formato <i>.xlsx</i>, <i>.xls</i>, o <i>.csv</i> que pesen menos de 30MB.
          </Text>
        </div>
      </Dropzone>

      <Button className={classes.control} size="md" radius="xl" onClick={() => openRef.current?.()}>
        Seleccionar archivos
      </Button>
    </div>
  );
}
