"use client";

import { useEffect, useState } from "react";
import { Container, Table, Button, Modal, TextInput, Group, Pagination, Center, Select, Text, List } from "@mantine/core";
import { IconSettings, IconEdit, IconTrash, IconEye, IconBulb, IconCirclePlus, IconDeviceFloppy, IconCancel, IconArrowBigUpFilled, IconArrowBigDownFilled, IconArrowsTransferDown } from "@tabler/icons-react";
import { useRouter } from 'next/navigation';
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import { useSort } from "../../hooks/useSort";
import { useSession } from "next-auth/react";

interface Dimension {
  _id: string;
  name: string;
  responsible: Dependency;
  producers: string[];
}

interface User {
  _id: string;
  full_name: string;
  email: string;
  roles: string[];
}

interface Dependency {
  _id: string;
  dep_code: string;
  name: string;
  responsible: string;
}

const AdminDimensionsPage = () => {
  const { data: session } = useSession();
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [opened, setOpened] = useState(false);
  const [confirmDeleteModalOpened, setConfirmDeleteModalOpened] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState<Dimension | null>(null);
  const [dimensionToDelete, setDimensionToDelete] = useState<Dimension | null>(null);
  const [allDependencies, setAllDependencies] = useState<Dependency[]>([]);
  const [name, setName] = useState("");
  const [responsible, setResponsible] = useState<Dependency | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { sortedItems: sortedDimensions, handleSort, sortConfig } = useSort<Dimension>(dimensions, { key: null, direction: "asc" });

  const fetchDimensions = async (page: number, search: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dimensions/all`, {
        params: { page, limit: 10, search },
      });
      if (response.data) {
        const dimensions = response.data.dimensions || [];
        setDimensions(dimensions);
        setTotalPages(response.data.pages || 1);
        console.log(dimensions);

      }
    } catch (error) {
      console.error("Error fetching dimensions:", error);
      setDimensions([]);
    }
  };

  const fetchDependencies = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dependencies/${session?.user?.email}`)
      console.log(response.data)
      setAllDependencies(response.data);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error("Error fetching dependencies:", error);
    }
  };

  useEffect(() => {
    fetchDimensions(page, search);
    fetchDependencies();
  }, [page]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDimensions(page, search);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleCreateOrEdit = async () => {
    if (!name || !responsible) {
      showNotification({
        title: "Error",
        message: "El nombre y el responsable son requeridos",
        color: "red",
      });
      return;
    }

    try {
      const dimensionData = {
        name,
        responsible: responsible._id,
      };

      if (selectedDimension) {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/dimensions/${selectedDimension._id}`, dimensionData);
        showNotification({
          title: "Actualizado",
          message: "Dimensión actualizada exitosamente",
          color: "teal",
        });
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/dimensions/create`, dimensionData);
        showNotification({
          title: "Creado",
          message: "Dimensión creada exitosamente",
          color: "teal",
        });
      }

      handleModalClose();
      fetchDimensions(page, search);
    } catch (error) {
      console.error("Error creando o actualizando dimensión:", error);

      if (axios.isAxiosError(error) && error.response && error.response.status === 400) {
        showNotification({
          title: "Error",
          message: "El nombre de la dimensión ya existe",
          color: "red",
        });
      } else {
        showNotification({
          title: "Error",
          message: "Hubo un error al crear o actualizar la dimensión",
          color: "red",
        });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!dimensionToDelete) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/dimensions/${id}`);
      showNotification({
        title: "Eliminado",
        message: "Dimensión eliminada exitosamente",
        color: "teal",
      });
      fetchDimensions(page, search);
      setConfirmDeleteModalOpened(false);
    } catch (error) {
      console.error("Error eliminando dimensión:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al eliminar la dimensión",
        color: "red",
      });
    }
  };

  const openConfirmDeleteModal = (dimension: Dimension) => {
    setDimensionToDelete(dimension);
    setConfirmDeleteModalOpened(true);
  };

  const handleModalClose = () => {
    setOpened(false);
    setName("");
    setResponsible(null);
    setSelectedDimension(null);
  };

  const handleConfigureDimension = (dimension: Dimension) => {
    setSelectedDimension(dimension);
    setResponsible(dimension.responsible);
    setOpened(true);
    setName(dimension.name);
    console.log(responsible)
  };
  
  const rows = sortedDimensions.map((dimension: Dimension) => (
    <Table.Tr key={dimension._id}>
      <Table.Td>{dimension.name}</Table.Td>
      <Table.Td>{dimension.responsible.name}</Table.Td>
      <Table.Td>{dimension.responsible?.responsible ?? "Sin responsable asignado"}</Table.Td>
      <Table.Td>
        <Center>
          <Group gap={5}>
            <Button variant="outline" onClick={() => handleConfigureDimension(dimension)}>
              <IconSettings size={16} />
            </Button>
            <Button color="red" variant="outline" onClick={() => openConfirmDeleteModal(dimension)}>
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
        placeholder="Buscar en todas las dimensiones"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="md"
      />
      <Group>
        <Button
          onClick={() => {
            setSelectedDimension(null);
            setOpened(true);
          }}
          leftSection={<IconCirclePlus/>}
        >
          Crear Nueva Dimensión
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
            <Table.Th onClick={() => handleSort("responsible")} style={{ cursor: "pointer" }}>
              <Center inline>
                Dependencia responsable
                {sortConfig.key === "responsible" ? (
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
            <Table.Th>Responsable dependencia</Table.Th>
            <Table.Th><Center>Acciones</Center></Table.Th>
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
        opened={confirmDeleteModalOpened}
        onClose={() => setConfirmDeleteModalOpened(false)}
        title="Confirmación de Eliminación"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        centered
      >
        <Text>¿Estás seguro de que deseas eliminar esta dimensión? Esta acción no se puede deshacer.</Text>
        <Group mt="md">
          <Button onClick={() => setConfirmDeleteModalOpened(false)} variant="light" color="gray">
            Cancelar
          </Button>
          <Button onClick={() => handleDelete(dimensionToDelete?._id || "")} color="red">
            Confirmar Eliminación
          </Button>
        </Group>
      </Modal>
      <Modal
        opened={opened}
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        onClose={handleModalClose}
        title={selectedDimension ? "Editar Dimensión" : "Crear Nueva Dimensión"}
      >
        <TextInput
          label="Nombre"
          placeholder="Nombre de la dimensión"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <Select
          label="Responsable"
          placeholder="Selecciona un responsable"
          data={allDependencies?.map((dep) => ({ value: dep._id, label: dep.name }))}
          value={responsible ? responsible._id : ""}
          onChange={(value) => {
            const selectedDep = allDependencies?.find((dep) => dep._id === value) || null;
            setResponsible(selectedDep);
          }}
          searchable
          clearable
        />
        <Group mt="md" grow>
          <Button 
            onClick={handleCreateOrEdit}
            leftSection={<IconDeviceFloppy/>}
            rightSection={<span/>}
            justify="space-between"
          >
            {selectedDimension ? "Actualizar" : "Crear"}
          </Button>
          <Button
            onClick={handleModalClose}
            variant="light"
            color="red"
            rightSection={<IconCancel/>}
            leftSection={<span/>}
            justify="space-between"
          >
            Cancelar
          </Button>
        </Group>
      </Modal>
    </Container>
  );
};

export default AdminDimensionsPage;
