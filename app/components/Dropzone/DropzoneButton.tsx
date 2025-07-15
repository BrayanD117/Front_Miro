import { useEffect, useRef, useState } from 'react';
import { Text, Group, Button, rem, useMantineTheme } from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { IconCloudUpload, IconX, IconDownload } from '@tabler/icons-react';
import ExcelJS from 'exceljs';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import classes from './DropzoneButton.module.css';
import { showNotification } from '@mantine/notifications';
import Lottie from 'lottie-react';
import successAnimation from "../../../public/lottie/success.json";
import { dateNow } from '../DateConfig';

interface DropzoneButtonProps {
  pubTemId: string;
  endDate: Date | undefined;
  onClose: () => void;
  onUploadSuccess: () => void;
}




export function DropzoneButton({ pubTemId, endDate, onClose, onUploadSuccess }: DropzoneButtonProps) {
  const theme = useMantineTheme();
  const openRef = useRef<() => void>(null);
  const { data: session } = useSession();
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

const handleFileDrop = async (files: File[]) => {
  if (endDate && new Date(endDate) < dateNow()) {
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

    const sheet = workbook.worksheets[0];
    if (!sheet) return;

    let headers: string[] = [];
    const data: Record<string, any>[] = [];

    // 🧠 Obtener tipos desde el template en backend
    const templateResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/pTemplates/template/${pubTemId}`);
    const fieldTypeMap: Record<string, string> = {};
    templateResponse.data.template.fields.forEach((field: any) => {
      fieldTypeMap[field.name] = field.datatype;
    });

sheet.eachRow((row, rowNumber) => {
 if (rowNumber === 1) {
  headers = [];
  row.eachCell({ includeEmpty: true }, (cell) => {
    headers.push(cell.text?.toString?.() ?? cell.value?.toString?.() ?? '');
  });
} else {
    const rowData: Record<string, any> = {};

row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
  if (colNumber === 0) return;

  const key = headers[colNumber - 1];
  const tipo = fieldTypeMap[key];
const multiple = templateResponse.data.template.fields.find((f: { name: string; multiple?: boolean }) => f.name === key)?.multiple;

  if (!key || tipo === undefined) return;

  let parsedValue: any = cell.value;

  // 🔍 Detectar si tiene hipervínculo
  if (tipo === "Link" && cell.hyperlink) {
    parsedValue = cell.hyperlink;
  } else if (multiple) {
    // 🧠 Si es múltiple, trata el valor como string, incluso si el tipo de dato es numérico
    const raw = String(cell.value ?? "").trim();
    parsedValue = raw.split(",").map(v => v.trim()).filter(Boolean);
  } else {
    switch (tipo) {
      case "Entero":
        parsedValue = parseInt(cell.value as string);
        if (isNaN(parsedValue)) parsedValue = cell.value;
        break;

      case "Decimal":
      case "Porcentaje":
        parsedValue = parseFloat(cell.value as string);
        if (isNaN(parsedValue)) parsedValue = cell.value;
        break;

      case "Fecha":
        const dateValue = new Date(cell.value as string);
        parsedValue = isNaN(dateValue.getTime()) ? cell.value : dateValue;
        break;

      case "True/False":
        parsedValue = String(cell.value).toLowerCase() === "si" || cell.value === true;
        break;

      case "Texto Corto":
      case "Texto Largo":
        parsedValue = cell.value?.toString?.() ?? "";
        break;

      case "Fecha Inicial / Fecha Final":
        try {
          parsedValue = JSON.parse(cell.value as string);
          if (!Array.isArray(parsedValue) || parsedValue.length !== 2) throw new Error();
        } catch {
          parsedValue = cell.value;
        }
        break;

      default:
        parsedValue = cell.value;
    }
  }

  rowData[key] = parsedValue;
});



    data.push(rowData);
  }
});


    try {
      if (!session?.user?.email) {
        throw new Error("Usuario no autenticado");
      }

      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/pTemplates/producer/load`, {
        email: session.user.email,
        pubTem_id: pubTemId,
        data,
      });

      const recordsLoaded = response.data.recordsLoaded;

      setShowSuccessAnimation(true);
      showNotification({
        title: "Carga exitosa.",
        message: `Se han cargado ${recordsLoaded} registros correctamente.`,
        color: "teal",
      });

      setTimeout(() => {
        setShowSuccessAnimation(false);
        onClose();
      }, 3000);
    } catch (error) {
      console.error("Error enviando los datos al servidor cargar:", error);

      if (axios.isAxiosError(error)) {
        console.error("Detalles del error:", error.response?.data);

        const details = error.response?.data.details;
        if (Array.isArray(details)) {
          localStorage.setItem("errorDetails", JSON.stringify(details));
          if (typeof window !== "undefined") window.open("/logs", "_blank");
        } else {
          showNotification({
            title: "Error de validación",
            message: "No se pudieron procesar los errores. Contacta con soporte.",
            color: "red",
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
