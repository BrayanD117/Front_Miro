"use client";

import { useEffect, useState } from "react";
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
} from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { showNotification } from "@mantine/notifications";

interface Report {
  _id: string;
  name: string;
  description: string;
  report_example_path: string;
  required_files: string[];
  created_by: {
    email: string;
    full_name: string;
  };
}

const AdminReportsPage = () => {
  const { data: session } = useSession(); // Obtén la sesión para acceder al email
  const [reports, setReports] = useState<Report[]>([]);
  const [opened, setOpened] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [requiredFiles, setRequiredFiles] = useState<string[]>([]);
  const [reportExample, setReportExample] = useState<File | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const fetchReports = async (page: number, search: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports/all`, {
        params: { page, limit: 10, search, email: session?.user?.email }, // Añadir el email como parámetro
      });
      if (response.data) {
        setReports(response.data.reports);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      setReports([]);
    }
  };

  useEffect(() => {
    if (session?.user?.email) {
      fetchReports(page, search); // Asegúrate de que el email está disponible antes de hacer la solicitud
    }
  }, [page, session?.user?.email]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (session?.user?.email) {
        fetchReports(page, search);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, session?.user?.email]);

  const handleCreateOrEdit = async () => {
    if (!name || !reportExample || requiredFiles.length === 0) {
      showNotification({
        title: "Error",
        message: "El nombre, el archivo de ejemplo y los archivos requeridos son obligatorios",
        color: "red",
      });
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("required_files", JSON.stringify(requiredFiles));
    formData.append("report_example", reportExample);
    formData.append("email", session?.user?.email || ""); // Utiliza el email del usuario autenticado

    try {
      if (selectedReport) {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/reports/${selectedReport._id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        showNotification({
          title: "Actualizado",
          message: "Reporte actualizado exitosamente",
          color: "teal",
        });
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/reports/create`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        showNotification({
          title: "Creado",
          message: "Reporte creado exitosamente",
          color: "teal",
        });
      }

      handleModalClose();
      fetchReports(page, search);
    } catch (error) {
      console.error("Error creando o actualizando reporte:", error);

      showNotification({
        title: "Error",
        message: "Hubo un error al crear o actualizar el reporte",
        color: "red",
      });
    }
  };

  const handleEdit = (report: Report) => {
    setSelectedReport(report);
    setName(report.name);
    setDescription(report.description);
    setRequiredFiles(report.required_files);
    setOpened(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/reports/${id}`);
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
    setRequiredFiles([]);
    setReportExample(null);
    setSelectedReport(null);
  };

  const rows = reports.map((report: Report) => (
    <Table.Tr key={report._id}>
      <Table.Td>{report.name}</Table.Td>
      <Table.Td>{report.description}</Table.Td>
      <Table.Td>{report.created_by?.full_name || report.created_by?.email}</Table.Td>
      <Table.Td>
        <Center>
          <Group gap={5}>
            <Button variant="outline" onClick={() => handleEdit(report)}>
              <IconEdit size={16} />
            </Button>
            <Button color="red" variant="outline" onClick={() => handleDelete(report._id)}>
              <IconTrash size={16} />
            </Button>
          </Group>
        </Center>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl">
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
        >
          Crear Nuevo Reporte
        </Button>
      </Group>
      <Table striped withTableBorder mt="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Descripción</Table.Th>
            <Table.Th>Creado Por</Table.Th>
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
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        onClose={handleModalClose}
        title={selectedReport ? "Editar Reporte" : "Crear Nuevo Reporte"}
      >
        <Group mb="md" grow>
          <Button onClick={handleCreateOrEdit}>
            {selectedReport ? "Actualizar" : "Crear"}
          </Button>
          <Button onClick={handleModalClose} variant="outline">
            Cancelar
          </Button>
        </Group>
        <TextInput
          label="Nombre"
          placeholder="Nombre del reporte"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <TextInput
          label="Descripción"
          placeholder="Descripción del reporte"
          value={description}
          onChange={(event) => setDescription(event.currentTarget.value)}
        />
        <MultiSelect
          label="Archivos Requeridos"
          placeholder="Selecciona los archivos requeridos"
          data={[
            { value: "archivo1", label: "Archivo 1" },
            { value: "archivo2", label: "Archivo 2" },
            { value: "archivo3", label: "Archivo 3" },
          ]}
          value={requiredFiles}
          onChange={setRequiredFiles}
          searchable
          clearable
        />
        <FileInput
          label="Archivo de Ejemplo"
          placeholder="Subir archivo de ejemplo"
          value={reportExample}
          onChange={setReportExample}
        />
      </Modal>
    </Container>
  );
};

export default AdminReportsPage;
