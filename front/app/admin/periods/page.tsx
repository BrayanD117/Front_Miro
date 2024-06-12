"use client";

import { useEffect, useState } from "react";
import { Container, Table, Button, Modal, TextInput, Group, Pagination, Center, Switch, Text, Stack } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import 'dayjs/locale/es';

interface Period {
  _id: string;
  name: string;
  start_date: string;
  end_date: string;
  collect_start_date: string;
  collect_end_date: string;
  upload_start_date: string;
  upload_end_date: string;
  is_active: boolean;
}

const AdminPeriodsPage = () => {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [opened, setOpened] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [collectStartDate, setCollectStartDate] = useState<Date | null>(null);
  const [collectEndDate, setCollectEndDate] = useState<Date | null>(null);
  const [uploadStartDate, setUploadStartDate] = useState<Date | null>(null);
  const [uploadEndDate, setUploadEndDate] = useState<Date | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const fetchPeriods = async (page: number, search: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/periods/all`, {
        params: { page, limit: 10, search },
      });
      if (response.data) {
        setPeriods(response.data || []);
        setTotalPages(response.data.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching periods:", error);
      setPeriods([]);
    }
  };

  useEffect(() => {
    fetchPeriods(page, search);
  }, [page, search]);

  const handleEdit = (period: Period) => {
    setSelectedPeriod(period);
    setName(period.name);
    setStartDate(new Date(period.start_date));
    setEndDate(new Date(period.end_date));
    setCollectStartDate(new Date(period.collect_start_date));
    setCollectEndDate(new Date(period.collect_end_date));
    setUploadStartDate(new Date(period.upload_start_date));
    setUploadEndDate(new Date(period.upload_end_date));
    setIsActive(period.is_active);
    setOpened(true);
  };

  const handleSave = async () => {
    if (!name || !startDate || !endDate || !collectStartDate || !collectEndDate || !uploadStartDate || !uploadEndDate) {
      showNotification({
        title: "Error",
        message: "Todos los campos son requeridos",
        color: "red",
      });
      return;
    }

    try {
      const periodData = {
        name,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        collect_start_date: collectStartDate.toISOString(),
        collect_end_date: collectEndDate.toISOString(),
        upload_start_date: uploadStartDate.toISOString(),
        upload_end_date: uploadEndDate.toISOString(),
        is_active: isActive,
      };

      if (selectedPeriod) {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/periods/${selectedPeriod._id}`, periodData);
        showNotification({
          title: "Actualizado",
          message: "Periodo actualizado exitosamente",
          color: "teal",
        });
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/periods/create`, periodData);
        showNotification({
          title: "Creado",
          message: "Periodo creado exitosamente",
          color: "teal",
        });
      }

      handleModalClose();
      fetchPeriods(page, search);
    } catch (error) {
      console.error("Error guardando periodo:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al guardar el periodo",
        color: "red",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/periods/${id}`);
      showNotification({
        title: "Eliminado",
        message: "Periodo eliminado exitosamente",
        color: "teal",
      });
      fetchPeriods(page, search);
    } catch (error) {
      console.error("Error eliminando periodo:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al eliminar el periodo",
        color: "red",
      });
    }
  };

  const handleModalClose = () => {
    setOpened(false);
    setName("");
    setStartDate(null);
    setEndDate(null);
    setCollectStartDate(null);
    setCollectEndDate(null);
    setUploadStartDate(null);
    setUploadEndDate(null);
    setIsActive(false);
    setSelectedPeriod(null);
  };

  const rows = periods.map((period) => (
    <Table.Tr key={period._id}>
      <Table.Td>{period.name}</Table.Td>
      <Table.Td>{new Date(period.start_date).toLocaleDateString()}</Table.Td>
      <Table.Td>{new Date(period.end_date).toLocaleDateString()}</Table.Td>
      <Table.Td>{new Date(period.collect_start_date).toLocaleDateString()}</Table.Td>
      <Table.Td>{new Date(period.collect_end_date).toLocaleDateString()}</Table.Td>
      <Table.Td>{new Date(period.upload_start_date).toLocaleDateString()}</Table.Td>
      <Table.Td>{new Date(period.upload_end_date).toLocaleDateString()}</Table.Td>
      <Table.Td>{period.is_active ? "Activo" : "Inactivo"}</Table.Td>
      <Table.Td>
        <Group gap={5}>
          <Button variant="outline" onClick={() => handleEdit(period)}>
            <IconEdit size={16} />
          </Button>
          <Button color="red" variant="outline" onClick={() => handleDelete(period._id)}>
            <IconTrash size={16} />
          </Button>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl">
      <TextInput
        placeholder="Buscar en todos los periodos"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="md"
      />
      <Group>
        <Button onClick={() => {
          setSelectedPeriod(null);
          setOpened(true);
        }}>Crear Nuevo Periodo</Button>
      </Group>
      <Table striped withTableBorder mt="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Fecha de Inicio</Table.Th>
            <Table.Th>Fecha de Fin</Table.Th>
            <Table.Th>Inicio de Recolección</Table.Th>
            <Table.Th>Fin de Recolección</Table.Th>
            <Table.Th>Inicio de Subida</Table.Th>
            <Table.Th>Fin de Subida</Table.Th>
            <Table.Th>Estado</Table.Th>
            <Table.Th>Acciones</Table.Th>
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
        size="lg"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        onClose={handleModalClose}
        title={selectedPeriod ? "Editar Periodo" : "Crear Nuevo Periodo"}
      >
        <TextInput
          label="Nombre"
          placeholder="Nombre del periodo"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          mb="md"
        />
        <Stack mb="md">
          <Text>Fecha de Inicio</Text>
          <DateInput
            locale="es"
            placeholder="Selecciona una fecha"
            value={startDate}
            onChange={setStartDate}
          />
        </Stack>
        <Stack mb="md">
          <Text>Fecha de Fin</Text>
          <DateInput
            locale="es"
            placeholder="Selecciona una fecha"
            value={endDate}
            onChange={setEndDate}
          />
        </Stack>
        <Stack mb="md">
          <Text>Inicio de Recolección</Text>
          <DateInput
            locale="es"
            placeholder="Selecciona una fecha"
            value={collectStartDate}
            onChange={setCollectStartDate}
          />
        </Stack>
        <Stack mb="md">
          <Text>Fin de Recolección</Text>
          <DateInput
            locale="es"
            placeholder="Selecciona una fecha"
            value={collectEndDate}
            onChange={setCollectEndDate}
          />
        </Stack>
        <Stack mb="md">
          <Text>Inicio de Subida</Text>
          <DateInput
            locale="es"
            placeholder="Selecciona una fecha"
            value={uploadStartDate}
            onChange={setUploadStartDate}
          />
        </Stack>
        <Stack mb="md">
          <Text>Fin de Subida</Text>
          <DateInput
            locale="es"
            placeholder="Selecciona una fecha"
            value={uploadEndDate}
            onChange={setUploadEndDate}
          />
        </Stack>
        <Switch
          label="Activo"
          checked={isActive}
          onChange={(event) => setIsActive(event.currentTarget.checked)}
          mb="md"
        />
        <Group mt="md">
          <Button onClick={handleSave}>Guardar</Button>
          <Button variant="outline" onClick={handleModalClose}>
            Cancelar
          </Button>
        </Group>
      </Modal>
    </Container>
  );
};

export default AdminPeriodsPage;
