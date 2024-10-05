"use client";

import { use, useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import {
  Badge,
  Button,
  Center,
  Container,
  Divider,
  Group,
  Modal,
  Pagination,
  Pill,
  PillGroup,
  rem,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import {
  IconCancel,
  IconChevronsLeft,
  IconCloudUpload,
  IconDeviceFloppy,
  IconDownload,
  IconEdit,
  IconFileDescription,
  IconHistoryToggle,
  IconMailForward,
  IconUpload,
  IconX, 
  IconArrowBigUpFilled, 
  IconArrowBigDownFilled, 
  IconArrowsTransferDown,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import classes from "./ResponsibleReportsPage.module.css";
import DateConfig, { dateNow, dateToGMT } from "@/app/components/DateConfig";
import { showNotification } from "@mantine/notifications";
import { Dropzone } from "@mantine/dropzone";
import uploadAnimation from "../../../public/lottie/upload.json";
import successAnimation from "../../../public/lottie/success.json";
import dynamic from "next/dynamic";
import { DriveFileFrame } from "@/app/components/DriveFileFrame";
import { useSort } from "../../hooks/useSort";

type LottieProps = {
  animationData: object;
  loop: boolean;
};

const Lottie = dynamic(
  () => import("lottie-react").then((mod) => mod.default),
  {
    ssr: false,
  }
) as React.FC<LottieProps>;

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

const StatusColor: Record<string, string> = {
  Pendiente: "orange",
  "En Borrador": "grape",
  "En Revisión": "cyan",
  Aprobado: "lime",
  Rechazado: "red",
};

const ResponsibleReportsPage = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [history, setHistory] = useState<boolean>(false);
  const [deletedReport, setDeletedReport] = useState<string | null | undefined>(
    null
  );
  const [deletedAttachments, setDeletedAttachments] = useState<string[]>([]);
  const [pubReports, setPubReports] = useState<PublishedReport[]>([]);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [opened, setOpened] = useState<boolean>(false);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState<PublishedReport | null>(
    null
  );
  const [frameFile, setFrameFile] = useState<DriveFile | null>(null);
  const theme = useMantineTheme();
  const router = useRouter();
  const { sortedItems: sortedReports, handleSort, sortConfig } = useSort<PublishedReport>(pubReports, { key: null, direction: "asc" });

  const fetchReports = async (page: number, search: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/pReports/responsible`,
        {
          params: {
            page: page,
            search: search,
            email: session?.user?.email,
          },
        }
      );
      if (response.data) {
        setPubReports(response.data.publishedReports);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error(error);
      setPubReports([]);
    }
  };
  useEffect(() => {
    if (session?.user?.email) {
      const delayDebounceFn = setTimeout(() => {
        fetchReports(page, search);
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [search, session?.user?.email, page]);

  const handleCreate = async () => {
    if (selectedReport && handleDisableUpload(selectedReport)) {
      showNotification({
        title: "Error",
        message: "El periodo ya ha culminado",
        color: "red",
      });
      return;
    }
    if (selectedReport?.filled_reports[0]) {
      if (deletedReport && !reportFile) {
        showNotification({
          title: "Error",
          message: "No ha cargado el archivo de reporte",
          color: "red",
        });
      }
      if (
        deletedAttachments.length ===
          selectedReport?.filled_reports[0].attachments.length &&
        attachments.length === 0
      ) {
        showNotification({
          title: "Error",
          message: "No ha cargado archivo(s) de anexo",
          color: "red",
        });
      }
      if (
        deletedAttachments.length === 0 &&
        attachments.length === 0 &&
        !deletedReport
      ) {
        showNotification({
          title: "Error",
          message:
            "No ha habido cambios desde el borrador anterior en el reporte",
          color: "red",
        });
      }
    } else {
      if (!reportFile) {
        showNotification({
          title: "Error",
          message: "No ha cargado el archivo de reporte",
          color: "red",
        });
        return;
      }
      if (
        selectedReport?.report.requires_attachment &&
        attachments.length === 0
      ) {
        showNotification({
          title: "Error",
          message: "No ha cargado el(los) archivo(s) de anexo",
          color: "red",
        });
        return;
      }
    }
    if (!selectedReport) {
      showNotification({
        title: "Error",
        message: "No se seleccionó un reporte",
        color: "red",
      });
      return;
    }
    if (!session?.user?.email) {
      showNotification({
        title: "Error",
        message: "No se encontró la sesión del usuario",
        color: "red",
      });
      return;
    }

    const formData = new FormData();
    formData.append("email", session?.user?.email);
    formData.append("reportId", selectedReport?._id);
    if (deletedReport) {
      formData.append("deletedReport", deletedReport);
    }
    if (deletedAttachments.length > 0) {
      console.log(JSON.stringify(deletedAttachments));
      formData.append("deletedAttachments", JSON.stringify(deletedAttachments));
    }
    if (reportFile) {
      formData.append("reportFile", reportFile);
    }
    if (selectedReport?.filled_reports[0]) {
      formData.append("filledRepId", selectedReport.filled_reports[0]._id);
    }
    attachments.forEach((attachment) => {
      formData.append("attachments", attachment);
    });

    setLoading(true);
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/pReports/responsible/load`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.data) {
        showNotification({
          title: "Reporte cargado",
          message: "El reporte se ha cargado correctamente",
          color: "green",
        });
        setSuccess(true);
        fetchReports(page, search);
        console.log("selectedReport._id", selectedReport._id);
        const updatedReportResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/pReports/responsible/${selectedReport._id}`,
          {
            params: {
              email: session?.user?.email,
            },
          }
        );
        if (updatedReportResponse.data) {
          setSelectedReport(updatedReportResponse.data);
          console.log("updatedReportResponse.data", updatedReportResponse.data);
        }
        setReportFile(null);
        setDeletedReport(null);
        setAttachments([]);
        setDeletedAttachments([]);
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error(error);
      showNotification({
        title: "Error",
        message: "Error al cargar el reporte",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReport = (report: PublishedReport) => {
    setSelectedReport(report);
    setOpened(true);
  };

  const handleClosePublish = () => {
    setSelectedReport(null);
    setAttachments([]);
    setReportFile(null);
    setPublishing(false);
    setLoading(false);
    setDeletedAttachments([]);
    setDeletedReport(null);
    setFrameFile(null);
  };

  const handleSendReport = async () => {
    setLoading(true);
    if (selectedReport && handleDisableUpload(selectedReport)) {
      showNotification({
        title: "Error",
        message: "El periodo ya ha culminado",
        color: "red",
      });
      return;
    }
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/pReports/responsible/send`,
        {
          email: session?.user?.email,
          reportId: selectedReport?._id,

          loadedDate: selectedReport?.filled_reports[0].loaded_date,
        }
      );
      if (response.data) {
        setSuccess(true);
        showNotification({
          title: "Reporte enviado",
          message: "El reporte se ha enviado correctamente",
          color: "green",
        });
        fetchReports(page, search);
        setTimeout(() => {
          setSuccess(false);
          handleClosePublish();
        }, 3000);
      }
    } catch (error) {
      console.error(error);
      showNotification({
        title: "Error",
        message: "Error al enviar el reporte",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const addFilesToAttachments = (files: File[]) => {
    if (
      files.some((file) =>
        attachments.some((attachment) => attachment.name === file.name)
      )
    ) {
      showNotification({
        title: "Error",
        message: "No puedes cargar dos veces el mismo archivo",
        color: "red",
      });
      return;
    }
    setAttachments([...attachments, ...files]);
  };

  const handleDisableUpload = (publishedReport: PublishedReport) => {
    return (
      new Date(dateNow().toDateString()) >
        new Date(publishedReport.period.responsible_end_date)
    );
  };

  const historyRows = selectedReport?.filled_reports.map(
    (filledReport, index) => {
      return (
        <div key={filledReport._id}>
          <Divider
            mt={index === 0 ? "0" : "md"}
            label={`Estado: ${
              index > 0 && filledReport.status === "En Revisión"
                ? "Reemplazado"
                : filledReport.status
            } - Fecha de Estado: ${dateToGMT(
              filledReport.status_date,
              "MMM DD, YYYY HH:mm"
            )}`}
          />
          <Group mt={rem(5)}>
            <Text size="sm">Reporte: </Text>
            <Pill
              onClick={() => {
                setFrameFile(filledReport.report_file);
              }}
              bg="gray"
              c="white"
              style={{ cursor: "pointer" }}
            >
              {filledReport.report_file.name}
            </Pill>
          </Group>
          {filledReport.attachments.length > 0 && (
            <Group mt={"xs"}>
              <Text size="sm">Anexos: </Text>
              <PillGroup>
                {filledReport.attachments.map((attachment) => (
                  <Pill
                    key={attachment.id}
                    onClick={() => {
                      setFrameFile(attachment);
                    }}
                    style={{ cursor: "pointer" }}
                    bg="gray"
                    c="white"
                  >
                    {attachment.name}
                  </Pill>
                ))}
              </PillGroup>
            </Group>
          )}
          {filledReport.observations && (
            <Text size="sm" mt={"xs"} fw={700}>
              Observaciones: {filledReport.observations}
            </Text>
          )}
          {filledReport.evaluated_by && (
            <Text size="sm" c="dimmed">
              Evaluado por:{" "}
              <Text tt="capitalize" component="span">
                {filledReport.evaluated_by.full_name.toLowerCase()}
              </Text>
            </Text>
          )}
        </div>
      );
    }
  );

  const rows = sortedReports?.length ? (
    sortedReports.map((pubReport: PublishedReport) => {
      const uploadDisable = handleDisableUpload(pubReport);
      return (
        <Table.Tr key={pubReport._id}>
          <Table.Td>{pubReport.period.name}</Table.Td>
          <Table.Td>
            {dateToGMT(pubReport.period.responsible_start_date)}
          </Table.Td>
          <Table.Td>
            {dateToGMT(pubReport.period.responsible_end_date)}
          </Table.Td>
          <Table.Td>{pubReport.report.name}</Table.Td>
          <Table.Td>
            <Center>
              <Badge
                w={rem(110)}
                autoContrast
                color={
                  StatusColor[pubReport.filled_reports[0]?.status] ?? "orange"
                }
                variant={"light"}
              >
                {pubReport.filled_reports[0]?.status ?? "Pendiente"}
              </Badge>
            </Center>
          </Table.Td>
          <Table.Td w={160}>
            <Center>
              {pubReport.filled_reports[0]?.status_date
                ? dateToGMT(
                    pubReport.filled_reports[0].status_date,
                    "MMM D, YYYY HH:mm"
                  )
                : ""}
            </Center>
          </Table.Td>
          <Table.Td>
            <Center>
              <Group gap={"xs"}>
                <Tooltip
                  label="Ver detalles del reporte"
                  transitionProps={{ transition: "fade-up", duration: 300 }}
                >
                  <Button
                    variant="outline"
                    onClick={() => handleOpenReport(pubReport)}
                  >
                    <IconFileDescription size={16} />
                  </Button>
                </Tooltip>
                <Tooltip
                  label={
                    uploadDisable ? "El periodo ya ha culminado"
                      : pubReport.filled_reports[0]?.status === "Aprobado" 
                        || pubReport.filled_reports[0]?.status === "En Revisión"
                      ? "Tu reporte ya fue enviado"
                      : "Cargar reporte"
                  }
                  transitionProps={{ transition: "fade-up", duration: 300 }}
                >
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPublishing(true);
                      setSelectedReport(pubReport);
                    }}
                    disabled={uploadDisable 
                      || pubReport.filled_reports[0]?.status === "Aprobado" 
                      || pubReport.filled_reports[0]?.status === "En Revisión"}
                  >
                    {pubReport.filled_reports[0]?.status === "En Borrador" ? (
                      <IconEdit size={16} />
                    ) : (
                      <IconUpload size={16} />
                    )}
                  </Button>
                </Tooltip>
                <Tooltip
                  label="Ver historial de envíos del reporte"
                  transitionProps={{ transition: "fade-up", duration: 300 }}
                >
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedReport(pubReport);
                      setHistory(true);
                    }}
                  >
                    <IconHistoryToggle size={16} />
                  </Button>
                </Tooltip>
              </Group>
            </Center>
          </Table.Td>
        </Table.Tr>
      );
    })
  ) : (
    <Table.Tr>
      <Table.Td colSpan={10}>No se encontraron reportes pendientes</Table.Td>
    </Table.Tr>
  );

  return (
    <Container size="xl">
      <DateConfig />
      <Title ta="center" mb={"md"}>
        Gestión de Reportes
      </Title>
      <TextInput
        placeholder="Buscar en los reportes publicados"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="md"
      />
      <Table striped withTableBorder mt="md">
        <Table.Thead>
          <Table.Tr>
          <Table.Th onClick={() => handleSort("period.name")} style={{ cursor: "pointer" }}>
              <Center inline>
                Periodo
                {sortConfig.key === "period.name" ? (
                  sortConfig.direction === "asc" ? (
                    <IconArrowBigUpFilled size={16} style={{ marginLeft: "5px" }} />
                  ) : (
                    <IconArrowBigDownFilled size={16} style={{ marginLeft: "5px" }} />
                  )
                ) : (
                  <IconArrowsTransferDown size={16} style={{ marginLeft: "5px" }} />
                )}
              </Center>
            </Table.Th>
            <Table.Th onClick={() => handleSort("period.responsible_start_date")} style={{ cursor: "pointer" }}>
              <Center inline>
                Fecha Inicio
                {sortConfig.key === "period.responsible_start_date" ? (
                  sortConfig.direction === "asc" ? (
                    <IconArrowBigUpFilled size={16} style={{ marginLeft: "5px" }} />
                  ) : (
                    <IconArrowBigDownFilled size={16} style={{ marginLeft: "5px" }} />
                  )
                ) : (
                  <IconArrowsTransferDown size={16} style={{ marginLeft: "5px" }} />
                )}
              </Center>
            </Table.Th>
            <Table.Th onClick={() => handleSort("period.responsible_end_date")} style={{ cursor: "pointer" }}>
              <Center inline>
                Fecha Límite
                {sortConfig.key === "period.responsible_end_date" ? (
                  sortConfig.direction === "asc" ? (
                    <IconArrowBigUpFilled size={16} style={{ marginLeft: "5px" }} />
                  ) : (
                    <IconArrowBigDownFilled size={16} style={{ marginLeft: "5px" }} />
                  )
                ) : (
                  <IconArrowsTransferDown size={16} style={{ marginLeft: "5px" }} />
                )}
              </Center>
            </Table.Th>
            <Table.Th onClick={() => handleSort("report.name")} style={{ cursor: "pointer" }}>
              <Center inline>
                Reporte
                {sortConfig.key === "report.name" ? (
                  sortConfig.direction === "asc" ? (
                    <IconArrowBigUpFilled size={16} style={{ marginLeft: "5px" }} />
                  ) : (
                    <IconArrowBigDownFilled size={16} style={{ marginLeft: "5px" }} />
                  )
                ) : (
                  <IconArrowsTransferDown size={16} style={{ marginLeft: "5px" }} />
                )}
              </Center>
            </Table.Th>
            <Table.Th onClick={() => handleSort("filled_reports[0].status")} style={{ cursor: "pointer" }}>
              <Center inline>
                Estado
                {sortConfig.key === "filled_reports[0].status" ? (
                  sortConfig.direction === "asc" ? (
                    <IconArrowBigUpFilled size={16} style={{ marginLeft: "5px" }} />
                  ) : (
                    <IconArrowBigDownFilled size={16} style={{ marginLeft: "5px" }} />
                  )
                ) : (
                  <IconArrowsTransferDown size={16} style={{ marginLeft: "5px" }} />
                )}
              </Center>
            </Table.Th>
            <Table.Th onClick={() => handleSort("filled_reports[0].status_date")} style={{ cursor: "pointer" }}>
              <Center inline>
                Fecha de Estado
                {sortConfig.key === "filled_reports[0].status_date" ? (
                  sortConfig.direction === "asc" ? (
                    <IconArrowBigUpFilled size={16} style={{ marginLeft: "5px" }} />
                  ) : (
                    <IconArrowBigDownFilled size={16} style={{ marginLeft: "5px" }} />
                  )
                ) : (
                  <IconArrowsTransferDown size={16} style={{ marginLeft: "5px" }} />
                )}
              </Center>
            </Table.Th>
            <Table.Td fw={700}>
              <Center>Acciones</Center>
            </Table.Td>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
      <Center>
        <Pagination
          mt={15}
          value={page}
          onChange={setPage}
          total={totalPages}
          siblings={1}
          boundaries={3}
        />
      </Center>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        size="sm"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        withCloseButton={false}
      >
        <Text size="xl" mb={"md"} fw={700} ta={"center"}>
          {selectedReport?.report.name}
        </Text>
        <Text mb={"md"} size="md" ta={"justify"}>
          {selectedReport?.report.description || "-"}
        </Text>
        <Text size="md">
          Requiere Anexo(s):{" "}
          {selectedReport?.report.requires_attachment ? "Sí" : "No"}
        </Text>
        <Button
          variant="outline"
          mt="md"
          leftSection={<IconDownload size={16} />}
          onClick={() => {
            if (typeof window !== "undefined")
              window.open(selectedReport?.report.report_example_download);
          }}
        >
          Descargar Formato
        </Button>
      </Modal>
      <Modal
        key={`${selectedReport?._id ?? ""}_${
          selectedReport?.filled_reports[0]?.status ?? ""
        }`}
        opened={publishing}
        onClose={handleClosePublish}
        size={frameFile ? "xl" : "md"}
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        withCloseButton={false}
      >
        {frameFile ? (
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
              {frameFile.name}
            </Text>
            <DriveFileFrame fileId={frameFile.id} fileName={frameFile.name} />
          </>
        ) : (
          <>
            <Text size="xl" mb={"sm"} fw={700} ta={"center"}>
              {selectedReport?.report.name}
            </Text>
            {loading ? (
              <Center>
                <Lottie animationData={uploadAnimation} loop={true} />
              </Center>
            ) : success ? (
              <Center>
                <Lottie animationData={successAnimation} loop={false} />
              </Center>
            ) : (
              <>
                <Text
                  size="sm"
                  c={"blue"}
                  ta={"end"}
                  td={"underline"}
                  onClick={() => {
                    setHistory(true);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  Ver historial de envíos
                </Text>
                <Text mb={"md"} size="md">
                  Cargar Formato de Reporte:{" "}
                  <Text component="span" c={theme.colors.red[8]}>
                    *
                  </Text>
                </Text>
                <Dropzone
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
                    if (selectedReport?.filled_reports[0]?.report_file)
                      setDeletedReport(
                        selectedReport?.filled_reports[0].report_file.id
                      );
                  }}
                  className={classes.dropzone}
                  radius="md"
                  mx={"auto"}
                  mt={"md"}
                >
                  <div style={{ cursor: "pointer" }}>
                    <Group justify="center" pt={"md"}>
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
                    <Text ta="center" fz="sm" c="dimmed" pb={"sm"}>
                      Selecciona el archivo con tu reporte en formato .pdf o
                      .docx
                    </Text>
                  </div>
                </Dropzone>
                {selectedReport?.filled_reports[0]?.status === "En Borrador" &&
                  selectedReport?.filled_reports[0]?.report_file &&
                  !deletedReport && (
                    <Pill
                      mt={"sm"}
                      withRemoveButton
                      onRemove={() =>
                        setDeletedReport(
                          selectedReport?.filled_reports[0].report_file.id
                        )
                      }
                      bg={"blue"}
                      c={"white"}
                      onClick={() => {
                        setFrameFile(
                          selectedReport?.filled_reports[0].report_file
                        );
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      {selectedReport?.filled_reports[0].report_file.name}
                    </Pill>
                  )}
                {reportFile?.name && (
                  <Pill
                    mt={"sm"}
                    withRemoveButton
                    onRemove={() => setReportFile(null)}
                    bg={"gray"}
                    c={"white"}
                  >
                    {reportFile?.name}
                  </Pill>
                )}
                {selectedReport?.report.requires_attachment && (
                  <>
                    <Text mt={"md"}>
                      Anexos:{" "}
                      <Text component="span" c={theme.colors.red[8]}>
                        *
                      </Text>
                    </Text>
                    <Dropzone
                      onDrop={addFilesToAttachments}
                      className={classes.dropzone}
                      radius="md"
                      mx={"auto"}
                      mt={"md"}
                      multiple
                    >
                      <div style={{ cursor: "pointer", marginBottom: "0px" }}>
                        <Group justify="center" pt={"md"}>
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
                        <Text ta="center" fz="sm" c="dimmed" pb={"sm"}>
                          Selecciona los anexos de tu reporte (mínimo 1)
                        </Text>
                      </div>
                    </Dropzone>
                    <PillGroup mt={"sm"} mb={"xs"}>
                      {attachments.map((attachment, index) => (
                        <Pill
                          key={attachment.name}
                          bg={"gray"}
                          c={"white"}
                          withRemoveButton
                          onRemove={() =>
                            setAttachments((prev) =>
                              prev.filter((_, i) => i !== index)
                            )
                          }
                        >
                          {attachment.name}
                        </Pill>
                      ))}
                      {selectedReport?.filled_reports[0]?.status ===
                        "En Borrador" &&
                        selectedReport.filled_reports[0]?.attachments.map(
                          (attachment) => {
                            return (
                              !deletedAttachments.includes(attachment.id) && (
                                <Pill
                                  key={attachment.name}
                                  bg={"blue"}
                                  c={"white"}
                                  withRemoveButton
                                  onRemove={() =>
                                    setDeletedAttachments([
                                      ...deletedAttachments,
                                      attachment.id,
                                    ])
                                  }
                                  onClick={() => {
                                    setFrameFile(attachment);
                                  }}
                                  style={{ cursor: "pointer" }}
                                >
                                  {attachment.name}
                                </Pill>
                              )
                            );
                          }
                        )}
                    </PillGroup>
                  </>
                )}
                <Group mt="md" grow>
                  <Button
                    justify="space-between"
                    variant="outline"
                    rightSection={<span />}
                    leftSection={<IconDeviceFloppy />}
                    onClick={handleCreate}
                    disabled={
                      selectedReport?.filled_reports[0]?.status ===
                      "En Borrador"
                        ? (!deletedReport &&
                            deletedAttachments.length === 0 &&
                            attachments.length === 0) ||
                          (deletedReport && reportFile === null) ||
                          (selectedReport.report.requires_attachment &&
                            deletedAttachments.length ===
                              selectedReport?.filled_reports[0].attachments
                                .length &&
                            attachments.length === 0)
                        : !reportFile ||
                          (selectedReport?.report.requires_attachment &&
                            attachments.length === 0)
                    }
                  >
                    Guardar Borrador
                  </Button>
                  <Button
                    variant="outline"
                    color="red"
                    justify="space-between"
                    leftSection={<span />}
                    rightSection={<IconCancel />}
                    onClick={handleClosePublish}
                  >
                    Cancelar
                  </Button>
                </Group>
                <Button
                  fullWidth
                  mt={"md"}
                  disabled={
                    !(
                      attachments.length === 0 &&
                      reportFile === null &&
                      deletedReport === null &&
                      deletedAttachments.length === 0 &&
                      selectedReport?.filled_reports[0]?.status ===
                        "En Borrador"
                    )
                  }
                  justify="space-between"
                  leftSection={<span />}
                  rightSection={<IconMailForward />}
                  onClick={handleSendReport}
                >
                  Enviar
                </Button>
              </>
            )}
          </>
        )}
      </Modal>
      <Modal
        opened={history}
        onClose={() => {
          setHistory(false);
          setFrameFile(null);
        }}
        size={frameFile ? "xl" : "md"}
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        title={
          <>
            {frameFile ? (
              <>
                <Button
                  mx={"sm"}
                  variant="light"
                  size="compact-md"
                  onClick={() => setFrameFile(null)}
                >
                  <IconChevronsLeft />
                  <Text size="sm" fw={600}>
                    Ir atrás
                  </Text>
                </Button>
                <Text component="span" fw={700}>
                  {frameFile.name}
                </Text>
              </>
            ) : (
              <Text component="span" fw={700}>
                Historial de Envíos
              </Text>
            )}
          </>
        }
        withCloseButton={true}
        zIndex={1000}
      >
        {frameFile ? (
          <DriveFileFrame fileId={frameFile.id} fileName={frameFile.name} />
        ) : (
          historyRows
        )}
      </Modal>
    </Container>
  );
};

export default ResponsibleReportsPage;
