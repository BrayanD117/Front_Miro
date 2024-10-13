import { useEffect, useRef, useState } from 'react';
import { Text, Group, Button, rem, useMantineTheme, Center, Divider } from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { IconCloudUpload, IconX, IconDownload } from '@tabler/icons-react';
import ExcelJS from 'exceljs';
import { showNotification } from '@mantine/notifications';
import classes from './ValidationDropzone.module.css';
import Lottie from 'lottie-react';
import successAnimation from '../../../public/lottie/success.json';

interface ValidationDropzoneProps {
  onFileProcessed: (columns: any[]) => void;
}

export function ValidationDropzone({ onFileProcessed }: ValidationDropzoneProps) {
  const theme = useMantineTheme();
  const openRef = useRef<() => void>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const handleFileDrop = async (files: File[]) => {
    const file = files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const sheet = workbook.worksheets[0];
      const data: any[] = [];

      if (sheet) {
        const columnCount = sheet.columnCount;
        for (let col = 1; col <= columnCount; col++) {
          const columnName = sheet.getRow(1).getCell(col).value as string;
          console.log("columnName", columnName);
          const columnValues: (string | number)[] = [];
          console.log("columnValues", columnValues);

          for (let row = 2; row <= sheet.rowCount; row++) {
            const value = sheet.getRow(row).getCell(col).value;

            if (typeof value === 'string' || typeof value === 'number') {
              columnValues.push(value);
            }
          }

          data.push({
            name: columnName || `Columna ${col}`,
            is_validator: false,
            type: columnValues.every(val => typeof val === 'number') ? 'Número' : 'Texto',
            values: columnValues,
          });
        }
      }

      onFileProcessed(data);
      setShowSuccessAnimation(true);
      showNotification({
        title: 'Carga exitosa',
        message: 'El archivo ha sido procesado correctamente.',
        color: 'teal',
      });

      setTimeout(() => {
        setShowSuccessAnimation(false);
      }, 3000);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className={classes.wrapper}>
      {showSuccessAnimation ? (
        <div className={classes.animationWrapper}>
          <Lottie animationData={successAnimation} loop={false} />
        </div>
      ) : (
        <>
          <Dropzone
            openRef={openRef}
            onDrop={handleFileDrop}
            className={classes.dropzone}
            radius="md"
            accept={[MIME_TYPES.xlsx, MIME_TYPES.xls]}
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
                <Dropzone.Accept>Suelta el archivo aquí</Dropzone.Accept>
                <Dropzone.Reject>Los archivos no deben pesar más de 30MB</Dropzone.Reject>
                <Dropzone.Idle>Sube archivo de validación</Dropzone.Idle>
              </Text>
              <Text ta="center" fz="sm" mt="xs" c="dimmed">
                Arrastra y suelta el archivo o selecciona manualmente. Solo se aceptan archivos <i>.xlsx</i> o <i>.xls</i>.
              </Text>
            </div>
          </Dropzone>

          <Center>
            <Button mt="md" onClick={() => openRef.current?.()}>
              Seleccionar archivo
            </Button>
          </Center>
          <Divider mt={"lg"}/>
        </>
      )}
    </div>
  );
}
