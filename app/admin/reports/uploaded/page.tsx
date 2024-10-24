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
  Progress,
  rem,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconBrandGoogleDrive,
  IconCancel,
  IconChevronsLeft,
  IconDeviceFloppy,
  IconFileDescription,
  IconFolderOpen,
  IconHistoryToggle,
  IconReportSearch,
  IconTrash,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { dateToGMT } from "@/app/components/DateConfig";
import { modals } from "@mantine/modals";
import { showNotification } from "@mantine/notifications";
import { DriveFileFrame } from "@/app/components/DriveFileFrame";

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

interface File {
  id: string;
  name: string;
  view_link: string;
  download_link: string;
  folder_id: string;
}

interface FilledReport {
  _id: string;
  dimension: Dimension;
  send_by: any;
  loaded_date: Date;
  report_file: File;
  attachments: File[];
  status: string | null;
  status_date: Date;
  observations: string | null;
  evaluated_by: any;
}

interface PublishedReport {
  _id: string;
  report: Report;
  dimensions: Dimension[];
  period: Period;
  filled_reports: FilledReport[];
  folder_id: string;
}

const AdminPubReportsPage = () => {
  const { data: session } = useSession();
  const [pubReports, setPubReports] = useState<PublishedReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<
    PublishedReport | null | undefined
  >(null);
  const [filledReportRows, setFilledReportRows] = useState<FilledReport[]>([]);
  const [filledReport, setFilledReport] = useState<FilledReport | null>(null);
  const [opened, setOpened] = useState<boolean>(false);
  const [statusOpened, setStatusOpened] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string | null>(null);
  const [observations, setObservations] = useState<string | null>(null);
  const [filledReportsHistory, setFilledReportsHistory] = useState<
    FilledReport[]
  >([]);
  const [frameFile, setFrameFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const theme = useMantineTheme();

  const options = [
    {
      value: "En Revisión",
      label: "En Revisión",
      color: theme.colors.yellow[9],
    },
    { value: "Aprobado", label: "Aprobado", color: theme.colors.green[7] },
    { value: "Rechazado", label: "Rechazado", color: theme.colors.red[7] },
  ];

  const fetchReports = async (page: number, search: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/pReports/all`,
        {
          params: {
            page: page,
            search: search,
            email: session?.user?.email,
          },
        }
      );
      if (response.data) {
        console.log(response.data);
        setPubReports(response.data.publishedReports);
        setTotalPages(response.data.totalPages);
        if (selectedReport) {
          setSelectedReport(
            response.data.publishedReports.find(
              (report: any) => report._id === selectedReport._id
            )
          );
          setFilledReportRows(
            response.data.publishedReports.find(
              (report: any) => report._id === selectedReport._id
            ).filled_reports
          );
        }
      }
    } catch (error) {
      console.error(error);
      setPubReports([]);
    }
  };

  const fetchHistory = async (reportId: string, dimensionId: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/pReports/history`,
        {
          params: { reportId, dimensionId },
        }
      );
      if (response.data) {
        setFilledReportsHistory(response.data);
      } else {
        showNotification({
          title: "Error",
          message: "Sin historial",
          color: "orange",
        });
        setFilledReportsHistory([]);
      }
    } catch (error) {
      showNotification({
        title: "Error",
        message: "Sin historial",
        color: "orange",
      });
      setFilledReportsHistory([]);
    }
  };

  useEffect(() => {
    if (session?.user?.email) {
      fetchReports(page, search);
    }
  }, [page, session?.user?.email]);

  useEffect(() => {
    if (session?.user?.email) {
      const delayDebounceFn = setTimeout(() => {
        fetchReports(page, search);
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [search, session?.user?.email, page]);

  const giveReportPercentage = (pubReport: PublishedReport) => {
    return (
      (pubReport.filled_reports.length / pubReport.dimensions.length) * 100
    );
  };

  const truncateString = (str: string, maxLength: number = 20): string => {
    return str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
  };

  const handleOpenModalStatus = (index: number, newStatus: string | null) => {
    setStatusOpened(true);
    const report = selectedReport?.filled_reports[index];
    if (report) {
      setFilledReport(report);
    }
    setNewStatus(newStatus);
  };

  const handleCloseModalStatus = () => {
    setLoading(false);
    setStatusOpened(false);
    setNewStatus(null);
    setFilledReport(null);
    setObservations(null);
    fetchReports(page, search);
  };

  const handleUpdateStatus = async () => {
    setLoading(true);
    if (filledReport && newStatus) {
      if (newStatus === "Rechazado" && !observations) {
        showNotification({
          title: "Error",
          message: "Por favor ingrese una razón de rechazo",
          color: "red",
        });
        setLoading(false);
        return;
      }
      try {
        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/pReports/status`,
          {
            reportId: selectedReport?._id,
            filledRepId: filledReport._id,
            status: newStatus,
            observations: observations,
            email: session?.user?.email,
          }
        );
        if (response.data) {
          handleCloseModalStatus();
          showNotification({
            title: "Éxito",
            message: "Estado actualizado correctamente",
            color: "green",
          });
          fetchReports(page, search);
        }
      } catch (error) {
        handleCloseModalStatus();
        showNotification({
          title: "Error",
          message: "Ocurrió un error al actualizar el estado",
          color: "red",
        });
      }
    }
  };

  const handleDeletePubReport = async (reportId: string) => {
    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/pReports/delete/${reportId}`,
        {
          params: {
            email: session?.user?.email,
          },
        }
      );
      if (response.data) {
        showNotification({
          title: "Éxito",
          message: "Reporte eliminado correctamente",
          color: "green",
        });
        fetchReports(page, search);
      }
    } catch (error: any) {
      if (error.response.status === 400) {
        showNotification({
          title: "Error",
          message: "Ocurrió un error al eliminar el reporte",
          color: "red",
          autoClose: 1200,
        });
        showNotification({
          title: "Error",
          message:
            "El reporte que intentas borrar tiene borradores de envío de los responsables",
          color: "red",
          autoClose: 4000,
        });
      }
    }
  };

  const pendingReports = selectedReport?.dimensions.map((dimension) => {
    if (
      !filledReportRows.some(
        (filledReport: FilledReport) =>
          filledReport.dimension._id === dimension._id
      )
    ) {
      return (
        <Table.Tr key={dimension._id}>
          <Table.Td>{dimension.name}</Table.Td>
          <Table.Td colSpan={8}>No hay envíos registrados...</Table.Td>
        </Table.Tr>
      );
    }
  });

  const historyRows = filledReportsHistory.map((filledReport, index) => {
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
            onClick={() => 
              setFrameFile(filledReport.report_file)
            }
            bg="gray"
            c="white"
            style={{ cursor: "pointer" }}
          >
            {filledReport.report_file?.name}
          </Pill>
        </Group>
        {filledReport.attachments.length > 0 && (
          <Group mt={"xs"}>
            <Text size="sm">Anexos: </Text>
            <PillGroup>
              {filledReport.attachments.map((attachment) => (
                <Pill
                  key={attachment.id}
                  onClick={() => 
                    setFrameFile(attachment)
                  }
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
          <Text size="sm" mt={"xs"}>
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
  });

  const selectedReportRows = filledReportRows?.map(
    (filledReport: FilledReport, index) => {
      return (
        <Table.Tr key={filledReport.report_file.id}>
          <Table.Td>{filledReport.dimension.name}</Table.Td>
          <Table.Td>
            {dateToGMT(filledReport.loaded_date, "D/MM/YYYY H:mm")}
          </Table.Td>
          <Table.Td>{truncateString(filledReport.send_by.full_name)}</Table.Td>
          <Table.Td>
            <Center>
              <Select
                onChange={(value) => {
                  handleOpenModalStatus(index, value);
                }}
                allowDeselect={false}
                data={options}
                w={rem(130)}
                value={filledReport.status}
                radius={"xl"}
                fw={700}
                styles={{
                  input: {
                    borderColor: options.find(
                      (option) => option.value === filledReport.status
                    )?.color, // Change the border color
                    color: options.find(
                      (option) => option.value === filledReport.status
                    )?.color, // Change the text color
                  },
                }}
              />
            </Center>
          </Table.Td>
          <Table.Td>
            <Center>
              <Group gap={'xs'}>
                <Tooltip label="Ver reporte">
                  <Button
                    size="compact-lg"
                    variant="outline"
                    onClick={() => 
                      setFrameFile(filledReport.report_file)
                    }
                  >
                    <IconReportSearch size={16} />
                  </Button>
                </Tooltip>
                <Tooltip label="Ver carpeta de reporte">
                  <Button
                    size="compact-lg"
                    variant="outline"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.open(
                          `https://drive.google.com/drive/folders/${filledReport.report_file.folder_id}`
                        );
                      }
                    }}
                  >
                    <IconFolderOpen size={16} />
                  </Button>
                </Tooltip>
                <Tooltip label="Ver historial">
                  <Button
                    size="compact-lg"
                    variant="outline"
                    onClick={() => {
                      if (selectedReport?._id) {
                        fetchHistory(
                          selectedReport._id,
                          filledReport.dimension._id
                        );
                      }
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
    }
  );

  const rows = pubReports?.length ? (
    pubReports.map((pubReport: PublishedReport) => {
      return (
        <Table.Tr key={pubReport._id}>
          <Table.Td maw={rem(55)}>
            <Center>
              <Badge size={rem(12)} h={rem(8)} variant="light" p={"xs"}>
                {pubReport.period.name}
              </Badge>
            </Center>
          </Table.Td>
          <Table.Td>{pubReport.report.name}</Table.Td>
          <Table.Td>{pubReport.report.file_name}</Table.Td>
          <Table.Td>
            <Center>
              <Stack gap={0}>
                <Progress.Root
                  mt={"xs"}
                  size={"md"}
                  radius={"md"}
                  w={rem(200)}
                  onClick={() => {
                    setSelectedReport(pubReport);
                    setFilledReportRows(pubReport.filled_reports);
                    setOpened(true);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <Progress.Section
                    value={giveReportPercentage(pubReport)}
                  />
                </Progress.Root>
                <Text size="sm" ta={"center"} mt={rem(5)}>
                  {pubReport.filled_reports.length} de{" "}
                  {pubReport.dimensions.length}
                </Text>
              </Stack>
            </Center>
          </Table.Td>
          <Table.Td>
            <Center>
              <Group>
                <Tooltip
                  label="Ver reportes cargados"
                  transitionProps={{ transition: "fade-up", duration: 300 }}
                >
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedReport(pubReport);
                      setFilledReportRows(pubReport.filled_reports);
                      setOpened(true);
                    }}
                  >
                    <IconFileDescription size={20} />
                  </Button>
                </Tooltip>
                <Tooltip
                  label="Ver carpeta de reportes"
                  transitionProps={{ transition: "fade-up", duration: 300 }}
                >
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.open(
                          `https://drive.google.com/drive/folders/${pubReport.folder_id}`
                        );
                      }
                    }}
                    disabled={
                      !pubReport.folder_id ||
                      pubReport.filled_reports.length === 0
                    }
                  >
                    <IconBrandGoogleDrive size={20} />
                  </Button>
                </Tooltip>
                <Button onClick={() => router.push(`uploaded/${pubReport._id}`)}>
                  Reporte
                </Button>
                <Tooltip
                  label={
                    pubReport.filled_reports.length > 0
                      ? "No puedes borrar porque hay reportes cargados"
                      : "Borrar publicación del reporte"
                  }
                  transitionProps={{ transition: "fade-up", duration: 300 }}
                >
                  <Button
                    variant="outline"
                    color="red"
                    disabled={pubReport.filled_reports.length > 0}
                    onClick={() => handleDeletePubReport(pubReport._id)}
                  >
                    <IconTrash size={20} />
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
      <Table.Td colSpan={10}>No se encontraron reportes publicados</Table.Td>
    </Table.Tr>
  );

  return (
    <Container size="xl">
      <Title ta="center" mb={"md"}>
        Proceso Cargue de Reportes
      </Title>
      <TextInput
        placeholder="Buscar en los reportes publicados"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="md"
      />
      <Group>
        <Button
          onClick={() => router.push("/admin/reports")}
          variant="outline"
          leftSection={<IconArrowLeft size={16} />}
        >
          Ir a Gestión de Reportes
        </Button>
      </Group>
      <Table striped withTableBorder mt="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={rem(100)}>
              <Center>Periodo</Center>
            </Table.Th>
            <Table.Th>Reporte</Table.Th>
            <Table.Th>Nombre de Archivo</Table.Th>
            <Table.Th>
              <Center>Progreso</Center>
            </Table.Th>
            <Table.Th>
              <Center>Acciones</Center>
            </Table.Th>
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
        onClose={() => {
          setFrameFile(null)
          setOpened(false)
        }}
        size={frameFile ? "xl" : "auto"}
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        title={
          frameFile ?
          <>
            <Button
              variant="light"
              onClick={() => setFrameFile(null)}
              leftSection={<IconChevronsLeft />}
              size="compact-md"
              mx={'sm'}
              fw={600}
            >
              Ir atrás
            </Button>
            <Text fw={600} component="span" size="sm">
              {frameFile?.name}
            </Text>
          </> :
          <Title size={"md"}>Reporte: {selectedReport?.report.name}</Title>
        }
      >
        { frameFile ? 
          <DriveFileFrame fileId={frameFile.id} fileName={frameFile.name} />
          :
          <Table striped withTableBorder mt="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Dimensión</Table.Th>
                <Table.Th>Carga</Table.Th>
                <Table.Th>Enviado por</Table.Th>
                <Table.Th>
                  <Center>Estado</Center>
                </Table.Th>
                <Table.Th>
                  <Center>Acciones</Center>
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{[...selectedReportRows, pendingReports]}</Table.Tbody>
          </Table>
        }
      </Modal>
      <Modal
        opened={statusOpened}
        onClose={handleCloseModalStatus}
        size="auto"
        overlayProps={{
          backgroundOpacity: 0.2,
          blur: 1,
        }}
        title={<Title size={"md"}>{selectedReport?.report.name}</Title>}
      >
        <Text fw={700}>Dimensión: {filledReport?.dimension.name}</Text>
        {newStatus === "Rechazado" && (
          <Textarea
            mt={"md"}
            label={
              <Text fw={700}>
                Razón de rechazo:{" "}
                <Text component="span" c={"red"}>
                  *
                </Text>
              </Text>
            }
            placeholder="Ingrese observaciones al rechazo de la solicitud"
            rows={3}
            mb="md"
            style={{ width: "100%" }}
            resize="vertical"
            onChange={(event) => setObservations(event.currentTarget.value)}
          ></Textarea>
        )}
        <Text mt="md" fw={700}>
          ¿Estás seguro de cambiar el estado a{" "}
          <Text
            component="span"
            fw={700}
            c={options.find((option) => option.value === newStatus)?.color}
          >
            {newStatus}
          </Text>
          ?
        </Text>
        <Group mt={"md"} grow>
          <Button
            onClick={handleUpdateStatus}
            color="blue"
            variant="outline"
            leftSection={<IconDeviceFloppy />}
            loading={loading}
          >
            Guardar
          </Button>
          <Button
            onClick={handleCloseModalStatus}
            color="red"
            variant="outline"
            leftSection={<IconCancel />}
          >
            Cancelar
          </Button>
        </Group>
      </Modal>
      <Modal
        opened={filledReportsHistory.length > 0}
        onClose={() => {
          setFrameFile(null)
          setFilledReportsHistory([])
        }}
        size={frameFile ? "xl" : "md"}
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        title={ frameFile ?
          <>
            <Button
              variant="light"
              onClick={() => setFrameFile(null)}
              leftSection={<IconChevronsLeft />}
              size="compact-md"
              mx={'sm'}
              fw={600}
            >
              Ir atrás
            </Button>
            <Text fw={600} component="span" size="sm">
              {frameFile?.name}
            </Text>
          </> : "Historial de Envíos"}
        withCloseButton={true}
      >
        { frameFile ? 
        <DriveFileFrame fileId={frameFile.id} fileName={frameFile.name} />
        : historyRows }
      </Modal>
    </Container>
  );
};

export default AdminPubReportsPage;
