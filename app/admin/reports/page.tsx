"use client";

import { use, useEffect, useState } from "react";
import {
  Container,
  Table,
  Button,
  Modal,
  TextInput,
  Group,
  Pagination,
  Center,
  FileInput,
  MultiSelect,
  Switch,
  rem,
  Text,
  Textarea,
  Select,
  Tooltip,
  Title,
  Pill,
} from "@mantine/core";
import {
  IconArrowBigDownFilled,
  IconArrowBigUpFilled,
  IconArrowRight,
  IconArrowsTransferDown,
  IconCancel,
  IconCheck,
  IconChevronsLeft,
  IconCirclePlus,
  IconDeviceFloppy,
  IconEdit,
  IconFileDescription,
  IconTrash,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { showNotification } from "@mantine/notifications";
import uploadAnimation from "../../../public/lottie/upload.json";
import successAnimation from "../../../public/lottie/success.json";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { DriveFileFrame } from "@/app/components/DriveFileFrame";
import { useSort } from "../../hooks/useSort";

type LottieProps = {
  animationData: object;
  loop: boolean;
};

const Lottie = dynamic(() => import("lottie-react").then((mod) => mod.default), {
  ssr: false,
}) as React.FC<LottieProps>;

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
}

interface DriveFile {
  id: string;
  name: string;
}

