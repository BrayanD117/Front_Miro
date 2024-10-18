"use client";

import { use, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import { Button, Collapse, Container, Divider, Group, rem, Stack, Text, TextInput, Title, Tooltip, useMantineTheme } from "@mantine/core";
import { IconCheck, IconCloudUpload, IconDownload, IconEye, IconX } from "@tabler/icons-react";
import { Dropzone } from "@mantine/dropzone";
import classes from "../ResponsibleReportsPage.module.css";
import DropzoneCustomComponent from "@/app/components/DropzoneCustomDrop/DropzoneCustomDrop";
import { useDisclosure } from "@mantine/hooks";

interface Report {
  _id: string;
  name: string;
  description: string;
  report_example_id: string;
  report_example_link: string;
  report_example_download: string;
  requires_attachment: boolean;
  file_name: string;
  created_by: {
    email: string;
    full_name: string;
  };
}

interface Dimension {
  _id: string;
  name: string;
}

interface Period {
  _id: string;
  name: string;
  responsible_start_date: Date;
  responsible_end_date: Date;
}

interface AttachmentFile extends File {
  description: string;
}

interface DriveFile {
  id: string;
  name: string;
  view_link: string;
  download_link: string;
  folder_id: string;
}

interface User {
  email: string;
  full_name: string;
}

interface FilledReport {
  _id: string;
  dimension: Dimension;
  send_by: any;
  loaded_date: Date;
  report_file: DriveFile;
  attachments: DriveFile[];
  status: string;
  status_date: Date;
  observations: string;
  evaluated_by: User;
}

interface PublishedReport {
  _id: string;
  report: Report;
  dimensions: Dimension[];
  period: Period;
  filled_reports: FilledReport[];
  folder_id: string;
}

const ResponsibleReportPage = () => {
  const router = useRouter();
  const theme = useMantineTheme();
  const { id } = useParams();
  const { data: session } = useSession();
  const [publishedReport, setPublishedReport] = useState<PublishedReport>();
  const [reportFile, setReportFile] = useState<File>();
  const [deletedReport, setDeletedReport] = useState<string>();
  const [frameOpen, setFrameOpen] = useState<boolean>(false);
  const [opened, { toggle }] = useDisclosure(false);

  const fetchReport = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/pReports`, {
          params: {
            id,
            email: session?.user?.email
          }
        }
      )
      if (response.data) {
        setPublishedReport(response.data);
      }
    } catch (error) {
      console.error(error);
      showNotification({
        title: "Error",
        message: "No se pudo cargar el reporte",
        color: "red",
      });
    }
  }

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <Container size={'xl'} ml={'md'}>
      <Title ta={'center'} mb={'md'}>{publishedReport?.report.name}</Title>
      <Group grow>
        <Text size={'md'} mb={'md'}>
          <Text fw="700">Periodo:</Text> 
          {publishedReport?.period.name}
        </Text>
        <Text size={'md'}>
          <Text fw="700">Necesita anexos:</Text>
          {publishedReport?.report.requires_attachment ? "✔ Sí" : "✗ No"}
        </Text>
        <Text size={'md'} mb='md'>
        <Text fw="700">Formato de reporte:</Text>
        <Group>
          <Tooltip 
            label="Ver formato"
            transitionProps={{ transition: "fade-up", duration: 300 }}
          >
            <Button
              variant="light"
              size="sm"
              onClick={() => setFrameOpen(true)}
            >
              <IconEye/>
            </Button>
          </Tooltip>
          <Tooltip 
            label="Descargar formato"
            transitionProps={{ transition: "fade-up", duration: 300 }}
          >
            <Button variant="light" size="sm"><IconDownload/></Button>
          </Tooltip>
        </Group>
      </Text>
      </Group>
      <Text size={'md'} mb='md'>
        <Text fw="700">Descripción:</Text>
        {publishedReport?.report.description ?? "Sin descripción"}
      </Text>
      <Divider mb='md'/>

      <Button onClick={toggle} mb='md'>
        {(publishedReport?.filled_reports && 
          publishedReport.filled_reports[0].status === "En Borrador") ? 
          "Modificar borrador de reporte" : "Crear borrador de reporte"}
      </Button>

      <Collapse in={opened}>
        <Text fw={700} mb={'xs'}>Carga tu archivo de reporte a continuación:</Text>
        <DropzoneCustomComponent
          onDrop={(files) => {
            if (files.length > 1) {
              showNotification({
                title: "Solo puedes cargar un archivo",
                message: "En el reporte solo puedes cargar un archivo",
                color: "red",
              });
              return;
            }
            setReportFile(files[0]);
            if (publishedReport?.filled_reports[0]?.report_file)
              setDeletedReport(
                publishedReport?.filled_reports[0].report_file.id
              );
          }}
          text="Arrastra o selecciona el archivo con tu reporte"
        />
        {publishedReport?.report.requires_attachment && (
          <>
            <Text fw={700} mt='md'>Carga tus anexos y sus descripciones:</Text>
            <DropzoneCustomComponent
              onDrop={(files) => {

              }}
              text="Arrastra o selecciona los anexos"
            />
          </>
        )}
      </Collapse>
    </Container>
  )
}

export default ResponsibleReportPage;