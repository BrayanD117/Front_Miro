import { useEffect, useRef, useState } from 'react';
import { Text, Group, Button, rem, useMantineTheme } from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { IconCloudUpload, IconX, IconDownload } from '@tabler/icons-react';
import ExcelJS from 'exceljs';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import classes from './DropzoneUpdateButton.module.css';
import { showNotification } from '@mantine/notifications';
import Lottie from 'lottie-react';
import successAnimation from "../../../public/lottie/success.json";
import { dateNow } from '../DateConfig';

interface DropzoneButtonProps {
  pubTemId: string;
  endDate: Date | undefined;
  onClose: () => void;
  edit?: boolean;
}

export function DropzoneUpdateButton({ pubTemId, endDate, onClose, edit = false }: DropzoneButtonProps) {
  const theme = useMantineTheme();
  const openRef = useRef<() => void>(null);
  const { data: session } = useSession();
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const handleFileDrop = async (files: File[]) => {
    if(endDate && new Date(endDate) < dateNow()) {
      showNotification({
        title: 'Error',
        message: 'La fecha de carga de plantillas ha culminado.',
        color: 'red',
      });
      return;
    }
    const file = files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const data: Record<string, any>[] = [];

      const sheet = workbook.worksheets[0];
      if (sheet) {
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
      }

      try {
        if (!session?.user?.email) {
          throw new Error('Usuario no autenticado');
        }

        const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/pTemplates/producer/load`, {
          email: session.user.email,
          pubTem_id: pubTemId,
          data: data,
          edit,
        });

        const recordsLoaded = response.data.recordsLoaded;

        setShowSuccessAnimation(true);
        showNotification({
          title: 'Carga exitosa',
          message: `Se han cargado ${recordsLoaded} registros correctamente.`,
          color: 'teal',
        });

        console.log("Respuesta del servidor:", response.data);
        setShowSuccessAnimation(true);
        setTimeout(() => {
          setShowSuccessAnimation(false);
          onClose();
        }, 3000); // Cerrar modal después de 3 segundos
      } catch (error) {
        console.error('Error enviando los datos al servidor:', error);

        if (axios.isAxiosError(error)) {
          console.error('Detalles del error:', error.response?.data);

          if (error.response?.data.details) {
            const errorDetails = Array.isArray(error.response.data.details) ? error.response.data.details : [];
            localStorage.setItem('errorDetails', JSON.stringify(errorDetails));
            if(typeof window !== 'undefined')
              window.open('/logs', '_blank');          
          } else {
            showNotification({
              title: 'Error',
              message: 'Hubo un error al procesar los datos. Verifica la plantilla y vuelve a intentarlo.',
              color: 'red',
            });
          }
        }
      }
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
        </>
      )}
    </div>
  );
}