const AdminReportsPage = () => {
  const { data: session } = useSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [opened, setOpened] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fileName, setFileName] = useState("");
  const [requiresAttachment, setRequiresAttachment] = useState<boolean>(false);
  const [reportExample, setReportExample] = useState<File | null>(null);
  const [frameFile, setFrameFile] = useState<DriveFile | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { sortedItems: sortedReports, handleSort, sortConfig } = useSort<Report>(reports, { key: null, direction: "asc" });

  const fetchReports = async (page: number, search: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/reports/all`,
        {
          params: { page, limit: 10, search, email: session?.user?.email },
        }
      );
      if (response.data) {
        setReports(response.data.reports);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      setReports([]);
    }
  };

  const fetchPublishOptions = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/pReports/feed`,
        { params: { email: session?.user?.email } }
      );
      if (response.data) {
        setDimensions(response.data.dimensions);
        setPeriods(response.data.periods);
      }
    } catch (error) {
      console.error("Error fetching publish options:", error);
      setDimensions([]);
      setPeriods([]);
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

  const handleCreateOrEdit = async () => {
    if ((!name || !reportExample) && !selectedReport) {
      showNotification({
        title: "Error",
        message: "El nombre y el formato de ejemplo son requeridos",
        color: "red",
      });
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("requires_attachment", requiresAttachment.toString());
    formData.append("file_name", fileName);
    formData.append("email", session?.user?.email || "");
    if(reportExample)
      formData.append("report_example", reportExample);

    setLoading(true);

    try {
      if (selectedReport) {
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/reports/update/${selectedReport._id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        showNotification({
          title: "Actualizado",
          message: "Reporte actualizado exitosamente",
          color: "teal",
        });
      } else {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/reports/create`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        showNotification({
          title: "Creado",
          message: "Reporte creado exitosamente",
          color: "teal",
        });
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        handleModalClose();
        fetchReports(page, search);
      }, 3000);
    } catch (error: any) {
      console.error("Error creando o actualizando reporte:", error);
      if(error.response.data.message){
        showNotification({
          title: "Error",
          message: "Este reporte ya se encuentra publicado y con reporte(s) cargado(s), no se puede modificar",
          color: "red",
        });
      } else {
        showNotification({
          title: "Error",
          message: "Hubo un error al crear o actualizar el reporte",
          color: "red",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (report: Report) => {
    setSelectedReport(report);
    setName(report.name);
    setDescription(report.description);
    setRequiresAttachment(report.requires_attachment);
    setFileName(report.file_name);
    setOpened(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/reports/delete/${id}`);
      showNotification({
        title: "Eliminado",
        message: "Reporte eliminado exitosamente",
        color: "teal",
      });
      fetchReports(page, search);
    } catch (error) {
      console.error("Error eliminando reporte:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al eliminar el reporte",
        color: "red",
      });
    }
  };

  const handleModalClose = () => {
    setOpened(false);
    setName("");
    setDescription("");
    setRequiresAttachment(false);
    setReportExample(null);
    setSelectedReport(null);
    setFileName("");
    setLoading(false);
    setSuccess(false);
  };

  const handlePublishModalClose = () => {
    setSelectedReport(null);
    setPublishing(false);
    setDimensions([]);
    setPeriods([]);
    setSelectedDimensions([]);
    setSelectedPeriod(null);
  };

  const handleSubmitPublish = async () => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/pReports/publish`, {
        reportId: selectedReport?._id,
        periodId: selectedPeriod,
        dimensionsId: selectedDimensions,
      });
      showNotification({
        title: "Publicación Exitosa",
        message: "El reporte ha sido publicado exitosamente",
        color: "teal",
      });
      handlePublishModalClose();
    } catch (error) {
      console.error("Error asignando reporte:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al asignar el reporte",
        color: "red",
      });
    }
  };

  const checkIfChanges = () => {
    if(!selectedReport) return false
    else if (
      name !== selectedReport.name ||
        description !== selectedReport.description ||
        requiresAttachment !== selectedReport.requires_attachment ||
        fileName !== selectedReport.file_name ||
        reportExample
    ) {
      return false;
    }

    return true;
  }

  const rows = sortedReports.map((report: Report) => (
    <Table.Tr key={report._id}>
      <Table.Td>{report.name}</Table.Td>
      <Table.Td>{report.description}</Table.Td>
      <Table.Td>{report.file_name}</Table.Td>
      <Table.Td>
        {report.created_by?.full_name || report.created_by?.email}
      </Table.Td>
      <Table.Td>
        <Center>
          <Group gap={5}>
            <Tooltip
                  label="Editar reporte"
                  transitionProps={{ transition: 'fade-up', duration: 300 }}
            >
              <Button variant="outline" onClick={() => handleEdit(report)}>
                <IconEdit size={16} />
              </Button>
            </Tooltip>
            <Tooltip
                  label="Eliminar reporte"
                  transitionProps={{ transition: 'fade-up', duration: 300 }}
            >
              <Button
                color="red"
                variant="outline"
                onClick={() => handleDelete(report._id)}
              >
                <IconTrash size={16} />
              </Button>
            </Tooltip>
            <Tooltip
              label="Ver formato adjunto"
              transitionProps={{ transition: 'fade-up', duration: 300 }}
            >
              <Button
                variant="outline"
                onClick={() => 
                  setFrameFile({id: report.report_example_id, name: report.file_name})
                }
              >
                <IconFileDescription size={16} />
              </Button>
            </Tooltip>
          </Group>
        </Center>
      </Table.Td>
      <Table.Td>
        <Center>
          <Tooltip
            label="Asignar a dimension(es)"
            transitionProps={{ transition: 'fade-up', duration: 300 }}
          >
            <Button
              variant="outline"
              onClick={() => {
                fetchPublishOptions();
                setPublishing(true);
                setSelectedReport(report);
              }}
            >
              <IconUser size={16} />
            </Button>
          </Tooltip>
        </Center>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl">
      <Title>Gestión de Reportes</Title>
      <TextInput
        placeholder="Buscar en todos los reportes"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="md"
      />
      <Group>
        <Button
          onClick={() => {
            setSelectedReport(null);
            setOpened(true);
          }}
          leftSection={<IconCirclePlus/>}
        >
          Crear Nuevo Reporte
        </Button>
        <Button
          ml={"auto"}
          onClick={() => router.push("reports/uploaded")}
          variant="outline"
          rightSection={<IconArrowRight size={16} />}
        >
          Ir a Reportes Publicados
        </Button>
      </Group>
      <Table striped withTableBorder mt="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>
              <Center inline>
                Nombre
                {sortConfig.key === "name" ? (
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
            <Table.Th onClick={() => handleSort("description")} style={{ cursor: "pointer" }}>
              <Center inline>
                Descripción
                {sortConfig.key === "description" ? (
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
            <Table.Th onClick={() => handleSort("file_name")} style={{ cursor: "pointer" }}>
              <Center inline>
                Nombre de Archivo
                {sortConfig.key === "file_name" ? (
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
            <Table.Th onClick={() => handleSort("created_by.full_name")} style={{ cursor: "pointer" }}>
              <Center inline>
                Creado Por
                {sortConfig.key === "created_by.full_name" ? (
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
            <Table.Th>
              <Center>Acciones</Center>
            </Table.Th>
            <Table.Th>
              <Center>Asignar</Center>
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
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        onClose={handleModalClose}
        title={selectedReport ? "Editar Reporte" : "Crear Nuevo Reporte"}
      >
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
            <TextInput
              required={true}
              withAsterisk={true}
              label="Nombre"
              placeholder="Nombre del reporte"
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
            />
            <Textarea
              label="Descripción"
              placeholder="Descripción del reporte"
              required={false}
              value={description}
              onChange={(event) => setDescription(event.currentTarget.value)}
              minRows={2}
              maxRows={5}
            />
            <TextInput
              required={true}
              withAsterisk={true}
              label="Nombre de archivo"
              placeholder="Ingrese el nombre del archivo"
              value={fileName}
              onChange={(event) => setFileName(event.currentTarget.value)}
            />
            <FileInput
              required={true}
              withAsterisk={true}
              label="Archivo de ejemplo"
              placeholder="Seleccione el archivo de ejemplo"
              value={reportExample}
              onChange={setReportExample}
            />
            <Group my={"xs"}>
              <Text size="sm">¿Necesita Anexos?</Text>
              <Switch
                checked={requiresAttachment}
                onChange={(event) =>
                  setRequiresAttachment(event.currentTarget.checked)
                }
                color="rgba(25, 113, 194, 1)"
                size="md"
                thumbIcon={
                  requiresAttachment ? (
                    <IconCheck
                      style={{ width: rem(12), height: rem(12) }}
                      color={"rgba(25, 113, 194, 1)"}
                      stroke={3}
                    />
                  ) : (
                    <IconX
                      style={{ width: rem(12), height: rem(12) }}
                      color={"red"}
                      stroke={3}
                    />
                  )
                }
              />
            </Group>
            {selectedReport && (
              <Group mt="sm">
                <Text size="sm">
                  Reporte cargado:{" "}
                </Text>
                <Pill
                  onClick={() => {
                    setFrameFile({id: selectedReport.report_example_id, name: selectedReport.file_name});
                  }}
                  style={{ cursor: "pointer" }}
                  bg={"blue"}
                  c={"white"}
                  size="xs"
                >
                  {selectedReport.file_name}
                </Pill>
              </Group>
            )}
            <Group mt="lg" grow>
              <Button
                onClick={handleCreateOrEdit} 
                disabled={checkIfChanges()}
                justify="space-between"
                rightSection={<span/>}
                leftSection={<IconDeviceFloppy />}
              >
                {selectedReport ? "Actualizar" : "Crear Reporte"}
              </Button>
              <Button
                onClick={handleModalClose}
                variant="light"
                color="red"
                justify="space-between"
                rightSection={<IconCancel/>}
                leftSection={<span/>}
              >
                Cancelar
              </Button>
            </Group>
          </>
        )}
      </Modal>
      <Modal
        opened={publishing}
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        onClose={handlePublishModalClose}
        title="Asignar Reporte a Dimension(es)"
      >
        <MultiSelect
          data={dimensions.map((dimension) => ({
            value: dimension._id,
            label: dimension.name,
          }))}
          value={selectedDimensions}
          onChange={setSelectedDimensions}
          searchable
          placeholder="Selecciona las dimensiones"
          label="Dimensiones"
          required
        />
        <Select
          data={periods.map((period) => ({
            value: period._id,
            label: period.name,
          }))}
          value={selectedPeriod}
          onChange={(value) => setSelectedPeriod(value || null)}
          searchable
          placeholder="Selecciona el periodo"
          label="Periodo"
          required
        />
        <Group mt="md" grow>
          <Button onClick={handleSubmitPublish}>Asignar</Button>
          <Button variant="outline" onClick={handlePublishModalClose}>
            Cancelar
          </Button>
        </Group>
      </Modal>
      <Modal
        opened={frameFile !== null}
        onClose={() => setFrameFile(null)}
        size={'xl'}
        title={
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
          </>
        }
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <DriveFileFrame fileId={frameFile?.id || ""} fileName={frameFile?.name || ""} />
      </Modal>

    </Container>
  );
};

export default AdminReportsPage;
