"use client";

import { useEffect, useState } from "react";
import { Container, Table, Button, Modal, TextInput, Group, Pagination, Center, Select, MultiSelect, Text } from "@mantine/core";
import { IconEdit, IconTrash, IconEye } from "@tabler/icons-react";
import axios from "axios";
import { showNotification } from "@mantine/notifications";

interface Dimension {
  _id: string;
  name: string;
  responsible: string;
  producers: string[];
}

interface User {
  _id: string;
  full_name: string;
  email: string;
}

const AdminDimensionsPage = () => {
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [opened, setOpened] = useState(false);
  const [producersModalOpened, setProducersModalOpened] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState<Dimension | null>(null);
  const [selectedProducers, setSelectedProducers] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [responsible, setResponsible] = useState<string | null>(null);
  const [producers, setProducers] = useState<string[]>([]);
  const [responsiblesOptions, setResponsiblesOptions] = useState<{ value: string, label: string }[]>([]);
  const [producersOptions, setProducersOptions] = useState<{ value: string, label: string }[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const fetchDimensions = async (page: number, search: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dimensions/all`, {
        params: { page, limit: 10, search },
      });
      if (response.data) {
        setDimensions(response.data.dimensions || []);
        setTotalPages(response.data.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching dimensions:", error);
      setDimensions([]);
    }
  };

  const fetchResponsibles = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/responsibles`);
      if (response.data) {
        setResponsiblesOptions(
          response.data.map((user: User) => ({
            value: user.email,
            label: `${user.full_name} (${user.email})`,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching responsibles:", error);
    }
  };

  const fetchProducers = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/producers`);
      if (response.data) {
        setProducersOptions(
          response.data.map((user: User) => ({
            value: user.email,
            label: `${user.full_name} (${user.email})`,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching producers:", error);
    }
  };

  useEffect(() => {
    fetchDimensions(page, search);
    fetchResponsibles();
    fetchProducers();
  }, [page, search]);

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
        responsible,
        producers
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
  
      setOpened(false);
      setName("");
      setResponsible(null);
      setProducers([]);
      setSelectedDimension(null);
      fetchDimensions(page, search);
    } catch (error) {
      console.error("Error creando o actualizando dimensión:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al crear o actualizar la dimensión",
        color: "red",
      });
    }
  };
  

  const handleEdit = (dimension: Dimension) => {
    setSelectedDimension(dimension);
    setName(dimension.name);
    setResponsible(dimension.responsible);
    setProducers(dimension.producers);
    setOpened(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/dimensions/${id}`);
      showNotification({
        title: "Eliminado",
        message: "Dimensión eliminada exitosamente",
        color: "teal",
      });
      fetchDimensions(page, search);
    } catch (error) {
      console.error("Error eliminando dimensión:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al eliminar la dimensión",
        color: "red",
      });
    }
  };

  const handleShowProducers = (dimension: Dimension) => {
    setSelectedProducers(dimension.producers);
    setProducersModalOpened(true);
  };

  const rows = dimensions.map((dimension) => (
    <Table.Tr key={dimension._id}>
      <Table.Td>{dimension.name}</Table.Td>
      <Table.Td>{dimension.responsible}</Table.Td>
      <Table.Td>
        {dimension.producers.slice(0, 2).join(", ")}
        {dimension.producers.length > 2 && (
          <>
            , ...
            <Button variant="subtle" onClick={() => handleShowProducers(dimension)}>
              <IconEye size={16} />
            </Button>
          </>
        )}
      </Table.Td>
      <Table.Td>
        <Group gap={5}>
          <Button variant="outline" onClick={() => handleEdit(dimension)}>
            <IconEdit size={16} />
          </Button>
          <Button color="red" variant="outline" onClick={() => handleDelete(dimension._id)}>
            <IconTrash size={16} />
          </Button>
        </Group>
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
      <Button onClick={() => setOpened(true)}>Crear Nueva Dimensión</Button>
      <Table striped withTableBorder mt="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Responsable</Table.Th>
            <Table.Th>Productores</Table.Th>
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
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        onClose={() => setOpened(false)}
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
          data={responsiblesOptions}
          value={responsible}
          onChange={(value) => setResponsible(value)}
          searchable
          clearable
        />
        <MultiSelect
          label="Productores"
          placeholder="Selecciona productores"
          data={producersOptions}
          value={producers}
          onChange={setProducers}
          searchable
        />
        <Group mt="md">
          <Button onClick={handleCreateOrEdit}>
            {selectedDimension ? "Actualizar" : "Crear"}
          </Button>
        </Group>
      </Modal>
      <Modal
        opened={producersModalOpened}
        onClose={() => setProducersModalOpened(false)}
        title="Productores"
      >
        <Text>{selectedProducers.join(", ")}</Text>
      </Modal>
    </Container>
  );
};

export default AdminDimensionsPage;
