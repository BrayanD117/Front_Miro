"use client";

import { use, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import { Button, Center, Collapse, Container, Divider, FileButton, Group, Modal, Pill, rem, Select, Stack, Table, Text, TextInput, Title, Tooltip, useMantineTheme } from "@mantine/core";
import { IconCheck, IconChevronsLeft, IconCirclePlus, IconCloudUpload, IconDeviceFloppy, IconDownload, IconEdit, IconEye, IconSend2, IconX } from "@tabler/icons-react";
import { Dropzone } from "@mantine/dropzone";
import classes from "../ResponsibleReportsPage.module.css";
import DropzoneCustomComponent from "@/app/components/DropzoneCustomDrop/DropzoneCustomDrop";
import { useDisclosure } from "@mantine/hooks";
import { DriveFileFrame } from "@/app/components/DriveFileFrame";

interface Report {
  _id: string;
  name: string;
  description: string;
  report_example_id: string;
  report_example_download: string;
  requires_attachment: boolean;
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
  description?: string;
}

interface DriveFile {
  id: string;
  name: string;
  download_link: string;
  description?: string;
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
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [deletedAttachments, setDeletedAttachments] = useState<string[]>([]);
  const [frameFile, setFrameFile] = useState<DriveFile | null>();
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
    <>
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
                onClick={() => {
                  if(publishedReport)
                    setFrameFile({
                      id: publishedReport.report.report_example_id,
                      name: publishedReport.report.name,
                      download_link: publishedReport.report.report_example_download,
                      description: publishedReport?.report.description,
                    })
                }}
              >
                <IconEye/>
              </Button>
            </Tooltip>
            <Tooltip 
              label="Descargar formato"
              transitionProps={{ transition: "fade-up", duration: 300 }}
            >
              <Button
                variant="light"
                size="sm"
                onClick={() => {
                  if (typeof window !== "undefined")
                    window.open(publishedReport?.report.report_example_download);
                }}
              >
                <IconDownload/>
              </Button>
            </Tooltip>
          </Group>
        </Text>
        </Group>
        <Group grow mb='md'>
          <Text size={'md'} mb='md'>
            <Text fw="700">Descripción:</Text>
            {publishedReport?.report.description ?? "Sin descripción"}
          </Text>
          <Select
            label={<Text fw={700}>Historial de envíos:</Text>}
            placeholder="Selecciona un envío"
            data={['Fecha 1', 'Fecha 2']}
            searchable
            nothingFoundMessage="No encontrado"
          />
          <Button
            onClick={toggle}
            mt={'xl'}
            mb='md'
            maw={220}
            variant="outline"
            leftSection={<IconEdit/>}
          >
            {(publishedReport?.filled_reports[0]?.status === "En Borrador") ? 
              "Modificar borrador" : "Diligenciar reporte"}
          </Button>
        </Group>
        <Divider mb='md'/>
        <Collapse in={opened}>
          <Group grow gap={'xl'}>
            <Button leftSection={<IconDeviceFloppy/>} mb={'md'} variant="outline">
              Guardar borrador
            </Button>
            <Button
              rightSection={<IconSend2/>}
              mb={'md'}
              color="blue"
              variant="filled"
              autoContrast
            >
              Enviar reporte 
            </Button>
          </Group>
          <Text fw={700} mb={'xs'}>Carga tu archivo de reporte a continuación: {" "}
            {(publishedReport?.filled_reports[0]?.report_file && !deletedReport) ? (
              <Pill
                withRemoveButton
                size="md"
                className={classes.pillDrive}
                onRemove={() => setDeletedReport(publishedReport?.filled_reports[0].report_file.id)}
                onClick={() => setFrameFile(publishedReport?.filled_reports[0].report_file)}
                style={{ cursor: "pointer" }}
              >{publishedReport.filled_reports[0].report_file.name}</Pill>
            ): reportFile && (
              <Pill
                withRemoveButton
                size="md"
                className={classes.pillFile}
                onRemove={() => setReportFile(undefined)}
              >
                {reportFile?.name}
              </Pill>
            )}
          </Text>
          {!((publishedReport?.filled_reports[0]?.report_file && !deletedReport) || reportFile) && (
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
          )}
          {publishedReport?.report.requires_attachment && (
            <>
              <Divider mt='md' mb='md' variant="dashed"/>
              <Text fw={700} mt='md'>Carga tus anexos y sus descripciones:</Text>
              {(publishedReport?.filled_reports[0]?.attachments.length > 0 || attachments.length > 0) ? (
                <Table
                  striped
                  style={{ width: "100%" }}
                  mt="md"
                  mb="md"
                  withColumnBorders
                  withTableBorder
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th maw={rem(5)}/>
                      <Table.Th maw={rem(400)}>Nombre</Table.Th>
                      <Table.Th miw={rem(700)}>Descripción</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {publishedReport?.filled_reports[0]?.attachments.map((attachment) => (
                      <Table.Tr key={attachment.id}>
                        <Table.Td w={1}>
                          <Center>
                            <IconX size={16}/>
                          </Center>
                        </Table.Td>
                        <Table.Td>
                          <Text
                            onClick={() => setFrameFile(attachment)}
                            style={{ cursor: "pointer" }}
                            size="sm"
                          >
                            {attachment.name}
                          </Text>
                          </Table.Td>
                        <Table.Td>
                          <TextInput
                            value={attachment.description}
                            onChange={(event) => {
                              const updatedFilledReports = [...(publishedReport?.filled_reports || [])];
                              const attachmentIndex = updatedFilledReports[0].attachments.findIndex(
                                (att) => att.id === attachment.id
                              );
                              if (attachmentIndex !== -1) {
                                updatedFilledReports[0].attachments[attachmentIndex].description = event.currentTarget.value;
                                setPublishedReport({ ...publishedReport, filled_reports: updatedFilledReports });
                              }
                            }}
                          />
                        </Table.Td>
                      </Table.Tr>
                    ))}
                    {attachments.map((attachment, index) => (
                      <Table.Tr key={index}>
                        <Table.Td>
                          <Text size="sm">
                            {attachment.name}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <TextInput
                          value={attachment.description}
                          onChange={(event) => {
                            const newAttachments = [...attachments];
                            newAttachments[index].description = event.currentTarget.value;
                            setAttachments(newAttachments);
                          }}
                          />
                        </Table.Td>
                      </Table.Tr>
                    ))}
                    <Table.Tr>
                      <Table.Td colSpan={3}>
                        <FileButton
                          onChange={(files) => {
                            setAttachments([...attachments, ...files]);
                          }}
                          accept="*"
                          multiple
                        >
                          {(props) => 
                            <Button 
                            {...props} 
                            variant="light" 
                            fullWidth
                            leftSection={<IconCirclePlus/>}
                            >
                              Añadir anexo(s)
                            </Button>
                          }
                        </FileButton>
                      </Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              ) : 
              <DropzoneCustomComponent
                onDrop={(files) => {
                  setAttachments(files);
                }}
                text="Arrastra o selecciona los anexos"
              />
              }
            </>
          )}
        </Collapse>
      </Container>
      <Modal
        opened={Boolean(frameFile)}
        onClose={() => setFrameFile(null)}
        size="xl"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        withCloseButton={false}
      >
        <>
          <Button
            mx={"sm"}
            variant="light"
            size="compact-md"
            onClick={() => setFrameFile(null)}
            mb={"sm"}
          >
            <IconChevronsLeft />
            <Text size="sm" fw={600}>
              Ir atrás
            </Text>
          </Button>
          <Text component="span" fw={700}>
            {frameFile?.name}
          </Text>
          <DriveFileFrame fileId={frameFile?.id || ""} fileName={frameFile?.name || ""} />
        </>
      </Modal>
    </>
  )
}

export default ResponsibleReportPage;