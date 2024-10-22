"use client";

import { use, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import { Button, Center, Collapse, Container, Divider, FileButton, Flex, Group, Modal, Pill, rem, Select, Space, Stack, Table, Text, TextInput, Title, Tooltip, useMantineTheme } from "@mantine/core";
import { IconCheck, IconChevronsLeft, IconCirclePlus, IconCloud, IconCloudUpload, IconDeviceFloppy, IconDownload, IconEdit, IconEye, IconSend2, IconX } from "@tabler/icons-react";
import { Dropzone } from "@mantine/dropzone";
import classes from "../ResponsibleReportsPage.module.css";
import DropzoneCustomComponent from "@/app/components/DropzoneCustomDrop/DropzoneCustomDrop";
import { useDisclosure } from "@mantine/hooks";
import { DriveFileFrame } from "@/app/components/DriveFileFrame";
import { dateToGMT } from "@/app/components/DateConfig";

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
  const [selectedReportIndex, setSelectedReportIndex] = useState<Number>(0);
  const [canSend, setCanSend] = useState<boolean>(true);
  const [opened, { toggle }] = useDisclosure(false);
  const [saving, setSaving] = useState<boolean>(false);

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

  const loadDraft = async () => {
    setSaving(true);
    try {
      const formData = new FormData();

      formData.append("email", session?.user?.email ?? "");
      formData.append("publishedReportId", publishedReport?._id ?? "");
      formData.append("filledDraft", JSON.stringify(publishedReport?.filled_reports[0] ?? ""));
      if (reportFile) {
        formData.append("reportFile", reportFile);
      }
      if (deletedReport) {
        formData.append("deletedReport", deletedReport);
      }
      attachments.forEach((attachment) => {
        formData.append("attachments", attachment);
        formData.append(`newAttachmentsDescriptions`, attachment.description ?? "");
      });
      deletedAttachments.forEach((attachment) => {
        formData.append("deletedAttachments", attachment);
      });
      

      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/pReports/responsible/loadDraft`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      )
      
      setAttachments([]);
      setDeletedAttachments([]);
      setDeletedReport(undefined);
      setReportFile(undefined);
      
      await fetchReport()
      setSaving(false);
      setCanSend(true);
      showNotification({
        title: "Borrador guardado",
        message: "El borrador se ha guardado correctamente",
        color: "green",
      });
    } catch (error) {
      setSaving(false);
      console.error(error);
      showNotification({
        title: "Error",
        message: "No se pudo guardar el borrador",
        color: "red",
      });
    }
  }

  const sendReport = async () => {
    if (!publishedReport?.filled_reports[0]?.report_file && !reportFile) {
      showNotification({
        title: "Error",
        message: "Debes cargar un archivo de reporte",
        color: "red",
      });
      return;
    }

    if (publishedReport?.report.requires_attachment && publishedReport?.filled_reports[0].attachments.length === 0) {
      showNotification({
        title: "Error",
        message: "Debes cargar al menos un anexo",
        color: "red",
      });
      return;
    }

    if (publishedReport?.report.requires_attachment) {
      if (!publishedReport?.filled_reports[0].attachments.every(attachment => attachment.description && attachment.description.trim() !== "")) {
      showNotification({
        title: "Error",
        message: "Todos los anexos deben tener una descripción",
        color: "red",
      });
      return;
      }
    }
  }

  const historyReports = publishedReport?.filled_reports.filter((report) => report.status !== "En Borrador");

  return (
    <>
      <Container size={'xl'} ml={'md'} fluid>
        <Title ta={'center'} mb={'md'}>{publishedReport?.report.name}</Title>
        <Group align="flex-start" grow>
            <Text size={'md'}>
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
        <Group grow mb='md' align="flex-start">
          <Text size={'md'} mb='md'>
            <Text fw="700">Descripción:</Text>
            {publishedReport?.report.description ?? "Sin descripción"}
          </Text>
          <Select
            label={<Text fw={700} size="md">Historial de envíos:</Text>}
            placeholder={(historyReports?.length ?? 0) < 1 ? "Sin envíos" : "Selecciona un envío"}
            data={
              historyReports?.map((report, index) => ({
                value: `${index}`,
                label: `${report.status} - ${dateToGMT(report.loaded_date, 'MMM dd, YYYY HH:mm')}`,
              })) || []
            }
            onChange={(value) => setSelectedReportIndex(Number(value))}
            disabled={(historyReports?.length ?? 0) < 1}
            searchable
            nothingFoundMessage="···"
          />
          <Button
            onClick={toggle}
            variant="outline"
            leftSection={<IconEdit/>}
            mt={25}
          >
            {(publishedReport?.filled_reports[0]?.status === "En Borrador") ? 
              "Modificar borrador" : "Diligenciar reporte"}
          </Button>
        </Group>
        <Divider mb='md'/>
        <Collapse in={opened}>
          <Group grow gap={'xl'}>
            <Tooltip
              label="No has hecho cambios"
              transitionProps={{ transition: "fade-up", duration: 300 }}
              disabled={!canSend}
            >
              <Button
                leftSection={<IconCloudUpload/>}
                mb={'md'}
                variant="outline"
                disabled={canSend}
                onClick={loadDraft}
                loading={saving}
              >
                Guardar borrador
              </Button>
            </Tooltip>
            <Tooltip
              label="Primero debes guardar el borrador"
              transitionProps={{ transition: "fade-up", duration: 300 }}
              disabled={canSend}
            >
              <Button
                leftSection={<IconSend2/>}
                mb={'md'}
                variant="outline"
                color="blue"
                disabled={!canSend}
                onClick={sendReport}
              >
                Enviar reporte 
              </Button>
            </Tooltip>
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
              >
                {publishedReport.filled_reports[0].report_file.name}
              </Pill>
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
                setCanSend(false)
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
                    {publishedReport?.filled_reports[0]?.attachments.map((attachment, index) => (
                      <Table.Tr key={attachment.id}>
                        <Table.Td w={1}>
                          <Center>
                            <IconX size={16} color="red" onClick={() => {
                              setDeletedAttachments([...deletedAttachments, attachment.id]);
                              publishedReport.filled_reports[0].attachments = publishedReport.filled_reports[0].attachments
                                .filter((att) => att.id !== attachment.id);
                              setCanSend(false)
                            }}/>
                          </Center>
                        </Table.Td>
                        <Table.Td>
                          <Group
                            gap="xs"
                            onClick={() => setFrameFile(attachment)}
                            style={{ cursor: "pointer" }}
                          >
                          <IconCloud size={16} color="gray" />
                          <Text
                            size="sm"
                          >
                            {attachment.name}
                          </Text>
                          </Group>
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
                              setCanSend(false)
                            }}
                          />
                        </Table.Td>
                      </Table.Tr>
                    ))}
                    {attachments.map((attachment, index) => (
                      <Table.Tr key={index}>
                        <Table.Td w={1}>
                          <Center>
                            <IconX size={16} color="red" onClick={() => {
                              const newAttachments = [...attachments];
                              newAttachments.splice(index, 1);
                              setAttachments(newAttachments);
                              setCanSend(false)
                            }}/>
                          </Center>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {attachment.name}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <TextInput
                            value={attachment.description}
                            onChange={(event) => {
                              setCanSend(false)
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
                  setCanSend(false)
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