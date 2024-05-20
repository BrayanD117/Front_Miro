"use client";

import { useEffect, useState } from "react";
import { Container, Table, Button, Modal, TextInput, Group, Pagination, Center, MultiSelect } from "@mantine/core";
import axios from "axios";
import { showNotification } from "@mantine/notifications";

interface Dimension {
  _id: string;
  name: string;
  responsibles: string[];
}

interface User {
  _id: string;
  full_name: string;
  email: string;
}

const AdminDimensionsPage = () => {
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [opened, setOpened] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState<Dimension | null>(null);
  const [name, setName] = useState("");
  const [responsibles, setResponsibles] = useState<string[]>([]);
  const [producers, setProducers] = useState("");
  const [templates, setTemplates] = useState("");
  const [responsiblesOptions, setResponsiblesOptions] = useState<{ value: string, label: string }[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDimensions = async (page: number) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dimensions/all`, {
        params: { page, limit: 10 },
      });
      if (response.data) {
        setDimensions(response.data || []);
        setTotalPages(Math.ceil(response.data.length / 10));
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

  useEffect(() => {
    fetchDimensions(page);
    fetchResponsibles();
  }, [page]);

  const handleCreateOrEdit = async () => {
    if (!name) {
      showNotification({
        title: "Error",
        message: "El nombre es requerido",
        color: "red",
      });
      return;
    }

    try {
      const dimensionData = {
        name,
        responsibles,
        producers: producers.split(",").map((item) => item.trim()),
        templates: templates.split(",").map((item) => item.trim()),
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
      setResponsibles([]);
      setProducers("");
      setTemplates("");
      setSelectedDimension(null);
      fetchDimensions(page);
    } catch (error) {
      console.error("Error creating or updating dimension:", error);
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
    setResponsibles(dimension.responsibles);
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
      fetchDimensions(page);
    } catch (error) {
      console.error("Error deleting dimension:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al eliminar la dimensión",
        color: "red",
      });
    }
  };

  const rows = dimensions.map((dimension) => (
    <Table.Tr key={dimension._id}>
      <Table.Td>{dimension.name}</Table.Td>
      <Table.Td>{dimension.responsibles.join(", ")}</Table.Td>
      <Table.Td>
        <Button variant="outline" onClick={() => handleEdit(dimension)}>Editar</Button>
        <Button color="red" variant="outline" onClick={() => handleDelete(dimension._id)}>Eliminar</Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl">
      <Button onClick={() => setOpened(true)}>Crear Nueva Dimensión</Button>
      <Table mt="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Responsables</Table.Th>
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
        onClose={() => setOpened(false)}
        title={selectedDimension ? "Editar Dimensión" : "Crear Nueva Dimensión"}
      >
        <TextInput
          label="Nombre"
          placeholder="Nombre de la dimensión"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <MultiSelect
          label="Responsables"
          placeholder="Selecciona responsables"
          data={responsiblesOptions}
          value={responsibles}
          onChange={setResponsibles}
          searchable
        />
        <Group mt="md">
          <Button onClick={handleCreateOrEdit}>
            {selectedDimension ? "Actualizar" : "Crear"}
          </Button>
        </Group>
      </Modal>
    </Container>
  );
};

export default AdminDimensionsPage;
